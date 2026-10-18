import { ref } from 'vue'
import type { Ref } from 'vue'
import { tasksApi } from '@/api'
import type { TaskListParams } from '@/api'
import type { TaskRequest, TaskResponse, TaskStatus } from '@/types/api'

// Module-level shared state for tasks cache across callers.
const tasks = ref<TaskResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let loaded = false
let pending: Promise<void> | null = null

export interface UseTasks {
  tasks: Ref<TaskResponse[]>
  loading: Ref<boolean>
  error: Ref<string | null>

  loadTasks: (params?: TaskListParams, force?: boolean) => Promise<void>
  createTask: (request: TaskRequest) => Promise<TaskResponse>
  updateTask: (id: string, request: TaskRequest) => Promise<TaskResponse>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<TaskResponse>
  deleteTask: (id: string) => Promise<void>
  refetchForCourses: (courseIds: number[]) => Promise<void>
  resetTasks: () => void
}

export function useTasks(): UseTasks {
  async function loadTasks(params?: TaskListParams, force = false): Promise<void> {
    if (loaded && !force && !params) {
      return
    }

    if (pending && !params && !force) {
      await pending
      return
    }

    loading.value = true
    error.value = null

    const fetchPromise = (async () => {
      try {
        const result = await tasksApi.list(params)
        tasks.value = result
        if (!params) {
          loaded = true
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Tasks failed to load'
        throw err
      } finally {
        loading.value = false
      }
    })()

    if (!params && !force) {
      pending = fetchPromise
    }

    try {
      await fetchPromise
    } finally {
      if (pending === fetchPromise) {
        pending = null
      }
    }
  }

  async function createTask(request: TaskRequest): Promise<TaskResponse> {
    loading.value = true
    error.value = null
    try {
      const created = await tasksApi.create(request)
      tasks.value = [...tasks.value, created]
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create task'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTask(id: string, request: TaskRequest): Promise<TaskResponse> {
    loading.value = true
    error.value = null
    try {
      const updated = await tasksApi.update(id, request)
      tasks.value = tasks.value.map((t) => (t.id === id ? updated : t))
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTaskStatus(id: string, status: TaskStatus): Promise<TaskResponse> {
    loading.value = true
    error.value = null
    try {
      const updated = await tasksApi.updateStatus(id, status)
      tasks.value = tasks.value.map((t) => (t.id === id ? updated : t))
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update task status'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTask(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await tasksApi.delete(id)
      tasks.value = tasks.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete task'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refetchForCourses(courseIds: number[]): Promise<void> {
    if (courseIds.length === 0) {
      await loadTasks(undefined, true)
      return
    }

    loading.value = true
    error.value = null
    try {
      const courseResults = await Promise.all(
        courseIds.map((courseId) => tasksApi.list({ courseId })),
      )
      const courseIdSet = new Set(courseIds)
      const keptTasks = tasks.value.filter((t) => !courseIdSet.has(t.courseId))
      const fetchedTasks = courseResults.flat()
      tasks.value = [...keptTasks, ...fetchedTasks]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refetch tasks for courses'
      throw err
    } finally {
      loading.value = false
    }
  }

  function resetTasks(): void {
    tasks.value = []
    loading.value = false
    error.value = null
    loaded = false
    pending = null
  }

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    refetchForCourses,
    resetTasks,
  }
}
