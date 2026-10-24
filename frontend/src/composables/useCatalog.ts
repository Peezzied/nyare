import { ref } from 'vue'
import { coursesApi, schedulesApi } from '@/api'
import { createCache } from './createCache'
import { useAcademicEvents } from './useAcademicEvents'
import { useArchive } from './useArchive'
import { useNotes } from './useNotes'
import { usePlannerStatus } from './usePlannerStatus'
import { useTasks } from './useTasks'
import { COURSE_PALETTE_24, getCourseColor, type CoursePaletteColor } from '@/utils/courseColors'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

// Module-level state, so every useCatalog() caller shares one cache.
const courses = ref<CourseResponse[]>([])
const schedules = ref<ScheduleResponse[]>([])
const loaded = ref(false)
const cache = createCache(() => {
  courses.value = []
  schedules.value = []
  loaded.value = false
})

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
    if (cache.pending) {
      await cache.pending
      return
    }
    const g = cache.begin()
    const seq = cache.beginLoad()
    const fetchPromise = (async () => {
      const [courseList, scheduleList] = await Promise.all([coursesApi.list(), schedulesApi.list()])
      if (cache.isLatest(seq, g)) {
        courses.value = courseList
        schedules.value = scheduleList
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

  function applyCourseCreated(course: CourseResponse): void {
    courses.value = [...courses.value, course]
  }

  function applyCourseUpdated(course: CourseResponse): void {
    courses.value = courses.value.map((current) => (current.id === course.id ? course : current))
  }

  /** Deletes the course via the API and drops it from the cache. */
  async function deleteCourse(id: number): Promise<void> {
    await coursesApi.delete(id)
    applyCourseDeleted(id)
  }

  /** Removes the course and its schedules from the cache. */
  function applyCourseDeleted(id: number): void {
    courses.value = courses.value.filter((course) => course.id !== id)
    schedules.value = schedules.value.filter((schedule) => schedule.courseId !== id)
    // A deleted course invalidates its tasks, events, and planner status.
    useTasks().resetTasks()
    useAcademicEvents().resetEvents()
    usePlannerStatus().reset()
    void usePlannerStatus()
      .refresh()
      .catch(() => {})
  }

  /** Archives the course via the API and drops it from the cache. */
  async function archiveCourse(id: number): Promise<void> {
    await coursesApi.archive(id)
    applyCourseArchived(id)
  }

  /**
   * Archives every active course via the bulk endpoint and drops each returned
   * course from the cache. Returns the archived ids so callers can offer Undo.
   */
  async function archiveAllCourses(): Promise<number[]> {
    const archived = await coursesApi.archiveAll()
    for (const course of archived) {
      applyCourseArchived(course.id)
    }
    useArchive().resetArchive()
    return archived.map((course) => course.id)
  }

  /** Removes the archived course and its schedules from the cache. */
  function applyCourseArchived(id: number): void {
    courses.value = courses.value.filter((course) => course.id !== id)
    schedules.value = schedules.value.filter((schedule) => schedule.courseId !== id)
    // An archived course invalidates its notes, tasks, events, archive list, and planner status.
    useNotes().resetNotes()
    useTasks().resetTasks()
    useAcademicEvents().resetEvents()
    useArchive().resetArchive()
    usePlannerStatus().reset()
    void usePlannerStatus()
      .refresh()
      .catch(() => {})
  }

  /**
   * Restores archived courses via the batch endpoint. Inserts the returned
   * courses into the cache sorted by id, then reloads the catalog so the
   * restored schedules return (the cache never held them). Notes, tasks,
   * events, and planner caches reset so their next loads re-fetch.
   */
  async function unarchiveCourses(ids: number[]): Promise<void> {
    const restored = await coursesApi.unarchiveMany(ids)
    const byId = new Map(courses.value.map((course) => [course.id, course]))
    for (const course of restored) {
      byId.set(course.id, course)
    }
    courses.value = [...byId.values()].sort((a, b) => a.id - b.id)
    for (const course of restored) {
      useArchive().applyCourseRemoved(course.id)
    }
    useNotes().resetNotes()
    useTasks().resetTasks()
    useAcademicEvents().resetEvents()
    usePlannerStatus().reset()
    void usePlannerStatus()
      .refresh()
      .catch(() => {})
    await loadCatalog(true)
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
    cache.reset()
  }

  /**
   * Resolves the color of a course for presentation. A stored `color` slug
   * that matches `COURSE_PALETTE_24` wins; an absent course or a missing or
   * unknown slug falls back to the derived `getCourseColor(courseId)`.
   */
  function courseColor(courseId: number | undefined | null): CoursePaletteColor {
    const slug = courses.value.find((course) => course.id === courseId)?.color
    const stored = slug ? COURSE_PALETTE_24.find((color) => color.id === slug) : undefined
    return stored ?? getCourseColor(courseId ?? 0)
  }

  return {
    courses,
    schedules,
    loaded,
    loadCatalog,
    courseColor,
    deleteCourse,
    archiveCourse,
    archiveAllCourses,
    unarchiveCourses,
    applyCourseCreated,
    applyCourseUpdated,
    applyCourseDeleted,
    applyCourseArchived,
    applyScheduleCreated,
    applyScheduleUpdated,
    applyScheduleDeleted,
    resetCatalog,
  }
}
