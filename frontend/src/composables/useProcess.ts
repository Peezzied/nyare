import { getCurrentScope, onScopeDispose, ref } from 'vue'
import type { Ref } from 'vue'
import { studyPlannerApi } from '@/api'
import type { PlannerStatusResponse, ProcessProgressEvent, ProcessSummaryResponse } from '@/api'

export interface UseProcessOptions {
  onDone?: (summary: ProcessSummaryResponse) => void | Promise<void>
  onSavedAfterCancel?: () => void | Promise<void>
}

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

export interface UseProcess {
  running: Ref<boolean>
  status: Ref<PlannerStatusResponse | null>
  progress: Ref<ProcessProgressEvent | null>
  summary: Ref<ProcessSummaryResponse | null>
  error: Ref<string | null>
  cancelled: Ref<boolean>
  savedAfterCancel: Ref<boolean>
  start: () => Promise<ProcessSummaryResponse | null>
  cancel: () => void
}

/**
 * Runs one study-planner Process call and exposes its live status, per-date
 * progress, summary, error, and cancel state. Call `cancel()` to abort; the
 * backend stops at the next checkpoint and rolls back. The run also cancels
 * when the calling component or effect scope disposes. In `options.onDone`,
 * refresh tasks and academic events for `summary.affectedCourseIds` — do not
 * refetch courses, schedules, or notes (see Backend Roundtrip Conventions in
 * frontend/AGENTS.md). After a cancel, the planner status is rechecked in the
 * background; if the run had already committed, `savedAfterCancel` becomes
 * true and `options.onSavedAfterCancel` runs — refetch tasks and academic
 * events in full there, since there is no summary to give affected course ids.
 */
export function useProcess(options: UseProcessOptions = {}): UseProcess {
  const running = ref(false)
  const status = ref<PlannerStatusResponse | null>(null)
  const progress = ref<ProcessProgressEvent | null>(null)
  const summary = ref<ProcessSummaryResponse | null>(null)
  const error = ref<string | null>(null)
  const cancelled = ref(false)
  const savedAfterCancel = ref(false)

  let controller: AbortController | null = null
  let runId = 0
  let disposed = false

  async function start(): Promise<ProcessSummaryResponse | null> {
    if (running.value) {
      return null
    }

    const id = ++runId
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
        },
        onProgress: (p) => {
          progress.value = p
        },
        onDone: (s) => {
          summary.value = s
        },
        onError: (err) => {
          error.value = toMessage(err)
        },
      })
      if (summary.value) {
        await options.onDone?.(summary.value)
      }
      if (cancelled.value && !summary.value && !disposed) {
        void verifyCancel(id, status.value)
      }
    } catch (err) {
      error.value = toMessage(err)
    } finally {
      running.value = false
      controller = null
    }

    return summary.value
  }

  async function verifyCancel(id: number, before: PlannerStatusResponse | null): Promise<void> {
    let after: PlannerStatusResponse
    try {
      after = await studyPlannerApi.status()
    } catch {
      return
    }
    if (id !== runId || disposed) {
      return
    }
    const pending = new Set(after.pendingNotes.map((n) => n.id))
    const committed = before?.pendingNotes.length
      ? !before.pendingNotes.some((n) => pending.has(n.id))
      : !after.hasPendingNotes
    if (!committed) {
      return
    }
    cancelled.value = false
    savedAfterCancel.value = true
    try {
      await options.onSavedAfterCancel?.()
    } catch (err) {
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

  if (getCurrentScope()) {
    onScopeDispose(() => {
      disposed = true
      cancel()
    })
  }

  return { running, status, progress, summary, error, cancelled, savedAfterCancel, start, cancel }
}
