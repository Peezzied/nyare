import { ref } from 'vue'
import type { DayOfWeek } from '@/types/api'
import { coursesApi, schedulesApi } from '@/api'

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
}

const draftCourses = ref<DraftCourse[]>([])
const draftSchedules = ref<DraftSchedule[]>([])

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

  function resetDrafts() {
    draftCourses.value = []
    draftSchedules.value = []
  }

  async function flush() {
    for (const course of draftCourses.value) {
      const createdCourse = await coursesApi.create({
        name: course.name,
      })
      const courseSchedules = draftSchedules.value.filter((s) => s.tempId === course.tempId)
      for (const s of courseSchedules) {
        await schedulesApi.create({
          courseId: createdCourse.id,
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
        })
      }
    }
  }

  return {
    draftCourses,
    draftSchedules,
    stageCourse,
    stageSchedule,
    resetDrafts,
    flush,
  }
}
