import { describe, it, expect } from 'vitest'
import { buildCalendarItemDetail, buildMarkerState } from '../calendarItemDetail'
import type { DayEvent } from '@/types/calendar'
import type { AcademicEventResponse, TaskResponse } from '@/types/api'

const CACHED_NOTES = [
  {
    id: 'note-1',
    title: 'Lecture 7: Self-Balancing Trees',
    courseId: 1,
    entryDate: '2026-10-22',
  },
]

function taskResponse(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 'task-1',
    courseId: 1,
    noteId: null,
    title: 'Implement AVL Tree Rotations',
    description: null,
    scheduledDate: null,
    duration: null,
    status: 'TODO',
    planCategory: null,
    createdAt: '2026-10-05T12:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z',
    ...overrides,
  }
}

function academicEvent(overrides: Partial<AcademicEventResponse> = {}): AcademicEventResponse {
  return {
    id: 'event-1',
    courseId: 1,
    noteId: null,
    title: 'CS 201 Midterm Examination',
    description: null,
    deadline: '2026-10-22T09:00:00',
    createdAt: '2026-10-01T08:00:00Z',
    ...overrides,
  }
}

const CLASS_EVENT: DayEvent = {
  id: '1',
  courseId: 1,
  title: 'CS 201 - Data Structures & Algorithms',
  start: '2026-10-22 09:00',
  end: '2026-10-22 10:30',
  detail: '',
  colorTheme: 'green',
}

describe('buildCalendarItemDetail', () => {
  it('lists no notes when the task has no noteId (FR-018)', () => {
    const view = buildCalendarItemDetail(taskResponse({ noteId: null }), 'task', CACHED_NOTES)

    expect(view.notes).toEqual([])
  })

  it('lists no notes when the task noteId is empty (FR-018)', () => {
    const view = buildCalendarItemDetail(taskResponse({ noteId: '' }), 'task', CACHED_NOTES)

    expect(view.notes).toEqual([])
  })

  it('resolves the note title from the cached notes list', () => {
    const view = buildCalendarItemDetail(taskResponse({ noteId: 'note-1' }), 'task', CACHED_NOTES)

    expect(view.notes).toEqual([{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }])
  })

  it('sets note title to null when the cached notes list has no match', () => {
    const view = buildCalendarItemDetail(
      taskResponse({ noteId: 'note-gone' }),
      'task',
      CACHED_NOTES,
    )

    expect(view.notes).toEqual([{ id: 'note-gone', title: null }])
  })

  it('sets duration to null when the task has no duration (FR-019)', () => {
    const view = buildCalendarItemDetail(taskResponse({ duration: null }), 'task', CACHED_NOTES)

    expect(view.duration).toBeNull()
  })

  it('formats a known task duration', () => {
    const view = buildCalendarItemDetail(taskResponse({ duration: 'PT1H30M' }), 'task')

    expect(view.duration).toBe('1.5hr')
  })

  it('puts the plan-category label in timeWindow when the task has no scheduledDate', () => {
    const backlog = buildCalendarItemDetail(
      taskResponse({ scheduledDate: null, duration: null }),
      'task',
    )
    const later = buildCalendarItemDetail(
      taskResponse({ scheduledDate: null, duration: 'PT1H' }),
      'task',
    )

    expect(backlog.timeWindow).toBe('Backlog')
    expect(later.timeWindow).toBe('Later')
  })

  it('puts the formatted scheduled date in timeWindow when the task has one', () => {
    const view = buildCalendarItemDetail(taskResponse({ scheduledDate: '2026-10-22' }), 'task')

    expect(view.timeWindow).toBe('Oct 22, 2026')
  })

  it('carries the task id and completed state for the complete control', () => {
    const open = buildCalendarItemDetail(taskResponse({ status: 'TODO' }), 'task')
    const done = buildCalendarItemDetail(taskResponse({ status: 'COMPLETED' }), 'task')

    expect(open.task).toEqual({ id: 'task-1', completed: false })
    expect(done.task).toEqual({ id: 'task-1', completed: true })
  })

  it('always sets event duration to null (FR-017)', () => {
    const view = buildCalendarItemDetail(academicEvent(), 'event', CACHED_NOTES)

    expect(view.duration).toBeNull()
  })

  it('shows the event deadline date and time in timeWindow', () => {
    const view = buildCalendarItemDetail(academicEvent(), 'event')

    expect(view.timeWindow).toBe('Oct 22, 2026, 9 AM')
  })

  it('resolves the event note from the cached notes list', () => {
    const view = buildCalendarItemDetail(academicEvent({ noteId: 'note-1' }), 'event', CACHED_NOTES)

    expect(view.notes).toEqual([{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }])
  })

  it('has no notes, no duration and no complete control for a class', () => {
    const view = buildCalendarItemDetail(CLASS_EVENT, 'class')

    expect(view.kind).toBe('class')
    expect(view.notes).toEqual([])
    expect(view.duration).toBeNull()
    expect(view.task).toBeNull()
  })

  it('lists course notes whose entryDate is the class meeting day', () => {
    const view = buildCalendarItemDetail(CLASS_EVENT, 'class', CACHED_NOTES)

    expect(view.notes).toEqual([{ id: 'note-1', title: 'Lecture 7: Self-Balancing Trees' }])
  })

  it('excludes notes of other days and other courses from a class', () => {
    const notes = [
      ...CACHED_NOTES,
      { id: 'note-old', title: 'Lecture 6', courseId: 1, entryDate: '2026-10-15' },
      { id: 'note-phys', title: 'Gauss law', courseId: 3, entryDate: '2026-10-22' },
    ]
    const view = buildCalendarItemDetail(CLASS_EVENT, 'class', notes)

    expect(view.notes.map((note) => note.id)).toEqual(['note-1'])
  })

  it('carries the meeting day in entryDate for the add-note action', () => {
    const view = buildCalendarItemDetail(CLASS_EVENT, 'class')

    expect(view.entryDate).toBe('2026-10-22')
  })

  it('keeps entryDate null for a task and an event', () => {
    expect(buildCalendarItemDetail(taskResponse(), 'task').entryDate).toBeNull()
    expect(buildCalendarItemDetail(academicEvent(), 'event').entryDate).toBeNull()
  })

  it('uses the schedule time range as the class timeWindow', () => {
    const view = buildCalendarItemDetail(CLASS_EVENT, 'class')

    // formatTimeRange drops the repeated period: "9:00 - 10:30 AM".
    expect(view.timeWindow).toBe('9:00 - 10:30 AM')
  })
})

describe('buildMarkerState', () => {
  it('names the class category', () => {
    expect(buildMarkerState('class')).toEqual({
      category: 'class',
      completed: false,
      label: 'Class',
    })
  })

  it('names the event category', () => {
    expect(buildMarkerState('event')).toEqual({
      category: 'event',
      completed: false,
      label: 'Academic event',
    })
  })

  it('names the open task category', () => {
    expect(buildMarkerState('task', false)).toEqual({
      category: 'task',
      completed: false,
      label: 'Academic task',
    })
  })

  it('names the completed task category', () => {
    expect(buildMarkerState('task', true)).toEqual({
      category: 'task',
      completed: true,
      label: 'Completed academic task',
    })
  })
})
