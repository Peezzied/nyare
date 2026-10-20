import type { CourseResponse, DayOfWeek, ScheduleResponse } from '@/types/api'
import type { DraftCourse, DraftSchedule } from '@/composables/useCourseDrafts'
import type { CourseEditor } from '@/composables/useCourseEditor'

export interface KnownCourse {
  id: number | string
  name: string
}

export interface KnownSchedule {
  courseId: number | string
  courseName: string
  day: DayOfWeek
  startTime: string
  endTime: string
}

export interface ScheduleCandidate {
  day: DayOfWeek
  startTime: string
  endTime: string
}

export function timeToMinutes(value: string): number {
  if (!value || typeof value !== 'string') {
    return NaN
  }
  const parts = value.trim().split(':')
  if (parts.length < 2 || parts.length > 3) {
    return NaN
  }
  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return NaN
  }
  return hours * 60 + minutes
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aStartMin = timeToMinutes(aStart)
  const aEndMin = timeToMinutes(aEnd)
  const bStartMin = timeToMinutes(bStart)
  const bEndMin = timeToMinutes(bEnd)

  if (
    Number.isNaN(aStartMin) ||
    Number.isNaN(aEndMin) ||
    Number.isNaN(bStartMin) ||
    Number.isNaN(bEndMin)
  ) {
    return false
  }

  if (aStartMin >= aEndMin || bStartMin >= bEndMin) {
    return false
  }

  return aStartMin < bEndMin && aEndMin > bStartMin
}

export interface KnownSetDrafts {
  courses?: DraftCourse[]
  schedules?: DraftSchedule[]
  draftCourses?: DraftCourse[]
  draftSchedules?: DraftSchedule[]
}

export function buildKnownSet(
  courses: Array<{ id: number; name: string }>,
  schedules: Array<{ courseId: number; day: DayOfWeek; startTime: string; endTime: string }>,
  drafts?: KnownSetDrafts | DraftCourse[],
): { courses: KnownCourse[]; schedules: KnownSchedule[] } {
  const courseNameById = new Map<number | string, string>()
  const knownCourses: KnownCourse[] = []
  const knownSchedules: KnownSchedule[] = []

  for (const c of courses ?? []) {
    courseNameById.set(c.id, c.name)
    knownCourses.push({ id: c.id, name: c.name })
  }

  for (const s of schedules ?? []) {
    const courseName = courseNameById.get(s.courseId) ?? ''
    knownSchedules.push({
      courseId: s.courseId,
      courseName,
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
    })
  }

  const draftCourseList = Array.isArray(drafts)
    ? drafts
    : (drafts?.courses ?? drafts?.draftCourses ?? [])

  const draftScheduleList = Array.isArray(drafts)
    ? []
    : (drafts?.schedules ?? drafts?.draftSchedules ?? [])

  for (const d of draftCourseList) {
    courseNameById.set(d.tempId, d.name)
    knownCourses.push({ id: d.tempId, name: d.name })
    if (d.schedules) {
      for (const ds of d.schedules) {
        knownSchedules.push({
          courseId: d.tempId,
          courseName: d.name,
          day: ds.day,
          startTime: ds.startTime,
          endTime: ds.endTime,
        })
      }
    }
  }

  for (const ds of draftScheduleList) {
    if (
      ds.tempId &&
      !knownSchedules.some(
        (s) =>
          s.courseId === ds.tempId &&
          s.day === ds.day &&
          s.startTime === ds.startTime &&
          s.endTime === ds.endTime,
      )
    ) {
      const courseName = courseNameById.get(ds.tempId) ?? ''
      knownSchedules.push({
        courseId: ds.tempId,
        courseName,
        day: ds.day,
        startTime: ds.startTime,
        endTime: ds.endTime,
      })
    }
  }

  return { courses: knownCourses, schedules: knownSchedules }
}

export function findDuplicateName(name: string, known: KnownCourse[]): KnownCourse | null {
  if (!name || typeof name !== 'string') {
    return null
  }
  const trimmed = name.trim().toLowerCase()
  if (trimmed.length === 0) {
    return null
  }
  for (const course of known ?? []) {
    if (course.name && course.name.trim().toLowerCase() === trimmed) {
      return course
    }
  }
  return null
}

export function findClash(
  candidate: ScheduleCandidate,
  known: KnownSchedule[],
): KnownSchedule | null {
  if (!candidate || !candidate.day || !candidate.startTime || !candidate.endTime) {
    return null
  }
  for (const item of known ?? []) {
    if (item.day === candidate.day) {
      if (rangesOverlap(candidate.startTime, candidate.endTime, item.startTime, item.endTime)) {
        return item
      }
    }
  }
  return null
}

/**
 * Returns the first save-blocking conflict for a course editor, or `null`.
 * Catalog rows of the course being edited are skipped through `persistedId`
 * and `id`. The messages match `editorConflictError` in CreateScheduleView.
 */
export function findEditorConflict(
  editor: CourseEditor,
  courses: CourseResponse[],
  schedules: ScheduleResponse[],
): string | null {
  const known = buildKnownSet(courses ?? [], schedules ?? [])
  const coursesToCheck = known.courses.filter(
    (c) => c.id !== editor.id && c.id !== editor.persistedId,
  )
  const duplicate = findDuplicateName(editor.name, coursesToCheck)
  if (duplicate) {
    return `A course named "${editor.name.trim()}" already exists.`
  }

  const schedulesToCheck = known.schedules.filter(
    (s) => s.courseId !== editor.id && s.courseId !== editor.persistedId,
  )
  const editorBlocks = editor.blocks

  for (let i = 0; i < editorBlocks.length; i++) {
    const b1 = editorBlocks[i]!
    for (const day of b1.selectedDays) {
      const candidate: ScheduleCandidate = {
        day,
        startTime: b1.startTime,
        endTime: b1.endTime,
      }
      const clash = findClash(candidate, schedulesToCheck)
      if (clash) {
        return `A class time clashes with ${clash.courseName || 'another class'} on ${day}.`
      }

      for (let j = i + 1; j < editorBlocks.length; j++) {
        const b2 = editorBlocks[j]!
        if (
          b2.selectedDays.includes(day) &&
          rangesOverlap(b1.startTime, b1.endTime, b2.startTime, b2.endTime)
        ) {
          return `Two time blocks for this course overlap on ${day}.`
        }
      }
    }
  }

  return null
}

export const ALL_WEEKDAYS: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

export interface BlockLike {
  id?: string
  startTime: string
  endTime: string
  selectedDays?: DayOfWeek[]
}

export function unavailableDaysFor(
  block: BlockLike,
  known: KnownSchedule[],
  siblings: BlockLike[],
): DayOfWeek[] {
  if (
    !block.startTime ||
    !block.endTime ||
    timeToMinutes(block.startTime) >= timeToMinutes(block.endTime)
  ) {
    return []
  }

  const unavailable: DayOfWeek[] = []

  for (const day of ALL_WEEKDAYS) {
    const knownClash = (known ?? []).some(
      (s) => s.day === day && rangesOverlap(block.startTime, block.endTime, s.startTime, s.endTime),
    )
    if (knownClash) {
      unavailable.push(day)
      continue
    }

    const siblingClash = (siblings ?? []).some(
      (sib) =>
        sib.id !== block.id &&
        sib.selectedDays?.includes(day) &&
        rangesOverlap(block.startTime, block.endTime, sib.startTime, sib.endTime),
    )
    if (siblingClash) {
      unavailable.push(day)
    }
  }

  return unavailable
}
