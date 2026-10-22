const CARET_PAD = 8

/**
 * Returns the scrollTop delta that keeps a caret rect inside a visible band.
 * Positive scrolls down, negative scrolls up. Zero means the caret is already visible.
 */
export function caretScrollDelta(
  caretTop: number,
  caretBottom: number,
  bandTop: number,
  bandBottom: number,
): number {
  if (caretBottom > bandBottom - CARET_PAD) {
    return caretBottom - (bandBottom - CARET_PAD)
  }
  if (caretTop < bandTop + CARET_PAD) {
    return caretTop - bandTop - CARET_PAD
  }
  return 0
}
