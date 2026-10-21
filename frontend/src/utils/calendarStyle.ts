/**
 * Resolves the calendar hour row height from the CSS styling variable `--calendar-hour-height`.
 * Defaults to 48px if running outside a browser environment or unset.
 */
export function getHourHeight(): number {
  if (typeof window === 'undefined') return 48
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--calendar-hour-height')
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 48
}
