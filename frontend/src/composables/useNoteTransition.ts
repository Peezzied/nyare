import type { TapOriginRect } from '@/types/notesTransition'

export const EXPAND_DURATION_MS = 320
export const COLLAPSE_DURATION_MS = 240
export const CONTENT_DELAY_MS = 100
export const CONTROLS_DELAY_MS = 180
export const REDUCED_MOTION_DURATION_MS = 150

export function isReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Full-viewport target geometry for the expanded container. */
export function calculateTargetStyle(): Record<string, string> {
  const w = typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth : 390
  const viewportH = typeof window !== 'undefined' ? window.visualViewport?.height : undefined
  const innerH = typeof window !== 'undefined' ? window.innerHeight : 0
  const h = viewportH && viewportH > 0 ? viewportH : innerH > 0 ? innerH : 844
  return {
    top: '0px',
    left: '0px',
    width: `${w}px`,
    height: `${h}px`,
    borderRadius: '0px',
  }
}

/** Pixel geometry matching the tapped element, or the target when origin is unknown. */
export function getOriginStyle(origin: TapOriginRect | null): Record<string, string> {
  if (!origin) {
    return calculateTargetStyle()
  }
  return {
    top: `${origin.top}px`,
    left: `${origin.left}px`,
    width: `${origin.width}px`,
    height: `${origin.height}px`,
    borderRadius: origin.borderRadius,
  }
}

/** Captures an element's viewport rect and computed corner radius. */
export function toTapOriginRect(el: Element): TapOriginRect {
  const rect = el.getBoundingClientRect()
  const borderRadius = getComputedStyle(el).borderRadius || '16px'
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    borderRadius,
  }
}
