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

/**
 * Resolves the time-axis gutter width from `--sx-calendar-week-grid-padding-left`.
 * Defaults to 55px if running outside a browser environment or unset.
 */
export function getGutterLeft(): number {
  if (typeof window === 'undefined') return 55
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    '--sx-calendar-week-grid-padding-left',
  )
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 55
}

/** Converts a 'yyyy-MM-dd HH:mm' datetime string to whole minutes. */
export function toMinutes(dateTime: string): number {
  const timePart = dateTime.split(' ')[1] ?? '00:00'
  const [h = 0, m = 0] = timePart.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export interface ScrollToNowOptions {
  /** The element that scrolls; no-op when null. */
  scroller: HTMLElement | null
  /** Pixel offset of the current-time indicator within the grid, or null when hidden. */
  nowTop: number | null
  /** Event start times in whole minutes, used to anchor the first event. */
  eventStartMinutes: number[]
  /** Hour the grid starts at; day view scrolls within a boundary, week view starts at 0. */
  startHour?: number
  /** Fallback hour scrolled to when no indicator or events exist. Defaults to 8. */
  fallbackHour?: number
  behavior?: ScrollBehavior
}

/**
 * Scrolls the calendar grid to the now-indicator, else the first event,
 * else the fallback hour, keeping 120px of context above the target.
 */
export function scrollToNow({
  scroller,
  nowTop,
  eventStartMinutes,
  startHour = 0,
  fallbackHour = 8,
  behavior = 'smooth',
}: ScrollToNowOptions): void {
  if (!scroller) return
  const hHeight = getHourHeight()
  const firstTop = eventStartMinutes.length
    ? Math.min(...eventStartMinutes.map((m) => (m / 60 - startHour) * hHeight))
    : null
  const target = nowTop ?? firstTop ?? (fallbackHour - startHour) * hHeight
  scroller.scrollTo({ top: Math.max(target - 120, 0), behavior })
}
