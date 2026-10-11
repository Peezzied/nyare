import { ApiError } from './client'
import type { ProblemDetail, ProcessSummaryResponse } from '@/types/api'

export interface StreamProcessCallbacks {
  onDone: (summary: ProcessSummaryResponse) => void
  onError?: (error: unknown) => void
}

function handleError(error: unknown, callbacks: StreamProcessCallbacks): void {
  if (callbacks.onError) {
    callbacks.onError(error)
  } else {
    throw error
  }
}

function parseSseEvents(buffer: string, callbacks: StreamProcessCallbacks): string {
  const parts = buffer.split(/\r?\n\r?\n/)
  const remainder = parts.pop() ?? ''

  for (const part of parts) {
    if (!part.trim()) {
      continue
    }

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
      try {
        const errorData = JSON.parse(dataStr)
        handleError(errorData, callbacks)
      } catch {
        handleError(dataStr, callbacks)
      }
    }
  }

  return remainder
}

export async function streamProcess(callbacks: StreamProcessCallbacks): Promise<void> {
  try {
    const response = await fetch('/api/study-planner/process', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
      },
      credentials: 'include',
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
        buffer += decoder.decode(value, { stream: true })
        buffer = parseSseEvents(buffer, callbacks)
      }

      if (buffer.trim()) {
        parseSseEvents(buffer + '\n\n', callbacks)
      }
    } else {
      const text = await response.text()
      parseSseEvents(text + '\n\n', callbacks)
    }
  } catch (err) {
    handleError(err, callbacks)
  }
}

export function process(): Promise<ProcessSummaryResponse> {
  return new Promise((resolve, reject) => {
    let resolved = false

    streamProcess({
      onDone: (summary) => {
        resolved = true
        resolve(summary)
      },
      onError: (err) => {
        resolved = true
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
        if (!resolved) {
          reject(new Error('Stream ended without completion event'))
        }
      })
      .catch((err) => {
        if (!resolved) {
          reject(err)
        }
      })
  })
}

export const studyPlannerApi = {
  streamProcess,
  process,
}
