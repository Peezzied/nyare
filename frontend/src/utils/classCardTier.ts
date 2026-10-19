// Type scale for the day-view class card. A card is as tall as its class, so the
// scale must follow the duration. See .specify/bugs/class-card-text-fit.

export type ClassCardTierName = 'xs' | 'sm' | 'md' | 'lg'

export interface ClassCardTier {
  readonly name: ClassCardTierName
  /** Padding and border width for the card root. */
  readonly card: string
  /** Type scale and clamp for the title. */
  readonly title: string
  /** Type scale, gap and clamp for the time + description line. */
  readonly description: string
}

const TIER_XS: ClassCardTier = {
  name: 'xs',
  card: 'p-1 border-[1px]',
  title: 'text-[11px] leading-tight line-clamp-1',
  description: 'mt-0.5 text-[11px] leading-3 line-clamp-1',
}

const TIER_SM: ClassCardTier = {
  name: 'sm',
  card: 'p-2 border-[2px]',
  title: 'text-sm leading-tight line-clamp-2',
  description: 'mt-0.5 text-xs leading-4 line-clamp-1',
}

const TIER_MD: ClassCardTier = {
  name: 'md',
  card: 'p-2 border-[2px]',
  title: 'text-base leading-tight line-clamp-2',
  description: 'mt-0.5 text-xs leading-4 line-clamp-2',
}

const TIER_LG: ClassCardTier = {
  name: 'lg',
  card: 'p-4 border-[2.5px]',
  title: 'text-xl leading-tight line-clamp-2',
  description: 'mt-1 text-sm line-clamp-2',
}

const XS_BELOW_MINUTES = 60
const SM_BELOW_MINUTES = 75
const MD_BELOW_MINUTES = 120

/**
 * Selects the type tier for a class card.
 * @param durationMinutes Class length in minutes.
 * @returns The tier for that length. Treats 0, negative and non-finite input as the smallest tier.
 */
export function getClassCardTier(durationMinutes: number): ClassCardTier {
  const minutes = Number.isFinite(durationMinutes) ? Math.max(durationMinutes, 0) : 0

  if (minutes < XS_BELOW_MINUTES) {
    return TIER_XS
  }
  if (minutes < SM_BELOW_MINUTES) {
    return TIER_SM
  }
  if (minutes < MD_BELOW_MINUTES) {
    return TIER_MD
  }
  return TIER_LG
}

function minutesOfDay(time: string): number {
  const parts = time.split(':')
  return Number.parseInt(parts[0] ?? '', 10) * 60 + Number.parseInt(parts[1] ?? '', 10)
}

/**
 * Measures the length of a class from its `HH:mm` end points.
 * @param startTime Class start as `HH:mm`.
 * @param endTime Class end as `HH:mm`.
 * @returns The length in minutes. Returns 0 when either time is unreadable or the end is not after the start.
 */
export function classDurationMinutes(startTime: string, endTime: string): number {
  const start = minutesOfDay(startTime)
  const end = minutesOfDay(endTime)

  return end > start ? end - start : 0
}
