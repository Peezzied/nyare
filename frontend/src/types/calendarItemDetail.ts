import type { TapOriginRect } from './notesTransition'

/** Classifies a calendar item for the marker and the detail view. */
export type CalendarItemKind = 'class' | 'task' | 'event'

/** The three marker categories. Maps one-to-one to `CalendarItemKind`. */
export type CalendarItemCategory = 'class' | 'event' | 'task'

/** Journal entry linked to a calendar item. */
export interface LinkedNoteRef {
  id: string
  /** `null` when the cached notes list has no matching note. */
  title: string | null
}

/** Minimal shape of a cached note. `NoteSummaryResponse` satisfies it. */
export interface CachedNote {
  readonly id: string
  readonly title: string
  readonly courseId: number
  /** ISO date `YYYY-MM-DD`; matches a class meeting's day for linked notes. */
  readonly entryDate: string
}

/** Drives the complete control. `null` for a class and an event. */
export interface CalendarItemTaskState {
  id: string
  completed: boolean
}

/**
 * The single view model of the shared detail component (FR-021).
 * `duration` applies to a task only. A task and an event list their single
 * source note in `notes`; a class lists the course's notes from its meeting day.
 * `timeWindow` is always a string or `null`, never a placeholder (FR-022).
 */
export interface CalendarItemDetailView {
  kind: CalendarItemKind
  id: string
  title: string
  courseId: number
  timeWindow: string | null
  duration: string | null
  notes: LinkedNoteRef[]
  /**
   * ISO date `YYYY-MM-DD` a new note takes on the add-note action. A class
   * carries its meeting day; a task and an event carry `null`.
   */
  entryDate: string | null
  task: CalendarItemTaskState | null
  /** Host-owned tap geometry. The builder leaves it unset. */
  originRect?: TapOriginRect | null
}

/** Derived marker data for the week view (FR-001, FR-005). */
export interface CalendarItemMarkerState {
  category: CalendarItemCategory
  completed: boolean
  /** Accessible name of the category, for example `Academic task`. */
  label: string
}
