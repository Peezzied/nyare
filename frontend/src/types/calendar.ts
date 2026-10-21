/** The calendar home's three view modes. */
export type CalendarViewMode = 'day' | 'week' | 'deadlines'

/** Frontend-only calendar view model for the day view schedule grid. */
export interface DayEvent {
  readonly id: string
  readonly courseId: number
  readonly title: string
  readonly start: string
  readonly end: string
  readonly detail: string
}
