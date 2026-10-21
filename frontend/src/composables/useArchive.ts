import { ref } from 'vue'
import { academicEventsApi, coursesApi, notesApi, schedulesApi, tasksApi } from '@/api'
import { createCache } from './createCache'
import { COURSE_PALETTE_24, getCourseColor, type CoursePaletteColor } from '@/constants/palette'
import type {
  AcademicEventResponse,
  CourseResponse,
  NoteSummaryResponse,
  ScheduleResponse,
  TaskResponse,
} from '@/types/api'

// Module-level state, so every useArchive() caller shares one cache.
const archivedCourses = ref<CourseResponse[]>([])
const loaded = ref(false)
const cache = createCache(() => {
  archivedCourses.value = []
  loaded.value = false
})

/** Read-only content snapshot of one archived course. */
export interface ArchivedCourseContent {
  schedules: ScheduleResponse[]
  notes: NoteSummaryResponse[]
  tasks: TaskResponse[]
  events: AcademicEventResponse[]
}

/**
 * Shared cache for archived courses. Each view loads the archive list once
 * per intent. Per-course content loads on demand and returns to the caller.
 * Each view keeps it in local state.
 */
export function useArchive() {
  /**
   * Loads archived courses once. Later calls return at once unless `force` is true.
   * Concurrent calls share one in-flight request.
   */
  async function loadArchive(force = false): Promise<void> {
    if (loaded.value && !force) {
      return
    }
    // Views that mount at the same time wait for one request instead of sending duplicates.
    if (cache.pending) {
      await cache.pending
      return
    }
    const g = cache.begin()
    const seq = cache.beginLoad()
    const fetchPromise = (async () => {
      const courseList = await coursesApi.list({ archived: true })
      if (cache.isLatest(seq, g)) {
        archivedCourses.value = courseList
        loaded.value = true
      }
    })()
    cache.pending = fetchPromise
    try {
      await fetchPromise
    } finally {
      if (cache.pending === fetchPromise) {
        cache.pending = null
      }
    }
  }

  /** True when the course id belongs to an archived course. Call `loadArchive()` first. */
  function isArchived(courseId: number | undefined | null): boolean {
    return archivedCourses.value.some((course) => course.id === courseId)
  }

  /**
   * Fetches the schedules, notes, tasks, and events of one archived course
   * in one fan-out. The result is not part of the cache.
   */
  async function loadCourseContent(courseId: number): Promise<ArchivedCourseContent> {
    const params = { courseId, archived: true }
    const [schedules, notes, tasks, events] = await Promise.all([
      schedulesApi.list(params),
      notesApi.list(params),
      tasksApi.list(params),
      academicEventsApi.list(params),
    ])
    return { schedules, notes, tasks, events }
  }

  /** Deletes the archived course via the API and drops it from the cache. */
  async function deleteArchivedCourse(id: number): Promise<void> {
    await coursesApi.delete(id)
    applyCourseRemoved(id)
  }

  /** Removes the course row locally after a delete or an unarchive elsewhere. */
  function applyCourseRemoved(id: number): void {
    archivedCourses.value = archivedCourses.value.filter((course) => course.id !== id)
  }

  /**
   * Resolves the color of an archived course for presentation. Mirrors
   * `useCatalog().courseColor` but reads the slug from `archivedCourses`.
   */
  function courseColor(courseId: number | undefined | null): CoursePaletteColor {
    const slug = archivedCourses.value.find((course) => course.id === courseId)?.color
    const stored = slug ? COURSE_PALETTE_24.find((color) => color.id === slug) : undefined
    return stored ?? getCourseColor(courseId ?? 0)
  }

  /** Clears the cache so the next `loadArchive()` call fetches again. */
  function resetArchive(): void {
    cache.reset()
  }

  return {
    archivedCourses,
    loaded,
    loadArchive,
    isArchived,
    courseColor,
    loadCourseContent,
    deleteArchivedCourse,
    applyCourseRemoved,
    resetArchive,
  }
}
