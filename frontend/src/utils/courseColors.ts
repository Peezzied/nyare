// ponytail: 24-color course palette utility with deterministic index resolver.

/** Tailwind arbitrary-value classes for a course badge. */
export interface CourseBadgeClasses {
  readonly bg: string
  readonly text: string
  readonly border: string
}

/** Inline CSS colors for a course badge. */
export interface CourseBadgeStyle {
  readonly backgroundColor: string
  readonly color: string
  readonly borderColor: string
}

/** Inline CSS color for a solid course marker dot. */
export interface CourseDotStyle {
  readonly backgroundColor: string
}

/** One course palette entry with hex colors, alias fields, and prebuilt Tailwind classes. */
export interface CourseColorDef {
  /** Position in `COURSE_COLORS` (0-23). */
  readonly index: number
  readonly name: string
  /** Full-strength hex color for marker dots. */
  readonly solid: string
  /** Alias of `solid`. */
  readonly solidMarker: string
  readonly badgeBg: string
  /** Alias of `badgeBg`. */
  readonly badgeBackground: string
  readonly badgeText: string
  readonly badgeBorder: string
  /** Alias of `badgeBg`. */
  readonly bg: string
  /** Alias of `badgeText`. */
  readonly text: string
  /** Alias of `badgeBorder`. */
  readonly border: string
  readonly badgeClasses: CourseBadgeClasses
  /** `badgeClasses` joined into one space-separated string. */
  readonly badgeClassString: string
  /** Tailwind background class for the `solid` color. */
  readonly dotClass: string
}

/** Builds a palette entry with alias fields and Tailwind classes from four hex colors. */
function defineColor(
  index: number,
  name: string,
  solid: string,
  badgeBg: string,
  badgeText: string,
  badgeBorder: string,
): CourseColorDef {
  return {
    index,
    name,
    solid,
    solidMarker: solid,
    badgeBg,
    badgeBackground: badgeBg,
    badgeText,
    badgeBorder,
    bg: badgeBg,
    text: badgeText,
    border: badgeBorder,
    badgeClasses: {
      bg: `bg-[${badgeBg}]`,
      text: `text-[${badgeText}]`,
      border: `border-[${badgeBorder}]`,
    },
    badgeClassString: `bg-[${badgeBg}] text-[${badgeText}] border-[${badgeBorder}]`,
    dotClass: `bg-[${solid}]`,
  }
}

/**
 * 24-color course palette per Section 4 of DESIGN.md (Google Calendar parity).
 */
export const COURSE_COLORS: readonly CourseColorDef[] = [
  defineColor(0, 'Tomato', '#D50000', '#FFEBEE', '#B71C1C', '#EF9A9A'),
  defineColor(1, 'Flamingo', '#E67C73', '#FDEAE8', '#C53929', '#F5B0AA'),
  defineColor(2, 'Radicchio', '#AD1457', '#FCE4EC', '#880E4F', '#F48FB1'),
  defineColor(3, 'Cherry Blossom', '#D81B60', '#FCE4EC', '#AD1457', '#F48FB1'),
  defineColor(4, 'Tangerine', '#F4511E', '#FBE9E7', '#BF360C', '#FFAB91'),
  defineColor(5, 'Pumpkin', '#EF6C00', '#FFF3E0', '#E65100', '#FFCC80'),
  defineColor(6, 'Mango', '#F57C00', '#FFF3E0', '#EF6C00', '#FFE0B2'),
  defineColor(7, 'Banana', '#F6BF26', '#FEF9E7', '#B78103', '#FCE793'),
  defineColor(8, 'Lemon', '#FBC02D', '#FFFDE7', '#F57F17', '#FFF59D'),
  defineColor(9, 'Citron', '#AFB42B', '#F9FBE7', '#827717', '#E6EE9C'),
  defineColor(10, 'Basil', '#0B8043', '#E6F4EA', '#0D652D', '#A8DAB5'),
  defineColor(11, 'Sage', '#33B679', '#E8F8F0', '#1E8E5A', '#A2E2BF'),
  defineColor(12, 'Avocado', '#689F38', '#F1F8E9', '#33691E', '#C5E1A5'),
  defineColor(13, 'Pistachio', '#7CB342', '#F1F8E9', '#558B2F', '#DCEDC8'),
  defineColor(14, 'Eucalyptus', '#00897B', '#E0F2F1', '#004D40', '#80CBC4'),
  defineColor(15, 'Peacock', '#039BE5', '#E1F5FE', '#0277BD', '#81D4FA'),
  defineColor(16, 'Sky', '#29B6F6', '#E1F5FE', '#0288D1', '#B3E5FC'),
  defineColor(17, 'Blueberry', '#3F51B5', '#E8EAF6', '#283593', '#9FA8DA'),
  defineColor(18, 'Cobalt', '#1E88E5', '#E3F2FD', '#1565C0', '#90CAF9'),
  defineColor(19, 'Grape', '#8E24AA', '#F3E5F5', '#6A1B9A', '#CE93D8'),
  defineColor(20, 'Amethyst', '#9C27B0', '#F3E5F5', '#7B1FA2', '#BA68C8'),
  defineColor(21, 'Lavender', '#7986CB', '#E8EAF6', '#3949AB', '#C5CAE9'),
  defineColor(22, 'Wisteria', '#B39DDB', '#EDE7F6', '#512DA8', '#D1C4E9'),
  defineColor(23, 'Graphite', '#616161', '#EEEEEE', '#212121', '#BDBDBD'),
] as const

