import { apiClient, ApiError } from './client'
import type {
  PlannerStatusResponse,
  ProblemDetail,
  ProcessProgressEvent,
  ProcessSummaryResponse,
} from '@/types/api'

/** Callbacks and cancel signal for `streamProcess()`. */
export interface StreamProcessCallbacks {
  /** Receives the summary from the terminal `done` event. */
  onDone: (summary: ProcessSummaryResponse) => void
  /**
   * Receives a failure. The value is a parsed JSON error body, raw error text, an `ApiError`,
   * or a thrown error. Without this callback, `streamProcess()` throws the failure.
   */
  onError?: (error: unknown) => void
  /** Receives the pending dirty note state from the `init` event at the start of the run. */
  onInit?: (status: PlannerStatusResponse) => void
  /** Receives one `progress` event each time the backend starts a dirty date. */
  onProgress?: (progress: ProcessProgressEvent) => void
  /** Aborts the request. The backend stops at its next checkpoint and rolls back. */
  signal?: AbortSignal
}

function handleError(error: unknown, callbacks: StreamProcessCallbacks): void {
  if (callbacks.onError) {
    callbacks.onError(error)
  } else {
    throw error
  }
}

// Parses each complete SSE frame in `buffer` and returns the incomplete tail.
// The caller keeps the tail and adds the next chunk to it, because a frame can span two chunks.
function parseSseEvents(buffer: string, callbacks: StreamProcessCallbacks): string {
  const parts = buffer.split(/\r?\n\r?\n/)
  const remainder = parts.pop() ?? ''

  for (const part of parts) {
    if (!part.trim()) {
      continue
    }

    // A frame without an `event:` line stays a `message` event, and no branch handles it.
    // This rule also drops comment-only frames such as the `:ping` heartbeat.
    let eventName = 'message'
    const dataLines: string[] = []
    const lines = part.split(/\r?\n/)

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim())
      }
    }

    const dataStr = dataLines.join('\n')
    if (eventName === 'done') {
      try {
        const summary = JSON.parse(dataStr) as ProcessSummaryResponse
        callbacks.onDone(summary)
      } catch (err) {
        handleError(err, callbacks)
      }
    } else if (eventName === 'error') {
      // The backend sends JSON with ProblemDetail fields. Plain text goes to onError unchanged.
      try {
        const errorData = JSON.parse(dataStr)
        handleError(errorData, callbacks)
      } catch {
        handleError(dataStr, callbacks)
      }
    } else if (eventName === 'init') {
      try {
        callbacks.onInit?.(JSON.parse(dataStr) as PlannerStatusResponse)
      } catch (err) {
        handleError(err, callbacks)
      }
    } else if (eventName === 'progress') {
      try {
        callbacks.onProgress?.(JSON.parse(dataStr) as ProcessProgressEvent)
      } catch (err) {
        handleError(err, callbacks)
      }
    }
  }

  return remainder
}

/** Fetches the pending dirty note state with `GET /api/study-planner/status`. */
export function status(): Promise<PlannerStatusResponse> {
  return apiClient.get<PlannerStatusResponse>('/api/study-planner/status')
}

/**
 * Runs Process with `POST /api/study-planner/process` and reads the SSE response.
 * It routes `init`, `progress`, `done`, and `error` events to the callbacks.
 * It uses `fetch` with a stream reader because `EventSource` supports `GET` only.
 * The promise resolves when the stream ends.
 * An abort through `signal` resolves the promise and calls no callback.
 */
export async function streamProcess(callbacks: StreamProcessCallbacks): Promise<void> {
  const signal = callbacks.signal
  try {
    // Plain `fetch` skips the apiClient mock handler.
    // The mock adapter patches `fetch` to answer this call.
    const response = await fetch('/api/study-planner/process', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
      },
      credentials: 'include',
      signal,
    })

    if (!response.ok) {
      let errorPayload: unknown
      try {
        const text = await response.text()
        try {
          errorPayload = JSON.parse(text)
        } catch {
          errorPayload = text || `HTTP Error ${response.status}`
        }
      } catch {
        errorPayload = `HTTP Error ${response.status}`
      }

      // A JSON body goes to onError as an object, so process() can map it like an `error` event.
      const error =
        typeof errorPayload === 'object' && errorPayload !== null
          ? errorPayload
          : new ApiError(response.status, String(errorPayload))
      handleError(error, callbacks)
      return
    }

    if (response.body && typeof response.body.getReader === 'function') {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        // `stream: true` keeps a multi-byte character that spans two chunks intact.
        buffer += decoder.decode(value, { stream: true })
        buffer = parseSseEvents(buffer, callbacks)
      }

      // The last frame can arrive without a closing blank line. Add one so the parser reads it.
      if (buffer.trim()) {
        parseSseEvents(buffer + '\n\n', callbacks)
      }
    } else {
      // Fallback for environments without a readable body stream, such as some test mocks.
      const text = await response.text()
      parseSseEvents(text + '\n\n', callbacks)
    }
  } catch (err) {
    // An abort is a user cancel, not a failure. useProcess checks the status after a cancel.
    if (signal?.aborted) {
      return
    }
    handleError(err, callbacks)
  }
}

/**
 * Runs Process and resolves with the summary of the `done` event.
 * This wrapper ignores `init` and `progress` events. Use `streamProcess()` to receive them.
 * @throws ApiError when the backend sends an `error` event or an HTTP error status.
 * @throws Error when the stream ends without a `done` event.
 * @throws The abort reason of `signal` when the caller aborts the run.
 */
export function process(signal?: AbortSignal): Promise<ProcessSummaryResponse> {
  return new Promise((resolve, reject) => {
    // Set on the first settle, so the end-of-stream check does not reject a second time.
    let resolved = false

    streamProcess({
      signal,
      onDone: (summary) => {
        resolved = true
        resolve(summary)
      },
      onError: (err) => {
        resolved = true
        // Map each onError payload shape to an Error, so callers can always read `message`.
        if (err instanceof Error) {
          reject(err)
        } else if (typeof err === 'object' && err !== null && ('detail' in err || 'title' in err)) {
          const problem = err as ProblemDetail
          reject(
            new ApiError(
              problem.status ?? 400,
              problem.detail || problem.title || 'Error',
              problem,
            ),
          )
        } else if (typeof err === 'string') {
          reject(new Error(err))
        } else {
          reject(new Error('Process failed'))
        }
      },
    })
      .then(() => {
        // streamProcess() resolves silently on abort and on a stream without `done`.
        // Reject here, so the caller never waits on a promise that does not settle.
        if (!resolved) {
          if (signal?.aborted) {
            reject(signal.reason)
          } else {
            reject(new Error('Stream ended without completion event'))
          }
        }
      })
      .catch((err) => {
        if (!resolved) {
          reject(err)
        }
      })
  })
}

/** API service for the pending note status and the Process run. */
export const studyPlannerApi = {
  status,
  streamProcess,
  process,
}
