// ponytail: untimed derivation for the native Schedule-X all-day row.

import { Temporal } from 'temporal-polyfill'
import type { AcademicEventResponse, TaskResponse } from '@/types/api'

export interface UntimedDayItem {
  id: string
  title: string
  category: 'task' | 'event'
  courseId: number
  completed: boolean
  date: string
}

/**
 * Derives untimed items for one calendar day. A task is included only when
 * its date-only `scheduledDate` equals the active day; an event only when its
 * `deadline` falls on the active day. Nothing is invented for dateless tasks.
 */
export function deriveUntimedItems(
  tasks: TaskResponse[],
  events: AcademicEventResponse[],
  activeDateKey: string,
): UntimedDayItem[] {
  const items: UntimedDayItem[] = []
  for (const task of tasks) {
    if (task.scheduledDate !== activeDateKey) continue
    items.push({
      id: task.id,
      title: task.title,
      category: 'task',
      courseId: task.courseId,
      completed: task.status === 'COMPLETED',
      date: activeDateKey,
    })
  }
  for (const event of events) {
    // A deadline carries a clock time (`2026-10-22T09:00:00`); compare its date part only.
    if (event.deadline.slice(0, 10) !== activeDateKey) continue
    items.push({
      id: event.id,
      title: event.title,
      category: 'event',
      courseId: event.courseId,
      completed: false,
      date: activeDateKey,
    })
  }
  return items
}

export interface SxFullDayEvent {
  id: string
  title: string
  start: Temporal.PlainDate
  end: Temporal.PlainDate
  _raw: UntimedDayItem
}

/**
 * Maps one untimed item to a Schedule-X full-day event. PlainDate start/end
 * on the same date classifies as _isSingleDayFullDay, so the item renders in
 * the native .sx__date-grid row and can never land in the time grid.
 */
export function toSxFullDayEvent(item: UntimedDayItem): SxFullDayEvent {
  const day = Temporal.PlainDate.from(item.date)
  return {
    id: item.id,
    title: item.title,
    start: day,
    end: day,
    _raw: item,
  }
}
