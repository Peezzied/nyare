import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, ApiError, setMockHandler } from '../client'
import type { ProblemDetail } from '@/types/api'

// Builds a partial Response with only the members that the client reads.
function createMockResponse(options: {
  ok: boolean
  status: number
  headers?: Headers
  json?: () => Promise<unknown>
  text?: () => Promise<string>
}): Response {
  return {
    ok: options.ok,
    status: options.status,
    headers: options.headers ?? new Headers(),
    json: options.json ?? (async () => ({})),
    text: options.text ?? (async () => ''),
  } as unknown as Response
}

describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Remove the mock handler, so requests reach the stubbed `fetch`.
    setMockHandler(null)
  })

  it('performs GET request and parses JSON body', async () => {
    const mockData = [{ id: 1, name: 'CS 101' }]
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockData,
      }),
    )

    const result = await apiClient.get<typeof mockData>('/api/courses')
    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/courses',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    )
  })

  it('serializes query parameters in GET request', async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [],
      }),
    )

    await apiClient.get('/api/tasks', { courseId: 10, status: 'TODO', active: true })
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/tasks?courseId=10&status=TODO&active=true',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    )
  })

  it('performs POST request with JSON stringified body and content-type header', async () => {
    const payload = { name: 'CS 102' }
    const responsePayload = { id: 2, name: 'CS 102' }
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responsePayload,
      }),
    )

    const result = await apiClient.post<typeof responsePayload>('/api/courses', payload)
    expect(result).toEqual(responsePayload)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/courses',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify(payload),
        credentials: 'include',
      }),
    )
  })

  it('performs PUT request with body', async () => {
    const payload = { name: 'CS 102 Updated' }
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => payload,
      }),
    )

    const result = await apiClient.put<typeof payload>('/api/courses/2', payload)
    expect(result).toEqual(payload)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/courses/2',
      expect.objectContaining({
        method: 'PUT',
        credentials: 'include',
      }),
    )
  })

  it('performs PATCH request with body', async () => {
    const payload = { status: 'COMPLETED' }
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => payload,
      }),
    )

    const result = await apiClient.patch<typeof payload>('/api/tasks/task-1/status', payload)
    expect(result).toEqual(payload)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/tasks/task-1/status',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
      }),
    )
  })

  it('performs DELETE request and handles 204 No Content', async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 204,
      }),
    )

    const result = await apiClient.delete('/api/courses/1')
    expect(result).toBeUndefined()
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/courses/1',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    )
  })

  it('performs upload with FormData and does not set manual Content-Type header', async () => {
    const file = new File(['content'], 'syllabus.pdf', { type: 'application/pdf' })
    const mockUploadResponse = { id: 'img-1', url: '/uploads/syllabus.pdf' }
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockUploadResponse,
      }),
    )

    const result = await apiClient.upload<typeof mockUploadResponse>('/api/images', file)
    expect(result).toEqual(mockUploadResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/images',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
    const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const options = callArgs?.[1] as RequestInit
    expect(options.body).toBeInstanceOf(FormData)
    // The browser sets Content-Type with the multipart boundary, so the client must not set it.
    expect((options.headers as Record<string, string>)?.['Content-Type']).toBeUndefined()
  })

  it('throws ApiError with ProblemDetail payload on 400 response', async () => {
    const errorPayload: ProblemDetail = {
      title: 'Bad Request',
      status: 400,
      detail: 'Name cannot be blank',
    }
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => errorPayload,
      }),
    )

    await expect(apiClient.post('/api/courses', { name: '' })).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(400)
      expect(apiErr.message).toBe('Name cannot be blank')
      expect(apiErr.problem).toEqual(errorPayload)
      return true
    })
  })

  it('throws ApiError with text message on non-JSON error response', async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Internal Server Error',
      }),
    )

    await expect(apiClient.get('/api/courses')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(500)
      expect(apiErr.message).toBe('Internal Server Error')
      expect(apiErr.problem).toBeUndefined()
      return true
    })
  })

  describe('MockHandler', () => {
    it('routes requests to MockHandler when registered', async () => {
      const mockResult = [{ id: 99, name: 'Mocked Course' }]
      setMockHandler((method, url) => {
        if (method === 'GET' && url === '/api/courses') {
          return { status: 200, data: mockResult }
        }
        return null
      })

      const fetchSpy = vi.fn<typeof fetch>()
      globalThis.fetch = fetchSpy

      const result = await apiClient.get<typeof mockResult>('/api/courses')
      expect(result).toEqual(mockResult)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('throws ApiError when MockHandler returns error status', async () => {
      setMockHandler(() => {
        return {
          status: 404,
          data: {
            title: 'Not Found',
            status: 404,
            detail: 'Course not found',
          },
        }
      })

      await expect(apiClient.get('/api/courses/999')).rejects.toSatisfy((err: unknown) => {
        expect(err).toBeInstanceOf(ApiError)
        const apiErr = err as ApiError
        expect(apiErr.status).toBe(404)
        expect(apiErr.message).toBe('Course not found')
        return true
      })
    })

    it('falls through to fetch when MockHandler returns null', async () => {
      setMockHandler(() => null)

      const fallbackData = [{ id: 1, name: 'Real Course' }]
      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue(
        createMockResponse({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => fallbackData,
        }),
      )

      const result = await apiClient.get<typeof fallbackData>('/api/courses')
      expect(result).toEqual(fallbackData)
      expect(globalThis.fetch).toHaveBeenCalled()
    })
  })
})
