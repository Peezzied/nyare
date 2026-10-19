// ponytail: one mapping from calendar rows and DTOs to the shared detail view model.

import type { AcademicEventResponse, TaskResponse } from '@/types/api'
import type { DayEvent } from '@/types/calendar'
import type {
  CalendarItemCategory,
  CalendarItemDetailView,
  CalendarItemKind,
  CalendarItemMarkerState,
  CachedNote,
  LinkedNoteRef,
} from '@/types/calendarItemDetail'
import { getPlanCategory } from './planCategory'
import { formatTime12h, formatTimeRange } from './scheduleExpander'
import { formatDuration } from './taskUrgency'

const CATEGORY_LABELS: Record<CalendarItemCategory, string> = {
  class: 'Class',
  event: 'Academic event',
  task: 'Academic task',
}

/** Dateless tasks show their derived plan category in place of a time window. */
const PLAN_CATEGORY_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  LATER: 'Later',
  BACKLOG: 'Backlog',
}

/**
 * Formats a day-level ISO date as `Oct 22, 2026`.
 * Splits the parts by hand so a date never shifts across time zones.
 */
function formatDayLabel(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return isoDate
  }
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Formats the event deadline as `Oct 22, 2026, 9 AM`. */
function formatDeadlineLabel(deadline: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(deadline)
  const datePart = match?.[1]
  const timePart = match?.[2]
  if (datePart && timePart) {
    return `${formatDayLabel(datePart)}, ${formatTime12h(timePart)}`
  }
  if (datePart) {
    return formatDayLabel(datePart)
  }
  return deadline
}

/**
 * Links a note identifier to its cached note. Returns `null` for a missing or
 * empty identifier (FR-018). A missing cache entry keeps the link usable with
 * a `null` title.
 */
function resolveNote(
  noteId: string | null | undefined,
  notes: readonly CachedNote[],
): LinkedNoteRef | null {
  if (!noteId) return null
  const cached = notes.find((note) => note.id === noteId)
  return { id: noteId, title: cached ? cached.title : null }
}

function buildClassView(dayEvent: DayEvent): CalendarItemDetailView {
  const startTime = dayEvent.start.split(' ')[1] ?? ''
  const endTime = dayEvent.end.split(' ')[1] ?? ''
  return {
    kind: 'class',
    id: dayEvent.id,
    title: dayEvent.title,
    courseId: dayEvent.courseId,
    timeWindow: formatTimeRange(startTime, endTime),
    duration: null,
    note: null,
    task: null,
  }
}

function buildTaskView(task: TaskResponse, notes: readonly CachedNote[]): CalendarItemDetailView {
  const duration = task.duration ? formatDuration(task.duration) : ''
  return {
    kind: 'task',
    id: task.id,
    title: task.title,
    courseId: task.courseId,
    timeWindow: task.scheduledDate
      ? formatDayLabel(task.scheduledDate)
      : (PLAN_CATEGORY_LABELS[getPlanCategory(task)] ?? null),
    // An unknown or unparseable duration stays empty (FR-019).
    duration: duration || null,
    note: resolveNote(task.noteId, notes),
    task: { id: task.id, completed: task.status === 'COMPLETED' },
  }
}

function buildEventView(
  event: AcademicEventResponse,
  notes: readonly CachedNote[],
): CalendarItemDetailView {
  return {
    kind: 'event',
    id: event.id,
    title: event.title,
    courseId: event.courseId,
    timeWindow: formatDeadlineLabel(event.deadline),
    // An academic event carries no duration (FR-017).
    duration: null,
    note: resolveNote(event.noteId, notes),
    task: null,
  }
}

/** Builds the detail view model for a class meeting. */
export function buildCalendarItemDetail(item: DayEvent, kind: 'class'): CalendarItemDetailView
/** Builds the detail view model for an academic task. */
export function buildCalendarItemDetail(
  item: TaskResponse,
  kind: 'task',
  notes?: readonly CachedNote[],
): CalendarItemDetailView
/** Builds the detail view model for an academic event. */
export function buildCalendarItemDetail(
  item: AcademicEventResponse,
  kind: 'event',
  notes?: readonly CachedNote[],
): CalendarItemDetailView
export function buildCalendarItemDetail(
  item: DayEvent | TaskResponse | AcademicEventResponse,
  kind: CalendarItemKind,
  notes: readonly CachedNote[] = [],
): CalendarItemDetailView {
  switch (kind) {
    case 'class':
      return buildClassView(item as DayEvent)
    case 'task':
      return buildTaskView(item as TaskResponse, notes)
    case 'event':
      return buildEventView(item as AcademicEventResponse, notes)
  }
}

/** Derives the week-view marker state for one category (FR-001, FR-005). */
export function buildMarkerState(
  category: CalendarItemCategory,
  completed = false,
): CalendarItemMarkerState {
  const base = CATEGORY_LABELS[category]
  const label = category === 'task' && completed ? `Completed ${base.toLowerCase()}` : base
  return { category, completed, label }
}
