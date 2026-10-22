import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Router } from 'vue-router'
import type { UserResponse } from '@/types/api'

const sessionUser: UserResponse = {
  id: 1,
  username: 'karol',
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-01T09:00:00Z',
}

import { ref } from 'vue'

const isDevUserMissing = ref(false)
const user = ref<UserResponse | null>(null)
const ensureSession = vi.fn<() => Promise<UserResponse | null | undefined>>()
const clearSessionUser = vi.fn<() => void>(() => {
  user.value = null
})

vi.mock('@/composables/useAuth', () => ({
  ensureSession: () => ensureSession(),
  useAuth: () => ({ isDevUserMissing, user }),
  clearSessionUser: () => clearSessionUser(),
}))

let unauthorizedHandler: (() => void) | null = null

vi.mock('@/api/client', () => ({
  setUnauthorizedHandler: (next: (() => void) | null) => {
    unauthorizedHandler = next
  },
}))

/** Reimports the router so the guard and its routes start fresh per test. */
function loadRouter(): Promise<Router> {
  vi.resetModules()
  return import('../index').then((mod) => mod.default)
}

describe('router session guard', () => {
  beforeEach(() => {
    vi.resetModules()
    ensureSession.mockReset()
    clearSessionUser.mockClear()
    isDevUserMissing.value = false
    user.value = null
    unauthorizedHandler = null
    vi.unstubAllEnvs()
  })

  it('redirects guarded pages to the start page without a session', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()

    await router.push('/notes')

    expect(router.currentRoute.value.path).toBe('/')
    expect(router.currentRoute.value.name).toBe('start')
  })

  it('keeps the start page public without a session', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()

    await router.push('/')

    expect(router.currentRoute.value.name).toBe('start')
  })

  it('keeps account selection public without a session', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()

    await router.push('/select-account')

    expect(router.currentRoute.value.name).toBe('select-account')
  })

  it('redirects a sessioned start visit to the calendar home', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    const router = await loadRouter()

    await router.push('/')

    expect(router.currentRoute.value.path).toBe('/calendar')
  })

  it('allows guarded pages with a session', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    const router = await loadRouter()

    await router.push('/notes')

    expect(router.currentRoute.value.path).toBe('/notes')
  })

  it('proceeds to guarded routes on an unknown session in development', async () => {
    vi.stubEnv('DEV', true)
    ensureSession.mockResolvedValue(undefined)
    const router = await loadRouter()

    await router.push('/notes')

    expect(router.currentRoute.value.path).toBe('/notes')
  })

  it('rechecks the session on the next navigation after an unknown result', async () => {
    vi.stubEnv('DEV', true)
    ensureSession.mockResolvedValue(undefined)
    const router = await loadRouter()

    await router.push('/notes')
    await router.push('/tasks')

    expect(ensureSession).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.path).toBe('/tasks')
  })

  it('fails closed on an unknown session in production builds', async () => {
    vi.stubEnv('DEV', false)
    ensureSession.mockResolvedValue(undefined)
    const router = await loadRouter()

    await router.push('/notes')

    // Aborted: the route stays at the initial location instead of the start page.
    expect(router.currentRoute.value.path).toBe('/')
    expect(router.currentRoute.value.name).toBeUndefined()
  })

  it('redirects to dev-missing when isDevUserMissing is true', async () => {
    ensureSession.mockResolvedValue(null)
    isDevUserMissing.value = true
    const router = await loadRouter()

    await router.push('/calendar')

    expect(router.currentRoute.value.name).toBe('dev-missing')
    expect(router.currentRoute.value.path).toBe('/dev-missing')
  })

  it('redirects away from dev-missing to start when isDevUserMissing is false', async () => {
    ensureSession.mockResolvedValue(null)
    isDevUserMissing.value = false
    const router = await loadRouter()

    await router.push('/dev-missing')

    expect(router.currentRoute.value.name).toBe('start')
  })

  it('clears the session and returns to start when the unauthorized handler fires', async () => {
    ensureSession.mockResolvedValueOnce(sessionUser).mockResolvedValue(null)
    user.value = sessionUser
    const router = await loadRouter()
    await router.push('/calendar')
    expect(router.currentRoute.value.name).toBe('calendar')

    const pushSpy = vi.spyOn(router, 'push')
    unauthorizedHandler?.()
    await Promise.all(pushSpy.mock.results.map((result) => result.value))

    expect(clearSessionUser).toHaveBeenCalledTimes(1)
    expect(user.value).toBeNull()
    expect(router.currentRoute.value.name).toBe('start')
  })

  it('does not navigate when the unauthorized handler fires on start', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('start')

    const pushSpy = vi.spyOn(router, 'push')
    unauthorizedHandler?.()

    expect(pushSpy).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('start')
  })

  it('pushes a session-ended toast when the unauthorized handler fires', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()
    await router.push('/')

    unauthorizedHandler?.()

    // Imported after loadRouter so it resolves to the same module instance.
    const { useToasts } = await import('@/composables/useToasts')
    expect(useToasts().toasts.value.some((t) => t.title === 'Session ended')).toBe(true)
  })
})
