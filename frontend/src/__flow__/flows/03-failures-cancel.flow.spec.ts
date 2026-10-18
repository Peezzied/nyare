import '../harness/clientSetup'
import { describe, beforeAll, afterAll, it, expect } from 'vitest'
import { aiEnabled, assertBackendReachable } from '../harness/clientSetup'
import { authApi, coursesApi, notesApi, tasksApi } from '@/api'
import { useAuth, ensureSession, clearSessionUser } from '@/composables/useAuth'
import { usePlannerStatus } from '@/composables/usePlannerStatus'
import { useProcess } from '@/composables/useProcess'

describe('User Story 3: Failures and Cancellation', () => {
  beforeAll(async () => {
    await assertBackendReachable()
  })

  afterAll(() => {
    clearSessionUser()
  })

  describe('Scenario 1: Session Expiration / Recovery', () => {
    it('clears session after logout and returns null on ensureSession', async () => {
      const username = `flow_fail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      await authApi.register({ username })
      await authApi.login({ username })

      await authApi.logout()
      clearSessionUser()

      const session = await ensureSession()

      expect(session).toBeNull()
      expect(useAuth().user.value).toBeNull()
    })
  })

  describe('Scenario 2: Missing Record 404', () => {
    it('rejects with 404 when fetching non-existent task', async () => {
      const username = `flow_404_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      await authApi.register({ username })
      await authApi.login({ username })

      await expect(tasksApi.get('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
        status: 404,
      })
    })
  })

  describe.skipIf(!aiEnabled)('Scenario 3: Process Cancellation', () => {
    it('cancels a running process and marks it cancelled', async () => {
      const username = `flow_cancel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

      await authApi.register({ username })
      await authApi.login({ username })

      const course = await coursesApi.create({ name: 'Failures Course' })

      await notesApi.create({
        courseId: course.id,
        entryDate: new Date().toISOString().split('T')[0],
        content: 'Test note for process cancellation',
      })

      await usePlannerStatus().refresh()
      expect(usePlannerStatus().pendingCount.value).toBeGreaterThan(0)

      const process = useProcess()
      const processPromise = process.start()

      process.cancel()

      await processPromise

      expect(process.cancelled.value).toBe(true)
    })
  })
})
