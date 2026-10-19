import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import type { Router } from 'vue-router'
import type { CourseResponse, UserResponse } from '@/types/api'

const sessionUser: UserResponse = {
  id: 2,
  username: 'newbie',
  createdAt: '2026-10-19T09:00:00Z',
  updatedAt: '2026-10-19T09:00:00Z',
}

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

// Onboarding completion derives from owned courses, so the spec controls it
// through the shared catalog cache instead of a user flag.
const courses = ref<Partial<CourseResponse>[]>([])
const loadCatalog = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

vi.mock('@/composables/useCatalog', () => ({
  useCatalog: () => ({
    courses,
    loadCatalog,
  }),
}))

const studentName = ref('')
const isNameValid = computed(() => {
  const length = studentName.value.trim().length
  return length >= 3 && length <= 64
})

vi.mock('@/composables/useOnboarding', () => ({
  useOnboarding: () => ({
    studentName,
    isNameValid,
    setStudentName: (name: string) => {
      studentName.value = name
    },
    resetOnboarding: () => {
      studentName.value = ''
    },
  }),
}))

vi.mock('@/api/client', () => ({
  setUnauthorizedHandler: () => {},
}))

/** Reimports the router so the guard and its routes start fresh per test. */
function loadRouter(): Promise<Router> {
  vi.resetModules()
  return import('../index').then((mod) => mod.default)
}

describe('router onboarding gate', () => {
  beforeEach(() => {
    vi.resetModules()
    ensureSession.mockReset()
    loadCatalog.mockClear()
    loadCatalog.mockResolvedValue(undefined)
    clearSessionUser.mockClear()
    isDevUserMissing.value = false
    user.value = null
    courses.value = []
    studentName.value = ''
  })

  it.each(['/calendar', '/tasks', '/notes', '/notes/new', '/tasks/task-1'])(
    'redirects a courseless session on %s to welcome',
    async (path) => {
      ensureSession.mockResolvedValue(sessionUser)
      const router = await loadRouter()

      await router.push(path)

      expect(router.currentRoute.value.name).toBe('welcome')
    },
  )

  it('sends a courseless session from start to welcome', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    const router = await loadRouter()

    await router.push('/')

    expect(router.currentRoute.value.name).toBe('welcome')
  })

  it.each(['/welcome', '/create-schedule'])(
    'keeps a courseless session on the setup route %s',
    async (path) => {
      ensureSession.mockResolvedValue(sessionUser)
      const router = await loadRouter()

      await router.push(path)

      expect(router.currentRoute.value.path).toBe(path)
    },
  )

  it.each(['/welcome', '/create-schedule'])(
    'redirects a session with courses on %s to the calendar',
    async (path) => {
      ensureSession.mockResolvedValue(sessionUser)
      courses.value = [{ id: 1, name: 'Math' } as CourseResponse]
      const router = await loadRouter()

      await router.push(path)

      expect(router.currentRoute.value.name).toBe('calendar')
    },
  )

  it('sends a session with courses from start to the calendar', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    courses.value = [{ id: 1, name: 'Math' } as CourseResponse]
    const router = await loadRouter()

    await router.push('/')

    expect(router.currentRoute.value.name).toBe('calendar')
  })

  it('lets a session with courses open the calendar', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    courses.value = [{ id: 1, name: 'Math' } as CourseResponse]
    const router = await loadRouter()

    await router.push('/calendar')

    expect(router.currentRoute.value.name).toBe('calendar')
  })

  it('sends a sessionless visitor without a name from create-schedule to welcome', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()

    await router.push('/create-schedule')

    expect(router.currentRoute.value.name).toBe('welcome')
  })

  it('lets a sessionless visitor with a pending name open create-schedule', async () => {
    ensureSession.mockResolvedValue(null)
    studentName.value = 'Alice'
    const router = await loadRouter()

    await router.push('/create-schedule')

    expect(router.currentRoute.value.name).toBe('create-schedule')
  })

  it('resolves a stale /schedule bookmark to the calendar with courses', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    courses.value = [{ id: 1, name: 'Math' } as CourseResponse]
    const router = await loadRouter()

    await router.push('/schedule')

    expect(router.currentRoute.value.name).toBe('calendar')
  })

  it('resolves /schedule to welcome for a courseless session', async () => {
    ensureSession.mockResolvedValue(sessionUser)
    const router = await loadRouter()

    await router.push('/schedule')

    expect(router.currentRoute.value.name).toBe('welcome')
  })

  it('resolves /schedule to start without a session', async () => {
    ensureSession.mockResolvedValue(null)
    const router = await loadRouter()

    await router.push('/schedule')

    expect(router.currentRoute.value.name).toBe('start')
  })
})
