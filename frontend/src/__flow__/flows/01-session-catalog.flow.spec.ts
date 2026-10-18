import '../harness/clientSetup'
import { describe, beforeAll, it, expect } from 'vitest'
import { authApi, coursesApi, schedulesApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { plannerScenario } from '../fixtures/plannerScenario'

describe('User Story 1: Session and Catalog', () => {
  let createdCourses: Awaited<ReturnType<typeof coursesApi.create>>[] = []

  beforeAll(async () => {
    await import('../harness/clientSetup').then((m) => m.assertBackendReachable())
  })

  describe('Authentication', () => {
    it('registers, logs in, and verifies current user', async () => {
      const username = `flow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      await authApi.register({ username })
      await authApi.login({ username })

      const currentUser = await authApi.getCurrentUser()
      expect(currentUser.username).toBe(username)
      expect(currentUser.id).not.toBeNull()
    })
  })

  describe('Catalog', () => {
    it('creates courses and schedules, then loads catalog', async () => {
      for (const c of plannerScenario.courses) {
        const created = await coursesApi.create(c)
        createdCourses.push(created)
      }

      for (const s of plannerScenario.schedules) {
        const course = createdCourses[s.courseIndex]
        if (!course) continue
        await schedulesApi.create({
          courseId: course.id,
          day: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })
      }

      const catalog = useCatalog()
      await catalog.loadCatalog()

      expect(catalog.courses.value).toHaveLength(plannerScenario.courses.length)
      expect(catalog.schedules.value).toHaveLength(plannerScenario.schedules.length)
    })
  })

  describe('Session Logout', () => {
    it('logs out and rejects subsequent api calls with 401', async () => {
      await authApi.logout()

      await expect(authApi.getCurrentUser()).rejects.toMatchObject({
        status: 401,
      })
    })
  })
})