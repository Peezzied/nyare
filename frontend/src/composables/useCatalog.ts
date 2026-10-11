import { ref } from 'vue'
import { coursesApi, schedulesApi } from '@/api'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

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
  async function loadCatalog(force = false): Promise<void> {
    if (loaded.value && !force) {
      return
    }
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
