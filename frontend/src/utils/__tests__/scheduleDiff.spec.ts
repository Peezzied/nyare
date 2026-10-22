import { describe, it, expect } from 'vitest'
import type { DayOfWeek, ScheduleResponse } from '@/types/api'
import type { DraftSchedule } from '@/composables/useCourseDrafts'
import { diffSchedules } from '../scheduleDiff'

function existingRow(
  id: number,
  day: DayOfWeek,
  startTime: string,
  endTime: string,
): ScheduleResponse {
  return { id, courseId: 7, day, startTime, endTime }
}

function desiredRow(day: DayOfWeek, startTime: string, endTime: string): DraftSchedule {
  return { day, startTime, endTime }
}

describe('diffSchedules', () => {
  it('keeps identical rows without update, create, or remove', () => {
    const existing = [
      existingRow(1, 'MONDAY', '09:00', '10:00'),
      existingRow(2, 'WEDNESDAY', '13:00', '14:30'),
    ]
    const desired = [
      desiredRow('MONDAY', '09:00', '10:00'),
      desiredRow('WEDNESDAY', '13:00', '14:30'),
    ]

    const result = diffSchedules(existing, desired)

    expect(result.keep).toEqual(existing)
    expect(result.update).toEqual([])
    expect(result.create).toEqual([])
    expect(result.remove).toEqual([])
  })

  it('pairs a changed row into update with the existing id', () => {
    const existing = [existingRow(5, 'MONDAY', '09:00', '10:00')]
    const desired = [desiredRow('MONDAY', '09:30', '10:30')]

    const result = diffSchedules(existing, desired)

    expect(result.keep).toEqual([])
    expect(result.update).toEqual([
      { id: 5, next: { day: 'MONDAY', startTime: '09:30', endTime: '10:30' } },
    ])
    expect(result.create).toEqual([])
    expect(result.remove).toEqual([])
  })

  it('creates rows that have no existing counterpart', () => {
    const existing = [existingRow(1, 'MONDAY', '09:00', '10:00')]
    const desired = [desiredRow('MONDAY', '09:00', '10:00'), desiredRow('FRIDAY', '15:00', '16:00')]

    const result = diffSchedules(existing, desired)

    expect(result.keep).toEqual([existing[0]])
    expect(result.create).toEqual([{ day: 'FRIDAY', startTime: '15:00', endTime: '16:00' }])
    expect(result.update).toEqual([])
    expect(result.remove).toEqual([])
  })

  it('creates every row when existing is empty', () => {
    const result = diffSchedules([], [desiredRow('TUESDAY', '11:00', '12:00')])

    expect(result.create).toEqual([{ day: 'TUESDAY', startTime: '11:00', endTime: '12:00' }])
    expect(result.keep).toEqual([])
    expect(result.update).toEqual([])
    expect(result.remove).toEqual([])
  })

  it('removes rows that have no desired counterpart', () => {
    const existing = [
      existingRow(1, 'MONDAY', '09:00', '10:00'),
      existingRow(2, 'WEDNESDAY', '13:00', '14:30'),
    ]

    const result = diffSchedules(existing, [])

    expect(result.keep).toEqual([])
    expect(result.remove).toEqual([1, 2])
    expect(result.update).toEqual([])
    expect(result.create).toEqual([])
  })

  it('handles keep, update, create, and remove in one diff', () => {
    const existing = [
      existingRow(1, 'MONDAY', '09:00', '10:00'),
      existingRow(2, 'TUESDAY', '10:00', '11:00'),
      existingRow(3, 'THURSDAY', '14:00', '15:00'),
      existingRow(4, 'SATURDAY', '08:00', '09:00'),
    ]
    const desired = [
      desiredRow('MONDAY', '09:00', '10:00'),
      desiredRow('TUESDAY', '10:30', '11:30'),
      desiredRow('THURSDAY', '14:00', '15:30'),
      desiredRow('SUNDAY', '18:00', '19:00'),
      desiredRow('SUNDAY', '19:00', '20:00'),
    ]

    const result = diffSchedules(existing, desired)

    expect(result.keep).toEqual([existing[0]])
    // Leftover removed rows pair with added rows in input order: ids 2, 3, 4
    // take the first three added rows, so only id 4 is truly removed.
    expect(result.update).toEqual([
      { id: 2, next: { day: 'TUESDAY', startTime: '10:30', endTime: '11:30' } },
      { id: 3, next: { day: 'THURSDAY', startTime: '14:00', endTime: '15:30' } },
      { id: 4, next: { day: 'SUNDAY', startTime: '18:00', endTime: '19:00' } },
    ])
    expect(result.create).toEqual([{ day: 'SUNDAY', startTime: '19:00', endTime: '20:00' }])
    expect(result.remove).toEqual([])
  })

  it('keeps one copy and removes duplicate existing rows with the same key', () => {
    const existing = [
      existingRow(1, 'MONDAY', '09:00', '10:00'),
      existingRow(2, 'MONDAY', '09:00', '10:00'),
    ]
    const desired = [desiredRow('MONDAY', '09:00', '10:00')]

    const result = diffSchedules(existing, desired)

    expect(result.keep).toEqual([existing[0]])
    expect(result.remove).toEqual([2])
    expect(result.update).toEqual([])
    expect(result.create).toEqual([])
  })
})
