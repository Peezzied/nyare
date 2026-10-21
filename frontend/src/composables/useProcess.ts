import { ref } from 'vue'
import type { Ref } from 'vue'
import { studyPlannerApi } from '@/api'
import { createCache } from './createCache'
import { useNotifications } from './useNotifications'
import { useToasts } from './useToasts'
import type { PlannerStatusResponse, ProcessProgressEvent, ProcessSummaryResponse } from '@/api'

/** Callbacks that `useProcess` runs when a Process run ends. */
export interface UseProcessOptions {
  /** Runs after a successful run. `start()` waits for it before `running` becomes false. */
  onDone?: (summary: ProcessSummaryResponse) => void | Promise<void>
  /** Runs when the status recheck shows that a cancelled run committed. */
  onSavedAfterCancel?: () => void | Promise<void>
}

/** Converts an Error, an RFC 7807 problem body, or a string into a display message. */
function toMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message
  }
  if (typeof err === 'object' && err !== null) {
    const detail = (err as { detail?: unknown }).detail
    const title = (err as { title?: unknown }).title
    if (typeof detail === 'string' && detail) {
      return detail
    }
    if (typeof title === 'string' && title) {
      return title
    }
  }
  if (typeof err === 'string') {
    return err
  }
  return 'Process failed'
}

// Module-level run state, so a run survives navigation between views.
const running = ref(false)
const recordId = ref<string | null>(null)
const status = ref<PlannerStatusResponse | null>(null)
const progress = ref<ProcessProgressEvent | null>(null)
const summary = ref<ProcessSummaryResponse | null>(null)
const error = ref<string | null>(null)
const cancelled = ref(false)
const savedAfterCancel = ref(false)

let controller: AbortController | null = null
// start() increments runId. verifyCancel() compares ids to drop stale results.
let runId = 0

const cache = createCache(() => {
  runId += 1
  controller?.abort()
  controller = null
  running.value = false
  recordId.value = null
  status.value = null
  progress.value = null
  summary.value = null
  error.value = null
  cancelled.value = false
  savedAfterCancel.value = false
})

/** Aborts the active run and clears the run state. `resetAllCaches()` calls this. */
export function resetProcess(): void {
  cache.reset()
}

/** State and controls that `useProcess` returns. */
export interface UseProcess {
  /** True while the stream is open and while `options.onDone` runs. */
  running: Ref<boolean>
  /** Id of the notification record that tracks the latest run. Null after reset. */
  recordId: Ref<string | null>
  /** Planner status from the `init` event. Null until the stream sends it. */
  status: Ref<PlannerStatusResponse | null>
  /** Latest per-date `progress` event. */
  progress: Ref<ProcessProgressEvent | null>
  /** Result from the `done` event. Null when the run fails or cancels. */
  summary: Ref<ProcessSummaryResponse | null>
  /** Message from an `error` event, a thrown error, or a failed callback. */
  error: Ref<string | null>
  /** True after `cancel()` aborts the run. Resets when the recheck shows the run committed. */
  cancelled: Ref<boolean>
  /** True when a cancelled run committed on the server before the abort took effect. */
  savedAfterCancel: Ref<boolean>
  /** Starts a run. Resolves with the summary, or null if a run is active, fails, or cancels. */
  start: () => Promise<ProcessSummaryResponse | null>
  /** Aborts the active run. Does nothing when no run is active. */
  cancel: () => void
}

/**
 * Runs one study-planner Process call and exposes its live status, per-date
 * progress, summary, error, and cancel state. Call `cancel()` to abort; the
 * backend stops at the next checkpoint and rolls back. Navigation does not
 * cancel a run: only `cancel()` or a session reset does. In `options.onDone`,
 * refresh tasks and academic events for `summary.affectedCourseIds` — do not
 * refetch courses or schedules (see Backend Roundtrip Conventions in
 * frontend/AGENTS.md). A run may rename notes still titled "Untitled Note",
 * so force-reload notes only when the cache holds one. After a cancel, the
 * planner status is rechecked in the background; if the run had already
 * committed, `savedAfterCancel` becomes true and `options.onSavedAfterCancel`
 * runs — refetch tasks and academic events in full there, since there is no
 * summary to give affected course ids.
 */
export function useProcess(options: UseProcessOptions = {}): UseProcess {
  const notifications = useNotifications()

  async function start(): Promise<ProcessSummaryResponse | null> {
    if (running.value) {
      return null
    }

    const id = ++runId
    const recId = notifications.openRecord()
    recordId.value = recId
    controller = new AbortController()
    status.value = null
    progress.value = null
    summary.value = null
    error.value = null
    cancelled.value = false
    savedAfterCancel.value = false
    running.value = true

    try {
      await studyPlannerApi.streamProcess({
        signal: controller.signal,
        onInit: (s) => {
          status.value = s
          notifications.applyInit(recId, s)
        },
        onProgress: (p) => {
          progress.value = p
          notifications.patchRecord(recId, { progress: p })
        },
        onDone: (s) => {
          summary.value = s
          notifications.patchRecord(recId, { summary: s })
        },
        onError: (err) => {
          const message = toMessage(err)
          error.value = message
          notifications.patchRecord(recId, { error: message })
        },
      })
      if (summary.value) {
        // The run committed; a failed UI refresh is not a run error.
        try {
          await options.onDone?.(summary.value)
        } catch {
          useToasts().pushToast({
            kind: 'info',
            title: 'Saved, refresh failed',
            detail: 'Reload to see the new tasks and events.',
          })
        }
      }
      // streamProcess resolves silently on abort. The server may still have committed, so
      // recheck in the background. A session reset bumps the run generation and skips it.
      if (cancelled.value && !summary.value && id === runId) {
        void verifyCancel(id, status.value, recId)
      }
    } catch (err) {
      const message = toMessage(err)
      error.value = message
      notifications.patchRecord(recId, { error: message })
    } finally {
      notifications.finishRecord(
        recId,
        summary.value ? 'done' : cancelled.value ? 'cancelled' : 'error',
      )
      if (id === runId) {
        running.value = false
        controller = null
      }
    }

    return summary.value
  }

  /** Rechecks planner status after a cancel and flags a run that committed anyway. */
  async function verifyCancel(
    id: number,
    before: PlannerStatusResponse | null,
    recordId: string,
  ): Promise<void> {
    let after: PlannerStatusResponse
    try {
      after = await studyPlannerApi.status()
    } catch {
      return
    }
    // A newer run or a session reset makes this result stale.
    if (id !== runId) {
      return
    }
    // With init notes, the run committed when none of them stay pending. Without them,
    // fall back to the global pending flag.
    const pending = new Set(after.pendingNotes.map((n) => n.id))
    const committed = before?.pendingNotes.length
      ? !before.pendingNotes.some((n) => pending.has(n.id))
      : !after.hasPendingNotes
    if (!committed) {
      return
    }
    cancelled.value = false
    savedAfterCancel.value = true
    notifications.patchRecord(recordId, { status: 'saved-after-cancel' })
    try {
      await options.onSavedAfterCancel?.()
    } catch (err) {
      // Do not overwrite the error state of a newer run.
      if (id === runId) {
        error.value = toMessage(err)
      }
    }
  }

  function cancel(): void {
    if (!running.value || !controller) {
      return
    }
    cancelled.value = true
    controller.abort()
  }

  return {
    running,
    recordId,
    status,
    progress,
    summary,
    error,
    cancelled,
    savedAfterCancel,
    start,
    cancel,
  }
}
