import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { UserResponse } from '@/types/api'

const mockUser: UserResponse = {
  id: 1,
  username: 'karol',
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-01T09:00:00Z',
}

const getCurrentUser = vi.fn<() => Promise<UserResponse>>()

vi.mock('@/api', () => {
  class ApiError extends Error {
    constructor(
      readonly status: number,
      message: string,
    ) {
      super(message)
    }
  }
  return {
    ApiError,
    authApi: {
      getCurrentUser: (...args: unknown[]) => getCurrentUser(...(args as [])),
    },
  }
})

describe('useAuth', () => {
  beforeEach(async () => {
    const { clearSessionUser } = await import('../useAuth')
    clearSessionUser()
    getCurrentUser.mockReset()
  })

  it('returns the session user when /me succeeds', async () => {
    getCurrentUser.mockResolvedValueOnce(mockUser)
    const { useAuth } = await import('../useAuth')
    const { user, ensureSession } = useAuth()

    await expect(ensureSession()).resolves.toEqual(mockUser)
    expect(user.value).toEqual(mockUser)
    expect(getCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('returns null when /me confirms no session with a 401', async () => {
    const { ApiError } = await import('@/api')
    getCurrentUser.mockRejectedValueOnce(new ApiError(401, 'User not authenticated'))
    const { useAuth } = await import('../useAuth')
    const { user, ensureSession } = useAuth()

    await expect(ensureSession()).resolves.toBeNull()
    expect(user.value).toBeNull()
  })

  it('returns undefined for network errors: the session state stays unknown', async () => {
    getCurrentUser.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { useAuth } = await import('../useAuth')
    const { user, ensureSession } = useAuth()

    await expect(ensureSession()).resolves.toBeUndefined()
    expect(user.value).toBeNull()
  })

  it('returns undefined for server errors other than 401', async () => {
    const { ApiError } = await import('@/api')
    getCurrentUser.mockRejectedValueOnce(new ApiError(503, 'Service unavailable'))
    const { useAuth } = await import('../useAuth')
    const { ensureSession } = useAuth()

    await expect(ensureSession()).resolves.toBeUndefined()
  })

  it('does not cache an unknown result: the next check retries /me', async () => {
    getCurrentUser.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { useAuth } = await import('../useAuth')
    const { ensureSession } = useAuth()

    await ensureSession()
    await ensureSession()
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })

  it('caches a concluded result so repeated calls do not refetch /me', async () => {
    getCurrentUser.mockResolvedValueOnce(mockUser)
    const { useAuth } = await import('../useAuth')
    const { ensureSession } = useAuth()

    await ensureSession()
    await ensureSession()
    expect(getCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('setSessionUser stores the login result and marks the session checked', async () => {
    const { useAuth } = await import('../useAuth')
    const { user, setSessionUser, ensureSession } = useAuth()

    setSessionUser(mockUser)
    expect(user.value).toEqual(mockUser)
    await expect(ensureSession()).resolves.toEqual(mockUser)
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('clearSessionUser resets to no session and re-enables the check', async () => {
    getCurrentUser.mockResolvedValueOnce(mockUser)
    const { useAuth } = await import('../useAuth')
    const { user, ensureSession, clearSessionUser } = useAuth()

    await ensureSession()
    expect(user.value).toEqual(mockUser)
    clearSessionUser()
    expect(user.value).toBeNull()

    getCurrentUser.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(ensureSession()).resolves.toBeUndefined()
    expect(getCurrentUser).toHaveBeenCalledTimes(2)
  })
})
