import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useNotifications } from '@/composables/useNotifications'
import { resetAllCaches } from '@/composables/createCache'
import { setSessionUser, clearSessionUser } from '@/composables/useAuth'
import type { PlannerStatusResponse, UserResponse } from '@/api'

const statusPayload: PlannerStatusResponse = {
  hasPendingNotes: true,
  dirtyNoteCount: 1,
  dirtyDates: ['2026-10-01'],
  courseNames: ['CS101'],
  pendingNotes: [
    { id: 'note-1', title: null, courseName: 'CS101', entryDate: '2026-10-01' },
  ],
}

describe('useNotifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    resetAllCaches()
  })

  it('records a run lifecycle and counts it unread on finish', () => {
    // given
    const notifications = useNotifications()

    // when
    const id = notifications.openRecord()
    notifications.applyInit(id, statusPayload)
    notifications.patchRecord(id, { progress: { date: '2026-10-01', index: 1, total: 1 } })
    notifications.patchRecord(id, {
      summary: { tasksCreated: 2, eventsCreated: 1, contextsCreated: 0 },
    })

    // then
    const live = notifications.records.value.find((r) => r.id === id)
    expect(live?.status).toBe('running')
    expect(live?.noteCount).toBe(1)
    expect(live?.progress?.index).toBe(1)
    expect(notifications.unreadCount.value).toBe(0)

    // when the run ends
    notifications.finishRecord(id, 'done')

    // then
    const done = notifications.records.value.find((r) => r.id === id)
    expect(done?.status).toBe('done')
    expect(done?.finishedAt).toBeTruthy()
    expect(notifications.unreadCount.value).toBe(1)
    expect(notifications.active.value).toBeUndefined()

    // when the center marks everything read
    notifications.markAllRead()
    expect(notifications.unreadCount.value).toBe(0)
  })

  it('persists records per user and restores them after a session reset', async () => {
    // given
    const user: UserResponse = { id: 7, username: 'sam', createdAt: '', updatedAt: '' }
    const notifications = useNotifications()

    // when a run finishes under this user
    setSessionUser(user)
    // Let the session watcher flush and restore before the run starts.
    await nextTick()
    const id = notifications.openRecord()
    notifications.finishRecord(id, 'done')

    // then the record is in localStorage under the user's key
    await vi.waitFor(() =>
      expect(localStorage.getItem('nyare.notifications.v1:7')).toContain(id),
    )
    const stored = JSON.parse(
      localStorage.getItem('nyare.notifications.v1:7') ?? '[]',
    ) as Array<{ id: string; status: string }>
    expect(stored[0]?.id).toBe(id)
    expect(stored[0]?.status).toBe('done')

    // when the session resets and the same user logs back in
    clearSessionUser()
    expect(notifications.records.value).toEqual([])
    setSessionUser(user)
    await nextTick()

    // then the record came back
    expect(notifications.records.value.length).toBe(1)
    expect(notifications.records.value[0]?.id).toBe(id)
    expect(notifications.unreadCount.value).toBe(1)
  })
})
