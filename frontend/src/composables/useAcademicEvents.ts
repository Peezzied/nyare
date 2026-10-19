import { ref } from 'vue'
import type { Ref } from 'vue'
import { academicEventsApi } from '@/api'
import type { AcademicEventListParams } from '@/api'
import { createCache } from './createCache'
import type { AcademicEventRequest, AcademicEventResponse } from '@/types/api'

// Module-level shared state for academic events cache across callers.
const events = ref<AcademicEventResponse[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const cache = createCache(() => {
  events.value = []
  loading.value = false
  error.value = null
})

export interface UseAcademicEvents {
  events: Ref<AcademicEventResponse[]>
  loading: Ref<boolean>
  error: Ref<string | null>

  loadEvents: (params?: AcademicEventListParams, force?: boolean) => Promise<AcademicEventResponse[]>
  createEvent: (request: AcademicEventRequest) => Promise<AcademicEventResponse>
  updateEvent: (id: string, request: AcademicEventRequest) => Promise<AcademicEventResponse>
  deleteEvent: (id: string) => Promise<void>
  refetchForCourses: (courseIds: number[]) => Promise<void>
  resetEvents: () => void
}

export function useAcademicEvents(): UseAcademicEvents {
  /**
   * Loads the event list. A `params` call filters on the server, returns the
   * fetched list, and never writes the shared refs. A call without `params`
   * fills the cache once per intent and resolves with the cached list.
   */
  async function loadEvents(
    params?: AcademicEventListParams,
    force = false,
  ): Promise<AcademicEventResponse[]> {
    if (params) {
      return academicEventsApi.list(params)
    }

    if (cache.loaded && !force) {
      return events.value
    }

    if (cache.pending && !force) {
      await cache.pending
      return events.value
    }

    const g = cache.begin()
    const seq = cache.beginLoad()
    loading.value = true
    error.value = null

    const fetchPromise = (async () => {
      try {
        const result = await academicEventsApi.list()
        if (cache.isLatest(seq, g)) {
          events.value = result
          cache.loaded = true
        }
      } catch (err) {
        if (cache.isLatest(seq, g)) {
          error.value = err instanceof Error ? err.message : 'Events failed to load'
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

    return events.value
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

    const g = cache.begin()
    const seq = cache.beginLoad()
    loading.value = true
    error.value = null
    try {
      const courseResults = await Promise.all(
        courseIds.map((courseId) => academicEventsApi.list({ courseId })),
      )
      if (cache.isLatest(seq, g)) {
        const courseIdSet = new Set(courseIds)
        const keptEvents = events.value.filter((e) => !courseIdSet.has(e.courseId))
        const fetchedEvents = courseResults.flat()
        events.value = [...keptEvents, ...fetchedEvents]
      }
    } catch (err) {
      if (cache.isLatest(seq, g)) {
        error.value = err instanceof Error ? err.message : 'Failed to refetch events for courses'
      }
      throw err
    } finally {
      if (cache.isLatest(seq, g)) {
        loading.value = false
      }
    }
  }

  function resetEvents(): void {
    cache.reset()
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
