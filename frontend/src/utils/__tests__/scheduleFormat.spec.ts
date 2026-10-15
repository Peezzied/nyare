import { describe, it, expect } from 'vitest'
import { formatCourseSchedule } from '../scheduleFormat'
import type { ScheduleResponse } from '@/types/api'

describe('formatCourseSchedule', () => {
  it('returns "No set schedule" when schedules list is empty or undefined', () => {
    expect(formatCourseSchedule([])).toBe('No set schedule')
    expect(formatCourseSchedule(undefined as unknown as ScheduleResponse[])).toBe('No set schedule')
  })

  it('formats single schedule day correctly', () => {
    const schedules: ScheduleResponse[] = [
      { id: 1, courseId: 10, day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
    ]
    expect(formatCourseSchedule(schedules)).toBe('Mo')
  })

  it('formats multiple schedules in chronological order (Mo, We, Fr)', () => {
    const schedules: ScheduleResponse[] = [
      { id: 1, courseId: 10, day: 'FRIDAY', startTime: '13:00', endTime: '15:00' },
      { id: 2, courseId: 10, day: 'MONDAY', startTime: '09:00', endTime: '10:00' },
      { id: 3, courseId: 10, day: 'WEDNESDAY', startTime: '09:00', endTime: '10:00' },
    ]
    expect(formatCourseSchedule(schedules)).toBe('Mo, We, Fr')
  })

  it('deduplicates duplicate day entries across multiple time slots', () => {
    const schedules: ScheduleResponse[] = [
      { id: 1, courseId: 10, day: 'TUESDAY', startTime: '09:00', endTime: '10:00' },
      { id: 2, courseId: 10, day: 'TUESDAY', startTime: '14:00', endTime: '15:00' },
      { id: 3, courseId: 10, day: 'THURSDAY', startTime: '09:00', endTime: '10:00' },
    ]
    expect(formatCourseSchedule(schedules)).toBe('Tu, Th')
  })

  it('correctly handles weekend schedules', () => {
    const schedules: ScheduleResponse[] = [
      { id: 1, courseId: 10, day: 'SUNDAY', startTime: '10:00', endTime: '12:00' },
      { id: 2, courseId: 10, day: 'SATURDAY', startTime: '10:00', endTime: '12:00' },
    ]
    expect(formatCourseSchedule(schedules)).toBe('Sa, Su')
  })
})
