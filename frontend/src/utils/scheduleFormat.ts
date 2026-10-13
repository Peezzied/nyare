// ponytail: lightweight schedule day aggregator and shorthand formatter

import type { ScheduleResponse, DayOfWeek } from '@/types/api'

const DAY_ORDER: Record<DayOfWeek, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
}

const DAY_SHORTHAND: Record<DayOfWeek, string> = {
  MONDAY: 'Mo',
  TUESDAY: 'Tu',
  WEDNESDAY: 'We',
  THURSDAY: 'Th',
  FRIDAY: 'Fr',
  SATURDAY: 'Sa',
  SUNDAY: 'Su',
}

/**
 * Formats a list of course schedules into an ordered, deduplicated
 * day shorthand string such as "Mo, We, Th" or "No set schedule".
 */
export function formatCourseSchedule(schedules?: ScheduleResponse[] | null): string {
  if (!schedules || schedules.length === 0) {
    return 'No set schedule'
  }

  const uniqueDays = Array.from(new Set(schedules.map((s) => s.day).filter(Boolean)))
  if (uniqueDays.length === 0) {
    return 'No set schedule'
  }

  uniqueDays.sort((a, b) => (DAY_ORDER[a] ?? 99) - (DAY_ORDER[b] ?? 99))

  return uniqueDays.map((day) => DAY_SHORTHAND[day] ?? day).join(', ')
}
