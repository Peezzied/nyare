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

/** ISO 8601 week number (1-53) of the week containing `date`.
 *  ISO weeks start on Monday; the year's ownership is fixed by Thursday. */
export function isoWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const weekday = d.getUTCDay() || 7 // Sunday counts as 7
  d.setUTCDate(d.getUTCDate() + 4 - weekday) // step to this week's Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const dayOfYear = (d.getTime() - yearStart.getTime()) / 86400000 + 1
  return Math.ceil(dayOfYear / 7)
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
