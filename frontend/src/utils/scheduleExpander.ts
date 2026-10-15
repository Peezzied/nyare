import type { CourseResponse, DayOfWeek, ScheduleResponse } from '../types/api'
import type { DayEvent } from '../types/calendar'

const COLOR_PALETTE: ('green' | 'blue' | 'purple' | 'orange')[] = [
  'green',
  'blue',
  'purple',
  'orange',
]

const DAYS_OF_WEEK: DayOfWeek[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

export function getDayOfWeek(date: Date): DayOfWeek {
  return DAYS_OF_WEEK[date.getDay()] ?? 'SUNDAY'
}

export function formatDateHeader(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  return `${weekday}, ${month} ${day}`
}

export function formatTime12h(timeStr: string): string {
  const parts = timeStr.split(':')
  const hours = parseInt(parts[0] ?? '0', 10)
  const minutes = parseInt(parts[1] ?? '0', 10)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  const displayMinutes = minutes === 0 ? '' : `:${minutes.toString().padStart(2, '0')}`
  return `${displayHours}${displayMinutes} ${period}`
}

export function formatTimeRange(startStr: string, endStr: string): string {
  const startParts = startStr.split(':')
  const endParts = endStr.split(':')
  const startH = parseInt(startParts[0] ?? '0', 10)
  const startM = parseInt(startParts[1] ?? '0', 10)
  const endH = parseInt(endParts[0] ?? '0', 10)
  const endM = parseInt(endParts[1] ?? '0', 10)

  const startPeriod = startH >= 12 ? 'PM' : 'AM'
  const endPeriod = endH >= 12 ? 'PM' : 'AM'

  const startDisplayH = startH % 12 === 0 ? 12 : startH % 12
  const startDisplayM = `:${startM.toString().padStart(2, '0')}`
  const endDisplayH = endH % 12 === 0 ? 12 : endH % 12
  const endDisplayM = `:${endM.toString().padStart(2, '0')}`

  if (startPeriod === endPeriod) {
    return `${startDisplayH}${startDisplayM} - ${endDisplayH}${endDisplayM} ${endPeriod}`
  }
  return `${startDisplayH}${startDisplayM} ${startPeriod} - ${endDisplayH}${endDisplayM} ${endPeriod}`
}

export function expandSchedulesForDate(
  targetDate: Date,
  schedules: ScheduleResponse[],
  courses: CourseResponse[]
): DayEvent[] {
  const targetDay = getDayOfWeek(targetDate)
  const courseMap = new Map<number, CourseResponse>()
  for (const course of courses) {
    courseMap.set(course.id, course)
  }

  const matchingSchedules = schedules.filter((s) => s.day === targetDay)

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const day = String(targetDate.getDate()).padStart(2, '0')
  const datePrefix = `${year}-${month}-${day}`

  return matchingSchedules.map((schedule) => {
    const course = courseMap.get(schedule.courseId)
    const title = course ? course.name : 'Class'
    const detail = course?.description ?? ''

    const startTimeFormatted = schedule.startTime.slice(0, 5)
    const endTimeFormatted = schedule.endTime.slice(0, 5)

    // Color is assigned by courseId so a course keeps the same color every day
    const colorTheme = COLOR_PALETTE[Math.abs(schedule.courseId - 1) % COLOR_PALETTE.length] ?? 'green'

    return {
      id: String(schedule.id),
      courseId: schedule.courseId,
      title,
      start: `${datePrefix} ${startTimeFormatted}`,
      end: `${datePrefix} ${endTimeFormatted}`,
      detail,
      colorTheme,
    }
  })
}

export function calculateGridBoundaries(_events: DayEvent[]): { startHour: number; endHour: number } {
  // Always show the whole day, midnight to midnight
  return { startHour: 0, endHour: 24 }
}