/**
 * Fallback color for unassigned or missing course identifiers.
 * Uses Graphite (index 23, neutral gray).
 */
export const DEFAULT_COURSE_COLOR: CourseColorDef = COURSE_COLORS[23]!
/** Alias of `DEFAULT_COURSE_COLOR`. */
export const FALLBACK_COURSE_COLOR: CourseColorDef = DEFAULT_COURSE_COLOR

/**
 * Alias for backward compatibility.
 */
export const COURSE_PALETTE_24 = COURSE_COLORS

/**
 * Resolves the deterministic palette index (0-23) for a course identifier.
 */
export function getCourseColorIndex(courseId: number | undefined | null): number {
  if (courseId === null || courseId === undefined || !Number.isFinite(courseId)) {
    return DEFAULT_COURSE_COLOR.index
  }
  return Math.abs(Math.floor(courseId)) % COURSE_COLORS.length
}

/**
 * Returns the color definition for a course identifier.
 * Uses course.id % 24 to select a deterministic palette color.
 * Returns the fallback Graphite color when courseId is null, undefined, or non-finite.
 */
export function getCourseColor(courseId: number | undefined | null): CourseColorDef {
  if (courseId === null || courseId === undefined || !Number.isFinite(courseId)) {
    return DEFAULT_COURSE_COLOR
  }
  const index = getCourseColorIndex(courseId)
  return COURSE_COLORS[index] ?? DEFAULT_COURSE_COLOR
}

/**
 * Returns Tailwind class names for badge background, text, and border.
 */
export function getCourseBadgeClasses(
  courseIdOrColor: number | CourseColorDef | undefined | null,
): CourseBadgeClasses {
  const color =
    typeof courseIdOrColor === 'object' && courseIdOrColor !== null
      ? courseIdOrColor
      : getCourseColor(courseIdOrColor)
  return color.badgeClasses
}

/**
 * Returns combined Tailwind class string for badge rendering.
 */
export function getCourseBadgeClassString(
  courseIdOrColor: number | CourseColorDef | undefined | null,
): string {
  const color =
    typeof courseIdOrColor === 'object' && courseIdOrColor !== null
      ? courseIdOrColor
      : getCourseColor(courseIdOrColor)
  return color.badgeClassString
}

/**
 * Returns inline CSS style object for badge rendering.
 */
export function getCourseBadgeStyle(
  courseIdOrColor: number | CourseColorDef | undefined | null,
): CourseBadgeStyle {
  const color =
    typeof courseIdOrColor === 'object' && courseIdOrColor !== null
      ? courseIdOrColor
      : getCourseColor(courseIdOrColor)
  return {
    backgroundColor: color.badgeBg,
    color: color.badgeText,
    borderColor: color.badgeBorder,
  }
}

/**
 * Returns Tailwind background class for solid color marker dots.
 */
export function getCourseDotClass(
  courseIdOrColor: number | CourseColorDef | undefined | null,
): string {
  const color =
    typeof courseIdOrColor === 'object' && courseIdOrColor !== null
      ? courseIdOrColor
      : getCourseColor(courseIdOrColor)
  return color.dotClass
}

/**
 * Returns inline CSS style object for solid color marker dots.
 */
export function getCourseDotStyle(
  courseIdOrColor: number | CourseColorDef | undefined | null,
): CourseDotStyle {
  const color =
    typeof courseIdOrColor === 'object' && courseIdOrColor !== null
      ? courseIdOrColor
      : getCourseColor(courseIdOrColor)
  return {
    backgroundColor: color.solid,
  }
}
