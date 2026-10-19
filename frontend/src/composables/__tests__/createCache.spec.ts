import { describe, it, expect, vi, beforeEach } from 'vitest'
import { tasksApi } from '@/api'
import { useTasks } from '../useTasks'
import { resetAllCaches } from '../createCache'
import { clearSessionUser } from '../useAuth'
import type { TaskResponse } from '@/types/api'

const task: TaskResponse = {
  id: 'task-1',
  courseId: 1,
  title: 'Read chapter 4',
  status: 'TODO',
  createdAt: '2026-10-01T09:00:00Z',
  updatedAt: '2026-10-01T09:00:00Z',
}

const filteredTask: TaskResponse = { ...task, id: 'task-2', title: 'Filtered' }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe('createCache registry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllCaches()
  })

  it('drops a load that resolves after resetAllCaches and fetches again on the next call', async () => {
    const first = deferred<TaskResponse[]>()
    const list = vi
      .spyOn(tasksApi, 'list')
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue([task])
    const { tasks, loadTasks } = useTasks()

    const pending = loadTasks()
    resetAllCaches()
    first.resolve([filteredTask])
    await pending

    expect(tasks.value).toEqual([])

    await loadTasks()
    expect(list).toHaveBeenCalledTimes(2)
    expect(tasks.value).toEqual([task])
  })

  it('never lets a slower older load overwrite a newer forced refetch', async () => {
    const slow = deferred<TaskResponse[]>()
    const fast = deferred<TaskResponse[]>()
    vi.spyOn(tasksApi, 'list')
      .mockReturnValueOnce(slow.promise)
      .mockReturnValueOnce(fast.promise)
    const { tasks, loadTasks } = useTasks()

    const first = loadTasks()
    const forced = loadTasks(undefined, true)

    fast.resolve([filteredTask])
    await forced
    expect(tasks.value).toEqual([filteredTask])

    slow.resolve([task])
    await first
    expect(tasks.value).toEqual([filteredTask])
  })

  it('clearSessionUser resets the task cache', async () => {
    vi.spyOn(tasksApi, 'list').mockResolvedValue([task])
    const { tasks, loadTasks } = useTasks()

    await loadTasks()
    expect(tasks.value).toEqual([task])

    clearSessionUser()
    expect(tasks.value).toEqual([])
  })
})

describe('loadTasks params isolation', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    resetAllCaches()
  })

  it('returns the filtered list without writing the shared refs', async () => {
    const list = vi
      .spyOn(tasksApi, 'list')
      .mockImplementation(async (params) => (params ? [filteredTask] : [task]))
    const { tasks, loadTasks } = useTasks()

    await loadTasks()
    expect(tasks.value).toEqual([task])

    const result = await loadTasks({ courseId: 1 })

    expect(result).toEqual([filteredTask])
    expect(tasks.value).toEqual([task])
    expect(list).toHaveBeenCalledTimes(2)
    expect(list).toHaveBeenLastCalledWith({ courseId: 1 })
  })
})
