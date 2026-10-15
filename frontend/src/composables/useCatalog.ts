import { ref } from 'vue'
import { coursesApi, schedulesApi } from '@/api'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

// Module-level state, so every useCatalog() caller shares one cache.
const courses = ref<CourseResponse[]>([])
const schedules = ref<ScheduleResponse[]>([])
const loaded = ref(false)
let pending: Promise<void> | null = null

/**
 * Shared cache for rarely changing catalog data. Each view loads courses
 * and schedules once per intent. Apply mutation responses locally instead
 * of refetching. Task, note, and event changes never invalidate this cache.
 */
export function useCatalog() {
  /**
   * Loads courses and schedules once. Later calls return at once unless `force` is true.
   * Concurrent calls share one in-flight request.
   */
  async function loadCatalog(force = false): Promise<void> {
    if (loaded.value && !force) {
      return
    }
    // Views that mount at the same time wait for one request instead of sending duplicates.
    if (pending) {
      await pending
      return
    }
    pending = (async () => {
      courses.value = await coursesApi.list()
      schedules.value = await schedulesApi.list()
      loaded.value = true
    })()
    try {
      await pending
    } finally {
      pending = null
    }
  }

  function applyCourseCreated(course: CourseResponse): void {
    courses.value = [...courses.value, course]
  }

  /** Removes the course and its schedules from the cache. */
  function applyCourseDeleted(id: number): void {
    courses.value = courses.value.filter((course) => course.id !== id)
    schedules.value = schedules.value.filter((schedule) => schedule.courseId !== id)
  }

  function applyScheduleCreated(schedule: ScheduleResponse): void {
    schedules.value = [...schedules.value, schedule]
  }

  function applyScheduleUpdated(schedule: ScheduleResponse): void {
    schedules.value = schedules.value.map((current) =>
      current.id === schedule.id ? schedule : current,
    )
  }

  function applyScheduleDeleted(id: number): void {
    schedules.value = schedules.value.filter((schedule) => schedule.id !== id)
  }

  /** Clears the cache so the next `loadCatalog()` call fetches again. */
  function resetCatalog(): void {
    courses.value = []
    schedules.value = []
    loaded.value = false
  }

  return {
    courses,
    schedules,
    loaded,
    loadCatalog,
    applyCourseCreated,
    applyCourseDeleted,
    applyScheduleCreated,
    applyScheduleUpdated,
    applyScheduleDeleted,
    resetCatalog,
  }
}
