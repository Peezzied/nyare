import { describe, it, expect, vi, beforeEach } from 'vitest'
import { effectScope } from 'vue'
import { studyPlannerApi } from '@/api'
import { useProcess } from '../useProcess'
import { useToasts } from '../useToasts'
import { resetAllCaches } from '../createCache'
import type { StreamProcessCallbacks } from '@/api'
import type { PlannerStatusResponse, ProcessProgressEvent, ProcessSummaryResponse } from '@/api'

const statusPayload: PlannerStatusResponse = {
  hasPendingNotes: true,
  dirtyNoteCount: 2,
  dirtyDates: ['2026-10-01', '2026-10-03'],
  courseNames: ['CS101'],
  pendingNotes: [
    { id: 'note-1', title: null, courseName: 'CS101', entryDate: '2026-10-01' },
    { id: 'note-2', title: null, courseName: 'CS101', entryDate: '2026-10-03' },
  ],
}

const nothingPendingStatus: PlannerStatusResponse = {
  hasPendingNotes: false,
  dirtyNoteCount: 0,
  dirtyDates: [],
  courseNames: [],
  pendingNotes: [],
}

const progressPayload: ProcessProgressEvent = { date: '2026-10-01', index: 1, total: 2 }

const summaryPayload: ProcessSummaryResponse = {
  tasksCreated: 2,
  eventsCreated: 1,
  contextsCreated: 1,
  affectedCourseIds: [1],
}

