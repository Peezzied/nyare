import { ref } from 'vue'
import type { CourseResponse, DayOfWeek } from '@/types/api'
import { ApiError } from '@/api/client'
import { coursesApi, schedulesApi } from '@/api'
import { useCatalog } from '@/composables/useCatalog'
import { createCache } from './createCache'

export interface DraftSchedule {
  tempId?: string
  day: DayOfWeek
  startTime: string
  endTime: string
}

export interface DraftCourse {
  tempId: string
  name: string
  colorId: string
  schedules: DraftSchedule[]
  /** Backend id when this draft re-persists an already saved course. */
  courseId?: number
}

const draftCourses = ref<DraftCourse[]>([])
const draftSchedules = ref<DraftSchedule[]>([])

// Session-scoped drafts: sign-out or an account switch empties them (FR-017).
createCache(() => {
  draftCourses.value = []
  draftSchedules.value = []
})

export function useCourseDrafts() {
  function stageCourse(course: DraftCourse) {
    const existingIndex = draftCourses.value.findIndex((c) => c.tempId === course.tempId)
    if (existingIndex >= 0) {
      draftCourses.value[existingIndex] = course
      draftSchedules.value = draftSchedules.value.filter((s) => s.tempId !== course.tempId)
    } else {
      draftCourses.value.push(course)
    }
    if (course.schedules && course.schedules.length > 0) {
      for (const s of course.schedules) {
        stageSchedule(course.tempId, s)
      }
    }
  }

  function stageSchedule(tempId: string, schedule: DraftSchedule) {
    draftSchedules.value.push({
      ...schedule,
      tempId,
    })
  }

  function unstageCourse(tempId: string) {
    draftCourses.value = draftCourses.value.filter((c) => c.tempId !== tempId)
    draftSchedules.value = draftSchedules.value.filter((s) => s.tempId !== tempId)
  }

  function resetDrafts() {
    draftCourses.value = []
    draftSchedules.value = []
  }

  /**
   * Persists every staged draft. Re-persisted drafts replace their backend
   * course (delete then create; onboarding drafts have no other channel).
   * Successfully persisted drafts unstage; on failure the rest stay staged
   * for retry. Returns each created course with its draft `tempId`.
   */
  async function flush(): Promise<{ tempId: string; course: CourseResponse }[]> {
    const { applyCourseCreated, applyCourseDeleted, applyScheduleCreated } = useCatalog()
    const created: { tempId: string; course: CourseResponse }[] = []
    for (const course of draftCourses.value.slice()) {
      if (course.courseId != null) {
        try {
          await coursesApi.delete(course.courseId)
        } catch (error) {
          // A stale id must not block re-persisting the draft.
          if (!(error instanceof ApiError && error.status === 404)) {
            throw error
          }
        }
        applyCourseDeleted(course.courseId)
      }
      const createdCourse = await coursesApi.create({
        name: course.name,
        color: course.colorId,
      })
      applyCourseCreated(createdCourse)
      const courseSchedules = draftSchedules.value.filter((s) => s.tempId === course.tempId)
      try {
        for (const s of courseSchedules) {
          applyScheduleCreated(
            await schedulesApi.create({
              courseId: createdCourse.id,
              day: s.day,
              startTime: s.startTime,
              endTime: s.endTime,
            }),
          )
        }
      } catch (error) {
        try {
          await coursesApi.delete(createdCourse.id)
          applyCourseDeleted(createdCourse.id)
        } catch {
          // Compensation is best effort; the draft stays staged either way.
        }
        throw error
      }
      unstageCourse(course.tempId)
      created.push({ tempId: course.tempId, course: createdCourse })
    }
    return created
  }

  return {
    draftCourses,
    draftSchedules,
    stageCourse,
    stageSchedule,
    unstageCourse,
    resetDrafts,
    flush,
  }
}
