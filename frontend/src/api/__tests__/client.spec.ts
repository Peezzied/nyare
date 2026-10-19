import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiError, apiClient, setMockHandler, setUnauthorizedHandler } from '../client'

const unauthorizedBody = {
  title: 'Unauthorized',
  status: 401,
  detail: 'Authentication required',
}

describe('apiClient unauthorized handler', () => {
  let handler = vi.fn<() => void>()

  beforeEach(() => {
    handler = vi.fn<() => void>()
    setUnauthorizedHandler(handler)
  })

  afterEach(() => {
    setUnauthorizedHandler(null)
    setMockHandler(null)
    vi.restoreAllMocks()
  })

  it('calls the handler once on a protected 401 and rejects with ApiError 401', async () => {
    setMockHandler(() => ({ status: 401, data: unauthorizedBody }))

    await expect(apiClient.get('/api/courses')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not call the handler on a 401 from /api/users/me', async () => {
    setMockHandler(() => ({ status: 401, data: unauthorizedBody }))

    await expect(apiClient.get('/api/users/me')).rejects.toBeInstanceOf(ApiError)
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call the handler on a 401 from /api/users/login', async () => {
    setMockHandler(() => ({ status: 401, data: unauthorizedBody }))

    await expect(apiClient.post('/api/users/login', { username: 'alice' })).rejects.toBeInstanceOf(
      ApiError,
    )
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call the handler on a non-401 failure', async () => {
    setMockHandler(() => ({ status: 404, data: { title: 'Not Found', status: 404 } }))

    await expect(apiClient.get('/api/courses')).rejects.toMatchObject({ status: 404 })
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects normally without a registered handler', async () => {
    setUnauthorizedHandler(null)
    setMockHandler(() => ({ status: 401, data: unauthorizedBody }))

    await expect(apiClient.get('/api/courses')).rejects.toMatchObject({ status: 401 })
  })

  it('calls the handler on a protected 401 from the fetch branch', async () => {
    globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/problem+json' }),
      text: async () => JSON.stringify(unauthorizedBody),
    } as unknown as Response)

    await expect(apiClient.get('/api/tasks')).rejects.toMatchObject({ status: 401 })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