describe('useProcess', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // The run state is module-level, so clear it to isolate each test.
    resetAllCaches()
    // Default: every note is still pending after a cancel (rolled back).
    vi.spyOn(studyPlannerApi, 'status').mockResolvedValue(statusPayload)
  })

  it('populates status, progress, and summary on success', async () => {
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      async (callbacks: StreamProcessCallbacks) => {
        callbacks.onInit?.(statusPayload)
        callbacks.onProgress?.(progressPayload)
        callbacks.onDone(summaryPayload)
      },
    )

    const onDone = vi.fn<(s: ProcessSummaryResponse) => void>()
    const proc = useProcess({ onDone })

    const promise = proc.start()
    expect(proc.running.value).toBe(true)

    const result = await promise

    expect(result).toEqual(summaryPayload)
    expect(proc.status.value).toEqual(statusPayload)
    expect(proc.progress.value).toEqual(progressPayload)
    expect(proc.summary.value).toEqual(summaryPayload)
    expect(proc.error.value).toBeNull()
    expect(proc.running.value).toBe(false)
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(onDone).toHaveBeenCalledWith(summaryPayload)
  })

  it('awaits the onDone hook before the run ends', async () => {
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      async (callbacks: StreamProcessCallbacks) => {
        callbacks.onDone(summaryPayload)
      },
    )

    let runningDuringHook: boolean | undefined
    const proc = useProcess({
      onDone: async () => {
        await Promise.resolve()
        runningDuringHook = proc.running.value
        throw new Error('refresh failed')
      },
    })

    const result = await proc.start()

    // The run committed, so a failed refresh is a toast, not the run error state.
    expect(runningDuringHook).toBe(true)
    expect(result).toEqual(summaryPayload)
    expect(proc.error.value).toBeNull()
    expect(proc.summary.value).toEqual(summaryPayload)
    expect(proc.running.value).toBe(false)
    expect(useToasts().toasts.value.some((t) => t.title === 'Saved, refresh failed')).toBe(true)
  })

  it('exposes the error detail on an error event', async () => {
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      async (callbacks: StreamProcessCallbacks) => {
        callbacks.onError?.({
          status: 400,
          title: 'Bad Request',
          detail: 'No journal notes found to process',
        })
      },
    )

    const proc = useProcess()
    const result = await proc.start()

    expect(proc.error.value).toBe('No journal notes found to process')
    expect(proc.summary.value).toBeNull()
    expect(result).toBeNull()
    expect(proc.running.value).toBe(false)
  })

  it('aborts the stream when cancel is called', async () => {
    let signal: AbortSignal | undefined
    // The stub stays open until abort and then resolves, like the real streamProcess.
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          signal = callbacks.signal
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    const proc = useProcess()
    const promise = proc.start()
    expect(proc.running.value).toBe(true)

    proc.cancel()
    await promise

    expect(signal?.aborted).toBe(true)
    expect(proc.cancelled.value).toBe(true)
    expect(proc.running.value).toBe(false)
    expect(proc.error.value).toBeNull()
    expect(proc.summary.value).toBeNull()
  })

  it('returns null and does not request again when already running', async () => {
    const streamSpy = vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    const proc = useProcess()
    const first = proc.start()
    const second = await proc.start()

    expect(second).toBeNull()
    expect(streamSpy).toHaveBeenCalledTimes(1)

    proc.cancel()
    await first
  })

  it('keeps cancelled when the init notes are still pending after cancel', async () => {
    const statusSpy = vi.spyOn(studyPlannerApi, 'status')
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks.onInit?.(statusPayload)
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    const onSavedAfterCancel = vi.fn<() => void>()
    const proc = useProcess({ onSavedAfterCancel })
    const promise = proc.start()

    proc.cancel()
    await promise

    await vi.waitFor(() => expect(statusSpy).toHaveBeenCalled())
    // Let the background verifyCancel() finish before the assertions.
    await new Promise((r) => setTimeout(r))

    expect(proc.cancelled.value).toBe(true)
    expect(proc.savedAfterCancel.value).toBe(false)
    expect(onSavedAfterCancel).not.toHaveBeenCalled()
  })

  it('flips to savedAfterCancel when the run committed despite cancel', async () => {
    let resolveStatus: (s: PlannerStatusResponse) => void = () => {}
    // Hold the status recheck open to assert the state before it resolves.
    vi.spyOn(studyPlannerApi, 'status').mockReturnValue(
      new Promise<PlannerStatusResponse>((resolve) => {
        resolveStatus = resolve
      }),
    )
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks.onInit?.(statusPayload)
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    const onSavedAfterCancel = vi.fn<() => void>()
    const proc = useProcess({ onSavedAfterCancel })
    const promise = proc.start()

    proc.cancel()
    await promise

    expect(proc.running.value).toBe(false)
    expect(proc.cancelled.value).toBe(true)

    resolveStatus(nothingPendingStatus)

    await vi.waitFor(() => expect(proc.savedAfterCancel.value).toBe(true))
    expect(proc.cancelled.value).toBe(false)
    expect(onSavedAfterCancel).toHaveBeenCalledTimes(1)
  })

  it('keeps cancelled without error when the status recheck fails', async () => {
    vi.spyOn(studyPlannerApi, 'status').mockRejectedValue(new Error('timeout'))
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          callbacks.onInit?.(statusPayload)
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    const proc = useProcess()
    const promise = proc.start()

    proc.cancel()
    await promise
    await vi.waitFor(() => expect(studyPlannerApi.status).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r))

    expect(proc.cancelled.value).toBe(true)
    expect(proc.error.value).toBeNull()
    expect(proc.savedAfterCancel.value).toBe(false)
  })

  it('does not cancel the run when the owning scope is disposed', async () => {
    let signal: AbortSignal | undefined
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          signal = callbacks.signal
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    // effectScope stands in for a component. scope.stop() must not cancel the run.
    const scope = effectScope()
    const proc = scope.run(() => useProcess())!

    const promise = proc.start()
    expect(proc.running.value).toBe(true)

    scope.stop()
    await new Promise((r) => setTimeout(r))

    expect(signal?.aborted).toBe(false)
    expect(proc.running.value).toBe(true)

    proc.cancel()
    await promise
    expect(proc.cancelled.value).toBe(true)
    expect(proc.running.value).toBe(false)
  })

  it('aborts the active run and clears state when resetAllCaches runs', async () => {
    let signal: AbortSignal | undefined
    vi.spyOn(studyPlannerApi, 'streamProcess').mockImplementation(
      (callbacks: StreamProcessCallbacks) =>
        new Promise<void>((resolve) => {
          signal = callbacks.signal
          callbacks.signal?.addEventListener('abort', () => resolve())
        }),
    )

    const proc = useProcess()
    const promise = proc.start()
    expect(proc.running.value).toBe(true)

    resetAllCaches()
    await promise

    expect(signal?.aborted).toBe(true)
    expect(proc.running.value).toBe(false)
    expect(proc.summary.value).toBeNull()
    expect(proc.error.value).toBeNull()
  })
})
