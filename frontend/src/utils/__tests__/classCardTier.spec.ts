import { describe, it, expect } from 'vitest'
import { classDurationMinutes, getClassCardTier } from '../classCardTier'

const HOUR_HEIGHT_PX = 80
const MIN_FONT_SIZE_PX = 11

const PADDING_PX: Record<string, number> = {
  'p-1': 4,
  'py-1': 4,
  'p-1.5': 6,
  'p-2': 8,
  'p-3': 12,
  'p-4': 16,
}
const BORDER_PX: Record<string, number> = {
  'border-[1px]': 1,
  'border-[2px]': 2,
  'border-[2.5px]': 2.5,
}
const FONT_SIZE_PX: Record<string, number> = {
  'text-[11px]': 11,
  'text-[13px]': 13,
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-xl': 20,
}
const LEADING_PX: Record<string, number> = {
  'leading-3': 12,
  'leading-4': 16,
  'leading-[13px]': 13,
  'leading-[14px]': 14,
  'leading-[16px]': 16,
  'leading-[18px]': 18,
}
const GAP_PX: Record<string, number> = { 'mt-px': 1, 'mt-0.5': 2, 'mt-1': 4, 'mt-1.5': 6 }
const CLAMP_LINES: Record<string, number> = { 'line-clamp-1': 1, 'line-clamp-2': 2 }

function pick(classes: string[], map: Record<string, number>, fallback: number): number {
  const hit = classes.find((token) => map[token] !== undefined)
  return hit === undefined ? fallback : (map[hit] ?? fallback)
}

function lineHeightPx(classes: string[], fontSize: number): number {
  if (classes.includes('leading-tight')) {
    return fontSize * 1.25
  }
  // Tailwind ships its own line height with text-xs (16px) and text-sm (20px).
  return pick(classes, LEADING_PX, fontSize * 1.5)
}

describe('getClassCardTier', () => {
  it('gives short classes the compact tier', () => {
    expect(getClassCardTier(30).name).toBe('xs')
    expect(getClassCardTier(45).name).toBe('xs')
  })

  it('gives an hour to the small tier', () => {
    expect(getClassCardTier(60).name).toBe('sm')
  })

  it('gives 75 and 90 minutes to the medium tier', () => {
    expect(getClassCardTier(75).name).toBe('md')
    expect(getClassCardTier(90).name).toBe('md')
  })

  it('gives two hours and more to the large tier', () => {
    expect(getClassCardTier(120).name).toBe('lg')
    expect(getClassCardTier(180).name).toBe('lg')
  })

  it('switches tier exactly on each boundary', () => {
    expect(getClassCardTier(59).name).toBe('xs')
    expect(getClassCardTier(60).name).toBe('sm')
    expect(getClassCardTier(74).name).toBe('sm')
    expect(getClassCardTier(75).name).toBe('md')
    expect(getClassCardTier(119).name).toBe('md')
    expect(getClassCardTier(120).name).toBe('lg')
  })

  it('treats unmeasurable lengths as the smallest tier', () => {
    expect(getClassCardTier(0).name).toBe('xs')
    expect(getClassCardTier(-30).name).toBe('xs')
    expect(getClassCardTier(Number.NaN).name).toBe('xs')
    expect(getClassCardTier(Number.POSITIVE_INFINITY).name).toBe('xs')
  })

  it('keeps the title and the time inside the shortest card of each tier', () => {
    for (const minutes of [30, 60, 75, 120]) {
      const tier = getClassCardTier(minutes)
      const card = tier.card.split(' ')
      const title = tier.title.split(' ')
      const description = tier.description.split(' ')

      const cardHeightPx = (minutes / 60) * HOUR_HEIGHT_PX
      const chromePx = 2 * pick(card, PADDING_PX, 0) + 2 * pick(card, BORDER_PX, 0)
      const interiorPx = cardHeightPx - chromePx

      const titleFontSize = pick(title, FONT_SIZE_PX, 0)
      const descriptionFontSize = pick(description, FONT_SIZE_PX, 0)
      const contentPx =
        lineHeightPx(title, titleFontSize) * pick(title, CLAMP_LINES, 1) +
        pick(description, GAP_PX, 0) +
        lineHeightPx(description, descriptionFontSize) * pick(description, CLAMP_LINES, 1)

      expect(contentPx).toBeLessThanOrEqual(interiorPx)
    }
  })

  it('never sets a font smaller than 11px', () => {
    for (const minutes of [30, 45, 60, 75, 90, 120, 240]) {
      const tier = getClassCardTier(minutes)
      for (const classes of [tier.title, tier.description]) {
        const fontSize = pick(classes.split(' '), FONT_SIZE_PX, 0)
        expect(fontSize).toBeGreaterThanOrEqual(MIN_FONT_SIZE_PX)
      }
    }
  })

  it('clamps the title and the description on every tier', () => {
    for (const minutes of [30, 45, 60, 75, 90, 120, 240]) {
      const tier = getClassCardTier(minutes)
      expect(pick(tier.title.split(' '), CLAMP_LINES, 0)).toBeGreaterThan(0)
      expect(pick(tier.description.split(' '), CLAMP_LINES, 0)).toBeGreaterThan(0)
    }
  })
})

describe('classDurationMinutes', () => {
  it('measures the length between two times', () => {
    expect(classDurationMinutes('09:00', '09:30')).toBe(30)
    expect(classDurationMinutes('09:00', '10:30')).toBe(90)
    expect(classDurationMinutes('13:00', '15:00')).toBe(120)
  })

  it('returns zero for an unreadable or reversed range', () => {
    expect(classDurationMinutes('', '')).toBe(0)
    expect(classDurationMinutes('10:30', '09:00')).toBe(0)
    expect(classDurationMinutes('09:00', '09:00')).toBe(0)
  })
})
