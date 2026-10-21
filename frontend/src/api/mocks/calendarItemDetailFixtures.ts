// ponytail: view-model fixtures for the shared detail component and the week marker.

import type { CalendarItemDetailView, CalendarItemMarkerState } from '@/types/calendarItemDetail'
import { buildMarkerState } from '@/utils/calendarItemDetail'

/** One story-ready detail state. */
export interface CalendarItemDetailFixture {
  name: string
  item: CalendarItemDetailView
  /** Set on marker fixtures: the derived week-view marker form (FR-024). */
  marker?: CalendarItemMarkerState
  /** Set on `week-overflow-day`: more items than the week cell shows (FR-024). */
  markers?: CalendarItemMarkerState[]
}

const CLASS_ITEM: CalendarItemDetailView = {
  kind: 'class',
  id: 'schedule-cs201-mon',
  title: 'CS 201 - Data Structures & Algorithms',
  courseId: 1,
  timeWindow: '9:00 - 10:30 AM',
  duration: null,
  notes: [],
  entryDate: '2026-10-21',
  task: null,
}

const OPEN_TASK_ITEM: CalendarItemDetailView = {
  kind: 'task',
  id: 'task-cs201-avl-impl',
  title: 'Implement AVL Tree Rotations',
  courseId: 1,
  timeWindow: 'Oct 10, 2026',
  duration: '1.5hr',
  notes: [{ id: 'note-cs201-avl', title: 'Lecture 7: Self-Balancing Trees' }],
  entryDate: null,
  task: { id: 'task-cs201-avl-impl', completed: false },
}

const COMPLETED_TASK_ITEM: CalendarItemDetailView = {
  kind: 'task',
  id: 'task-cs201-hw1',
  title: 'Submit CS 201 Homework 1',
  courseId: 1,
  timeWindow: 'Oct 4, 2026',
  duration: '45min',
  notes: [],
  entryDate: null,
  task: { id: 'task-cs201-hw1', completed: true },
}

const EVENT_ITEM: CalendarItemDetailView = {
  kind: 'event',
  id: 'event-cs201-midterm',
  title: 'CS 201 Midterm Examination',
  courseId: 1,
  timeWindow: 'Oct 22, 2026, 9 AM',
  duration: null,
  notes: [{ id: 'note-cs201-avl', title: 'Lecture 7: Self-Balancing Trees' }],
  entryDate: null,
  task: null,
}

/** Every detail and marker state the spec asks the mock layer to expose. */
export const CALENDAR_ITEM_DETAIL_FIXTURES: CalendarItemDetailFixture[] = [
  {
    name: 'class-with-window',
    item: CLASS_ITEM,
  },
  {
    name: 'class-with-notes',
    item: {
      ...CLASS_ITEM,
      // The meeting day's journal entries.
      notes: [
        { id: 'note-cs201-avl', title: 'Lecture 7: Self-Balancing Trees' },
        { id: 'note-cs201-avl-recap', title: 'AVL recap before the lab' },
      ],
    },
  },
  {
    name: 'task-with-note-and-duration',
    item: OPEN_TASK_ITEM,
  },
  {
    name: 'task-without-note',
    item: {
      kind: 'task',
      id: 'task-cs201-hw2',
      title: 'Submit CS 201 Homework 2',
      courseId: 1,
      timeWindow: 'Oct 20, 2026',
      duration: '1hr',
      // No source note, so the note control stays hidden (FR-018).
      notes: [],
      entryDate: null,
      task: { id: 'task-cs201-hw2', completed: false },
    },
  },
  {
    name: 'task-without-duration',
    item: {
      kind: 'task',
      id: 'task-math204-review',
      title: 'Review Eigenvalue Exercises',
      courseId: 2,
      timeWindow: 'Oct 23, 2026',
      // Unknown duration, so the duration field stays hidden (FR-019).
      duration: null,
      notes: [{ id: 'note-math204-eigen', title: 'Lecture 12: Eigenvalues and Diagonalization' }],
      entryDate: null,
      task: { id: 'task-math204-review', completed: false },
    },
  },
  {
    name: 'task-without-scheduled-date',
    item: {
      kind: 'task',
      id: 'task-phys102-lab-report',
      title: 'Draft Physics Lab 3 Report on Gauss Law',
      courseId: 3,
      // No scheduled date, so the plan-category label replaces the date.
      timeWindow: 'Later',
      duration: '1hr',
      notes: [],
      entryDate: null,
      task: { id: 'task-phys102-lab-report', completed: false },
    },
  },
  {
    name: 'task-completed',
    item: COMPLETED_TASK_ITEM,
  },
  {
    name: 'event-with-note',
    item: EVENT_ITEM,
  },
  {
    name: 'event-without-note',
    item: {
      kind: 'event',
      id: 'event-phys102-exam1',
      title: 'PHYS 102 First Midterm Exam',
      courseId: 3,
      timeWindow: 'Oct 28, 2026, 1:30 PM',
      duration: null,
      notes: [],
      entryDate: null,
      task: null,
    },
  },
  {
    name: 'marker-class',
    item: CLASS_ITEM,
    marker: buildMarkerState('class'),
  },
  {
    name: 'marker-event',
    item: EVENT_ITEM,
    marker: buildMarkerState('event'),
  },
  {
    name: 'marker-task-open',
    item: OPEN_TASK_ITEM,
    marker: buildMarkerState('task', false),
  },
  {
    name: 'marker-task-completed',
    item: COMPLETED_TASK_ITEM,
    marker: buildMarkerState('task', true),
  },
  {
    name: 'week-overflow-day',
    item: OPEN_TASK_ITEM,
    markers: [
      buildMarkerState('task', false),
      buildMarkerState('event'),
      buildMarkerState('task', true),
    ],
  },
]
