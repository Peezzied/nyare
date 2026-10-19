import { ref } from 'vue'
import type { Ref } from 'vue'
import { tasksApi } from '@/api'
import type { TaskListParams } from '@/api'
import { createCache } from './createCache'
import type { TaskRequest, TaskResponse, TaskStatus } from '@/types/api'

// Module-level shared state for tasks cache across callers.
const tasks = ref<TaskResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const cache = createCache(() => {
  tasks.value = []
  loading.value = false
  error.value = null
})

export interface UseTasks {
  tasks: Ref<TaskResponse[]>
  loading: Ref<boolean>
  error: Ref<string | null>

  loadTasks: (params?: TaskListParams, force?: boolean) => Promise<TaskResponse[]>
  getTask: (id: string) => Promise<TaskResponse>
  createTask: (request: TaskRequest) => Promise<TaskResponse>
  updateTask: (id: string, request: TaskRequest) => Promise<TaskResponse>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<TaskResponse>
  deleteTask: (id: string) => Promise<void>
  refetchForCourses: (courseIds: number[]) => Promise<void>
  resetTasks: () => void
}

export function useTasks(): UseTasks {
  /**
   * Loads the task list. A `params` call filters on the server, returns the
   * fetched list, and never writes the shared refs. A call without `params`
   * fills the cache once per intent and resolves with the cached list.
   */
  async function loadTasks(params?: TaskListParams, force = false): Promise<TaskResponse[]> {
    if (params) {
      return tasksApi.list(params)
    }

    if (cache.loaded && !force) {
      return tasks.value
    }

    if (cache.pending && !force) {
      await cache.pending
      return tasks.value
    }

    const g = cache.begin()
    const seq = cache.beginLoad()
    loading.value = true
    error.value = null

    const fetchPromise = (async () => {
      try {
        const result = await tasksApi.list()
        if (cache.isLatest(seq, g)) {
          tasks.value = result
          cache.loaded = true
        }
      } catch (err) {
        if (cache.isLatest(seq, g)) {
          error.value = err instanceof Error ? err.message : 'Tasks failed to load'
        }
        throw err
      } finally {
        if (cache.isLatest(seq, g)) {
          loading.value = false
        }
      }
    })()

    if (!force) {
      cache.pending = fetchPromise
    }

    try {
      await fetchPromise
    } finally {
      if (cache.pending === fetchPromise) {
        cache.pending = null
      }
    }

    return tasks.value
  }

  /**
   * Resolves one task from the cache first, falling back to the API. A fetched
   * task is upserted into the shared list so direct-link views join the cache.
   */
  async function getTask(id: string): Promise<TaskResponse> {
    const cached = tasks.value.find((t) => t.id === id)
    if (cached) {
      return cached
    }

    const fetched = await tasksApi.get(id)
    tasks.value = tasks.value.some((t) => t.id === id)
      ? tasks.value.map((t) => (t.id === id ? fetched : t))
      : [...tasks.value, fetched]
    return fetched
  }

  // Mutations update the shared list from responses but never touch the shared
  // loading/error refs; callers keep their own pending and error state.
  async function createTask(request: TaskRequest): Promise<TaskResponse> {
    const created = await tasksApi.create(request)
    tasks.value = [...tasks.value, created]
    return created
  }

  async function updateTask(id: string, request: TaskRequest): Promise<TaskResponse> {
    const updated = await tasksApi.update(id, request)
    tasks.value = tasks.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskResponse> {
    const updated = await tasksApi.updateStatus(id, status)
    tasks.value = tasks.value.map((t) => (t.id === id ? updated : t))
    return updated
  }

  async function deleteTask(id: string): Promise<void> {
    await tasksApi.delete(id)
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function refetchForCourses(courseIds: number[]): Promise<void> {
    if (courseIds.length === 0) {
      await loadTasks(undefined, true)
      return
    }

    const g = cache.begin()
    const seq = cache.beginLoad()
    loading.value = true
    error.value = null
    try {
      const courseResults = await Promise.all(
        courseIds.map((courseId) => tasksApi.list({ courseId })),
      )
      if (cache.isLatest(seq, g)) {
        const courseIdSet = new Set(courseIds)
        const keptTasks = tasks.value.filter((t) => !courseIdSet.has(t.courseId))
        const fetchedTasks = courseResults.flat()
        tasks.value = [...keptTasks, ...fetchedTasks]
      }
    } catch (err) {
      if (cache.isLatest(seq, g)) {
        error.value = err instanceof Error ? err.message : 'Failed to refetch tasks for courses'
      }
      throw err
    } finally {
      if (cache.isLatest(seq, g)) {
        loading.value = false
      }
    }
  }

  function resetTasks(): void {
    cache.reset()
  }

  return {
    tasks,
    loading,
    error,
    loadTasks,
    getTask,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    refetchForCourses,
    resetTasks,
  }
}
