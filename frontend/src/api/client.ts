import type { ProblemDetail } from '@/types/api'

/**
 * Error for a failed API call, such as a non-2xx HTTP response or a Process `error` event.
 * The message is the ProblemDetail `detail`, its `title`, the body text, or a generic text.
 */
export class ApiError extends Error {
  /** HTTP status code of the failure. */
  readonly status: number
  /** Parsed RFC 7807 body. It is absent when the response body is not JSON. */
  readonly problem?: ProblemDetail

  constructor(status: number, message: string, problem?: ProblemDetail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
    // Restore the prototype chain so that `instanceof ApiError` works on transpiled targets.
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * Function that answers requests in place of `fetch`.
 * Return `null` to let the request go to the network.
 */
export type MockHandler = (
  method: string,
  url: string,
  body?: unknown,
) => Promise<{ status: number; data?: unknown } | null> | { status: number; data?: unknown } | null

let mockHandler: MockHandler | null = null

/** Registers a mock handler for all `apiClient` requests. Pass `null` to remove it. */
export function setMockHandler(handler: MockHandler | null): void {
  mockHandler = handler
}

/** Handler that runs once when a protected request answers 401. */
let unauthorizedHandler: (() => void) | null = null

/**
 * Registers the handler that runs when a protected request answers 401.
 * The client skips the handler for `/api/users/me` and `/api/users/login`.
 * Pass `null` to remove it.
 */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

/**
 * Runs the registered unauthorized handler for a protected path.
 * It skips the session probe `/api/users/me` and the login call `/api/users/login`.
 * Callers invoke it only when the response status is 401.
 */
export function notifyUnauthorized(path: string): void {
  if (path !== '/api/users/me' && path !== '/api/users/login') {
    unauthorizedHandler?.()
  }
}

/** Query parameters for a GET request. The client skips `undefined` and `null` values. */
export type QueryParams = Record<string, unknown> | object

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) {
    return path
  }

  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  }

  const query = searchParams.toString()
  if (!query) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}${query}`
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as unknown as T
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  if (!response.ok) {
    if (isJson) {
      try {
        const problem = (await response.json()) as ProblemDetail
        const message = problem.detail || problem.title || `HTTP Error ${response.status}`
        throw new ApiError(response.status, message, problem)
      } catch (err) {
        if (err instanceof ApiError) {
          throw err
        }
        // The body claims JSON but does not parse. Keep the status and use a generic message.
        throw new ApiError(response.status, `HTTP Error ${response.status}`)
      }
    }

    const text = await response.text()
    throw new ApiError(response.status, text || `HTTP Error ${response.status}`)
  }

  if (isJson) {
    return (await response.json()) as T
  }

  return (await response.text()) as unknown as T
}

/**
 * Runs a request and reports a protected 401 to the registered unauthorized handler.
 * The handler does not run for the session probe and the login call.
 */
async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; params?: QueryParams; headers?: Record<string, string> },
): Promise<T> {
  try {
    return await sendRequest<T>(method, path, options)
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      notifyUnauthorized(path)
    }
    throw err
  }
}

async function sendRequest<T>(
  method: string,
  path: string,
  options?: { body?: unknown; params?: QueryParams; headers?: Record<string, string> },
): Promise<T> {
  const fullUrl = buildUrl(path, options?.params)

  // The mock handler sees the URL with its query string, so it can filter like the backend.
  // A `null` result means the mock has no route, and the request goes to `fetch`.
  if (mockHandler) {
    const mockResult = await mockHandler(method, fullUrl, options?.body)
    if (mockResult) {
      if (mockResult.status === 204) {
        return undefined as unknown as T
      }

      if (mockResult.status >= 200 && mockResult.status < 300) {
        return mockResult.data as T
      }

      const problem =
        typeof mockResult.data === 'object' && mockResult.data !== null
          ? (mockResult.data as ProblemDetail)
          : undefined
      const message =
        problem?.detail ||
        problem?.title ||
        (typeof mockResult.data === 'string' ? mockResult.data : `HTTP Error ${mockResult.status}`)
      throw new ApiError(mockResult.status, message, problem)
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options?.headers,
  }

  let body: BodyInit | undefined
  if (options?.body !== undefined) {
    // Do not set Content-Type for FormData. The browser adds it with the multipart boundary.
    if (options.body instanceof FormData) {
      body = options.body
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
  }

  // The backend keeps the user in a session cookie, so each request sends credentials.
  const response = await fetch(fullUrl, {
    method,
    headers,
    body,
    credentials: 'include',
  })

  return handleResponse<T>(response)
}

/**
 * JSON REST client for the Nyare backend.
 * Each method resolves with the parsed JSON body, the text body, or `undefined` for HTTP 204.
 * Each method rejects with an `ApiError` for a non-2xx response.
 */
export const apiClient = {
  /** Sends a GET request and appends `params` as the query string. */
  get<T>(url: string, params?: QueryParams): Promise<T> {
    return request<T>('GET', url, { params })
  },

  /** Sends a POST request with `body` as JSON. */
  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>('POST', url, { body })
  },

  /** Sends a PUT request with `body` as JSON. */
  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>('PUT', url, { body })
  },

  /** Sends a PATCH request with `body` as JSON. */
  patch<T>(url: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', url, { body })
  },

  /** Sends a DELETE request. */
  delete(url: string): Promise<void> {
    return request<void>('DELETE', url)
  },

  /**
   * Sends a multipart POST request.
   * A `File` goes in the `file` form field. A `FormData` value goes unchanged.
   */
  upload<T>(url: string, file: File | FormData): Promise<T> {
    let body: FormData
    if (file instanceof FormData) {
      body = file
    } else {
      body = new FormData()
      body.append('file', file)
    }
    return request<T>('POST', url, { body })
  },
}
