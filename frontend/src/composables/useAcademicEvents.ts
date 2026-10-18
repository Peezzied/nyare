import { ref } from 'vue'
import type { Ref } from 'vue'
import { academicEventsApi } from '@/api'
import type { AcademicEventListParams } from '@/api'
import type { AcademicEventRequest, AcademicEventResponse } from '@/types/api'

// Module-level shared state for academic events cache across callers.
const events = ref<AcademicEventResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
let loaded = false
let pending: Promise<void> | null = null

export interface UseAcademicEvents {
  events: Ref<AcademicEventResponse[]>
  loading: Ref<boolean>
  error: Ref<string | null>

  loadEvents: (params?: AcademicEventListParams, force?: boolean) => Promise<void>
  createEvent: (request: AcademicEventRequest) => Promise<AcademicEventResponse>
  updateEvent: (id: string, request: AcademicEventRequest) => Promise<AcademicEventResponse>
  deleteEvent: (id: string) => Promise<void>
  refetchForCourses: (courseIds: number[]) => Promise<void>
  resetEvents: () => void
}

export function useAcademicEvents(): UseAcademicEvents {
  async function loadEvents(params?: AcademicEventListParams, force = false): Promise<void> {
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
        const result = await academicEventsApi.list(params)
        events.value = result
        if (!params) {
          loaded = true
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Events failed to load'
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

  async function createEvent(request: AcademicEventRequest): Promise<AcademicEventResponse> {
    loading.value = true
    error.value = null
    try {
      const created = await academicEventsApi.create(request)
      events.value = [...events.value, created]
      return created
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(
    id: string,
    request: AcademicEventRequest,
  ): Promise<AcademicEventResponse> {
    loading.value = true
    error.value = null
    try {
      const updated = await academicEventsApi.update(id, request)
      events.value = events.value.map((e) => (e.id === id ? updated : e))
      return updated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(id: string): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await academicEventsApi.delete(id)
      events.value = events.value.filter((e) => e.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function refetchForCourses(courseIds: number[]): Promise<void> {
    if (courseIds.length === 0) {
      await loadEvents(undefined, true)
      return
    }

    loading.value = true
    error.value = null
    try {
      const courseResults = await Promise.all(
        courseIds.map((courseId) => academicEventsApi.list({ courseId })),
      )
      const courseIdSet = new Set(courseIds)
      const keptEvents = events.value.filter((e) => !courseIdSet.has(e.courseId))
      const fetchedEvents = courseResults.flat()
      events.value = [...keptEvents, ...fetchedEvents]
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to refetch events for courses'
      throw err
    } finally {
      loading.value = false
    }
  }

  function resetEvents(): void {
    events.value = []
    loading.value = false
    error.value = null
    loaded = false
    pending = null
  }

  return {
    events,
    loading,
    error,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    refetchForCourses,
    resetEvents,
  }
}
