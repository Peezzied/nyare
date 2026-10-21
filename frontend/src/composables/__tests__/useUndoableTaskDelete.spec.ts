import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTasks } from '@/composables/useTasks'
import { useToasts } from '@/composables/useToasts'
import { useUndoableTaskDelete } from '@/composables/useUndoableTaskDelete'
import { tasksApi } from '@/api'
import type { TaskResponse } from '@/types/api'

const task = (id: string): TaskResponse => ({
  id,
  courseId: 1,
  noteId: null,
  title: `Task ${id}`,
  description: null,
  scheduledDate: null,
  duration: null,
  status: 'TODO',
  createdAt: '2026-10-18T09:00:00Z',
  updatedAt: '2026-10-18T09:00:00Z',
})

describe('useUndoableTaskDelete', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
    useTasks().resetTasks()
    useTasks().tasks.value = [task('a'), task('b'), task('c')]
    useToasts().toasts.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('removes the row and commits the delete when the toast lapses', async () => {
    const del = vi.spyOn(tasksApi, 'delete').mockResolvedValue(undefined)

    useUndoableTaskDelete().deleteTaskWithUndo(task('b'))

    expect(useTasks().tasks.value.map((t) => t.id)).toEqual(['a', 'c'])
    const toast = useToasts().toasts.value[useToasts().toasts.value.length - 1]
    expect(toast?.kind).toBe('info')
    expect(toast?.title).toBe('Task deleted')
    expect(toast?.action?.label).toBe('Undo')

    await vi.advanceTimersByTimeAsync(5000)
    expect(del).toHaveBeenCalledWith('b')
  })

  it('restores the row in place and skips the API call on Undo', async () => {
    const del = vi.spyOn(tasksApi, 'delete').mockResolvedValue(undefined)

    useUndoableTaskDelete().deleteTaskWithUndo(task('b'))
    useToasts().toasts.value[useToasts().toasts.value.length - 1]?.action?.onClick()

    expect(useTasks().tasks.value.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    await vi.advanceTimersByTimeAsync(5000)
    expect(del).not.toHaveBeenCalled()
  })

  it('restores the row and pushes an error toast when the commit fails', async () => {
    const del = vi.spyOn(tasksApi, 'delete').mockRejectedValue(new Error('offline'))

    useUndoableTaskDelete().deleteTaskWithUndo(task('a'))
    await vi.advanceTimersByTimeAsync(5000)

    expect(del).toHaveBeenCalledWith('a')
    expect(useTasks().tasks.value.map((t) => t.id)).toEqual(['a', 'b', 'c'])
    expect(useToasts().toasts.value.some((t) => t.kind === 'error')).toBe(true)
  })
})
