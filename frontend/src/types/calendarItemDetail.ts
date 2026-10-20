import type { TapOriginRect } from './notesTransition'

/** Classifies a calendar item for the marker and the detail view. */
export type CalendarItemKind = 'class' | 'task' | 'event'

/** The three marker categories. Maps one-to-one to `CalendarItemKind`. */
export type CalendarItemCategory = 'class' | 'event' | 'task'

/** Source journal entry of a task or an event. */
export interface LinkedNoteRef {
  id: string
  /** `null` when the cached notes list has no matching note. */
  title: string | null
}

/** Minimal shape of a cached note. `NoteSummaryResponse` satisfies it. */
export interface CachedNote {
  readonly id: string
  readonly title: string
}

/** Drives the complete control. `null` for a class and an event. */
export interface CalendarItemTaskState {
  id: string
  completed: boolean
}

/**
 * The single view model of the shared detail component (FR-021).
 * `duration` applies to a task only. `note` applies to a task and an event.
 * `timeWindow` is always a string or `null`, never a placeholder (FR-022).
 */
export interface CalendarItemDetailView {
  kind: CalendarItemKind
  id: string
  title: string
  courseId: number
  timeWindow: string | null
  duration: string | null
  note: LinkedNoteRef | null
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
