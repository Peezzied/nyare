// ponytail: local calendar-day keys; never toISOString (UTC shift bug).

/** Returns local-parts 'YYYY-MM-DD' for a Date. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns a NEW Date shifted by n days; the input is never mutated. */
export function addDays(date: Date, n: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + n)
  return next
}

/** True when both dates fall on the same local calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b)
}
