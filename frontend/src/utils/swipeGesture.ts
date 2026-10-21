// ponytail: swipe-to-day resolution; 30px in 300ms, vertical yields to scroll.

export const SWIPE_THRESHOLD_PX = 30
export const SWIPE_TIMEOUT_MS = 300

/**
 * Resolves a pointer gesture to a day offset. Left swipe (dx < 0) moves
 * forward to the next day, right swipe moves back, matching the spec
 * acceptance scenarios. Returns 0 for sub-threshold, slow, or
 * vertical-dominant gestures (snap back / native scroll, no date change).
 */
export function resolveSwipe(dx: number, dy: number, durationMs: number): -1 | 0 | 1 {
  if (Math.abs(dy) > Math.abs(dx)) return 0
  if (durationMs > SWIPE_TIMEOUT_MS) return 0
  if (dx <= -SWIPE_THRESHOLD_PX) return 1
  if (dx >= SWIPE_THRESHOLD_PX) return -1
  return 0
}

export const ROW_SWIPE_THRESHOLD_PX = 64

/**
 * Resolves a horizontal drag on a task row. Returns true when the gesture
 * ends leftward past the threshold so the quick-actions sheet opens.
 * Vertical-dominant drags return false so native scrolling wins.
 */
export function resolveRowSwipe(dx: number, dy: number): boolean {
  if (Math.abs(dy) > Math.abs(dx)) return false
  return dx <= -ROW_SWIPE_THRESHOLD_PX
}

/**
 * Resolves a swipe on a floating toast. Returns the fly-out direction
 * (-1 left, 1 right) once the gesture passes the shared row threshold in
 * either direction, or 0 when the toast should snap back. Vertical-dominant
 * drags return 0 so native scrolling wins.
 */
export function resolveDismissSwipe(dx: number, dy: number): -1 | 0 | 1 {
  if (Math.abs(dy) > Math.abs(dx)) return 0
  if (dx <= -ROW_SWIPE_THRESHOLD_PX) return -1
  if (dx >= ROW_SWIPE_THRESHOLD_PX) return 1
  return 0
}
