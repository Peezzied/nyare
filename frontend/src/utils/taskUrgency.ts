// ponytail: urgency tokens and duration formatting for task rows.

/** Whole-day difference between a due date string and local today. */
export type TaskUrgency = 'OVERDUE_OR_TODAY' | 'APPROACHING' | 'FUTURE' | 'NONE'

/** Urgency hex colors keyed by urgency level. */
export const URGENCY_COLORS: Record<TaskUrgency, string> = {
  OVERDUE_OR_TODAY: 'var(--color-urgency-red)',
  APPROACHING: 'var(--color-urgency-yellow)',
  FUTURE: 'var(--color-urgency-green)',
  NONE: 'var(--color-text-muted)',
}

/** Whole-day difference between a due date and local today. Negative means past. */
function dayDiffFromToday(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00')
  return Math.round((due.getTime() - today.getTime()) / 86_400_000)
}

/** True when dueDate is a whole day before local today. */
export function isOverdue(dueDate: string | null | undefined): boolean {
  return !!dueDate && dayDiffFromToday(dueDate) < 0
}

/**
 * Computes urgency from a due-date string (yyyy-MM-dd) relative to local today.
 * Returns NONE when dueDate is absent.
 */
export function getTaskUrgency(dueDate: string | null | undefined): TaskUrgency {
  if (!dueDate) return 'NONE'
  const diffDays = dayDiffFromToday(dueDate)
  if (diffDays <= 0) return 'OVERDUE_OR_TODAY'
  if (diffDays <= 2) return 'APPROACHING'
  return 'FUTURE'
}

/**
 * Formats a due-date string for the calendar label.
 * Returns 'TODAY' for offset 0, 'mm/dd' for other dates, '' for absent.
 */
export function formatDueLabel(dueDate: string | null | undefined): string {
  if (!dueDate) return ''
  const diffDays = dayDiffFromToday(dueDate)
  if (diffDays === 0) return 'Today'
  const due = new Date(dueDate + 'T00:00:00')
  const mm = String(due.getMonth() + 1).padStart(2, '0')
  const dd = String(due.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
}

/**
 * Formats an ISO-8601 duration string to a compact display string.
 * '30m', '1hr', '1.5hr', etc. Returns '' for absent durations.
 */
export function formatDuration(iso: string | null | undefined): string {
  if (!iso) return ''
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(iso.trim())
  if (!match) return ''
  const [, dStr, hStr, mStr] = match
  const days = dStr ? parseInt(dStr, 10) : 0
  const hours = hStr ? parseInt(hStr, 10) : 0
  const mins = mStr ? parseInt(mStr, 10) : 0
  const totalMins = days * 1440 + hours * 60 + mins
  if (totalMins === 0) return ''
  const totalHours = totalMins / 60
  if (totalMins < 60) return `${totalMins}m`
  if (totalMins % 60 === 0) return `${totalHours}hr`
  // Express as decimal hours (e.g. 90 min -> 1.5hr)
  const decimal = Math.round(totalHours * 10) / 10
  return `${decimal}hr`
}
