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

/** The four course color themes used by the day and week calendar blocks. */
export type ClassTheme = 'green' | 'blue' | 'purple' | 'orange'

const CLASS_THEME_ORDER: readonly ClassTheme[] = ['green', 'blue', 'purple', 'orange']

/**
 * Maps a course to its calendar color theme. Uses the same `courseId - 1` modulo
 * derivation as scheduleExpander and the untimed pills, so a course keeps one
 * color on every surface.
 */
export function classThemeForCourse(courseId: number): ClassTheme {
  return CLASS_THEME_ORDER[Math.abs(courseId - 1) % CLASS_THEME_ORDER.length] ?? 'blue'
}

/**
 * Tailwind classes for each theme. A class block reads as a pastel timetable
 * layer with dark tinted ink; a rigid academic event reads as a saturated fill
 * with white ink (DESIGN.md §6).
 */
export interface ClassThemeStyles {
  /** Pastel fill for recurring class meetings. */
  readonly fill: string
  /** Dark tinted text and icon color on the pastel fill. */
  readonly ink: string
  /** Stroke edge on the pastel fill, drawn in the ink color. */
  readonly edge: string
  /** Saturated fill for academic events; pairs with white ink. */
  readonly solid: string
  /** Darker edge of the same hue for the saturated fill. */
  readonly solidEdge: string
}

export const CLASS_THEME_STYLES: Record<ClassTheme, ClassThemeStyles> = {
  green: {
    fill: 'bg-[#7CE19D]',
    ink: 'text-[#1E3A2F]',
    edge: 'border-[#1E3A2F]',
    solid: 'bg-[#0B8043]',
    solidEdge: 'border-[#0D652D]',
  },
  blue: {
    fill: 'bg-[#80C2F8]',
    ink: 'text-[#1E293B]',
    edge: 'border-[#1E293B]',
    solid: 'bg-[#0277BD]',
    solidEdge: 'border-[#01579B]',
  },
  purple: {
    fill: 'bg-[#C084FC]',
    ink: 'text-[#3B0764]',
    edge: 'border-[#3B0764]',
    solid: 'bg-[#8E24AA]',
    solidEdge: 'border-[#6A1B9A]',
  },
  orange: {
    fill: 'bg-[#FB923C]',
    ink: 'text-[#7C2D12]',
    edge: 'border-[#7C2D12]',
    solid: 'bg-[#E65100]',
    solidEdge: 'border-[#BF360C]',
  },
}
