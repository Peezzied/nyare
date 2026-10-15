import { addDays } from './dayKey'

/** The week starts on Sunday, like the mockup and Google Calendar. */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getDay())
}

/** The seven days (Sunday to Saturday) of the week that contains `date`. */
export function weekDates(date: Date): Date[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
}

/** Header title for the week view, e.g. "October 2026" or "Oct – Nov 2026". */
export function formatWeekTitle(date: Date): string {
  const first = startOfWeek(date)
  const last = addDays(first, 6)
  if (first.getMonth() === last.getMonth()) {
    return first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  const short = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' })
  return `${short(first)} – ${short(last)} ${last.getFullYear()}`
}
