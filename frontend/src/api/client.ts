import type { ProblemDetail } from '@/types/api'

export class ApiError extends Error {
  readonly status: number
  readonly problem?: ProblemDetail

  constructor(status: number, message: string, problem?: ProblemDetail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export type MockHandler = (
  method: string,
  url: string,
  body?: unknown,
) => Promise<{ status: number; data?: unknown } | null> | { status: number; data?: unknown } | null

let mockHandler: MockHandler | null = null

export function setMockHandler(handler: MockHandler | null): void {
  mockHandler = handler
}

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

async function request<T>(
  method: string,
  path: string,
  options?: { body?: unknown; params?: QueryParams; headers?: Record<string, string> },
): Promise<T> {
  const fullUrl = buildUrl(path, options?.params)

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
    if (options.body instanceof FormData) {
      body = options.body
    } else {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    body,
    credentials: 'include',
  })

  return handleResponse<T>(response)
}

export const apiClient = {
  get<T>(url: string, params?: QueryParams): Promise<T> {
    return request<T>('GET', url, { params })
  },

  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>('POST', url, { body })
  },

  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>('PUT', url, { body })
  },

  patch<T>(url: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', url, { body })
  },

  delete(url: string): Promise<void> {
    return request<void>('DELETE', url)
  },

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
