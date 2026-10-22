import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAcademicEvents } from '@/composables/useAcademicEvents'
import { useToasts } from '@/composables/useToasts'
import { useUndoableEventDelete } from '@/composables/useUndoableEventDelete'
import { academicEventsApi } from '@/api'
import type { AcademicEventResponse } from '@/types/api'

const event = (id: string): AcademicEventResponse => ({
  id,
  courseId: 1,
  noteId: null,
  title: `Event ${id}`,
  description: null,
  deadline: '2026-10-25T09:00:00',
  createdAt: '2026-10-18T09:00:00Z',
})

describe('useUndoableEventDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
    useAcademicEvents().resetEvents()
    useAcademicEvents().events.value = [event('a'), event('b'), event('c')]
    useToasts().toasts.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('removes the event and commits the delete when the toast lapses', async () => {
    const del = vi.spyOn(academicEventsApi, 'delete').mockResolvedValue(undefined)

    useUndoableEventDelete().deleteEventWithUndo(event('b'))

    expect(useAcademicEvents().events.value.map((e) => e.id)).toEqual(['a', 'c'])
    const toast = useToasts().toasts.value[useToasts().toasts.value.length - 1]
    expect(toast?.kind).toBe('info')
    expect(toast?.title).toBe('Event deleted')
    expect(toast?.action?.label).toBe('Undo')

    await vi.advanceTimersByTimeAsync(5000)
    expect(del).toHaveBeenCalledWith('b')
  })

  it('restores the event in place and skips the API call on Undo', async () => {
    const del = vi.spyOn(academicEventsApi, 'delete').mockResolvedValue(undefined)

    useUndoableEventDelete().deleteEventWithUndo(event('b'))
    useToasts().toasts.value[useToasts().toasts.value.length - 1]?.action?.onClick()

    expect(useAcademicEvents().events.value.map((e) => e.id)).toEqual(['a', 'b', 'c'])
    await vi.advanceTimersByTimeAsync(5000)
    expect(del).not.toHaveBeenCalled()
  })

  it('restores the event and pushes an error toast when the commit fails', async () => {
    const del = vi.spyOn(academicEventsApi, 'delete').mockRejectedValue(new Error('offline'))

    useUndoableEventDelete().deleteEventWithUndo(event('a'))
    await vi.advanceTimersByTimeAsync(5000)

    expect(del).toHaveBeenCalledWith('a')
    expect(useAcademicEvents().events.value.map((e) => e.id)).toEqual(['a', 'b', 'c'])
    expect(useToasts().toasts.value.some((t) => t.kind === 'error')).toBe(true)
  })
})
