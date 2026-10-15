import { describe, it, expect } from 'vitest'
import { toDateKey, addDays, isSameDay } from '../dayKey'

describe('toDateKey', () => {
  it('formats local parts as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 9, 14))).toBe('2026-10-14')
  })

  it('pads single-digit month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('does not shift the day through UTC conversion', () => {
    // Local parts decide the key in every timezone; toISOString would differ.
    expect(toDateKey(new Date(2026, 9, 14, 23, 30, 0))).toBe('2026-10-14')
    expect(toDateKey(new Date(2026, 9, 14, 0, 30, 0))).toBe('2026-10-14')
  })
})

describe('addDays', () => {
  it('shifts forward by one day', () => {
    expect(toDateKey(addDays(new Date(2026, 9, 14), 1))).toBe('2026-10-15')
  })

  it('shifts backward and across a month boundary', () => {
    expect(toDateKey(addDays(new Date(2026, 9, 31), 1))).toBe('2026-11-01')
    expect(toDateKey(addDays(new Date(2026, 9, 14), -1))).toBe('2026-10-13')
  })

  it('returns a new Date and leaves the original unchanged', () => {
    const original = new Date(2026, 9, 14, 12, 0, 0)
    const shifted = addDays(original, 1)
    expect(shifted).not.toBe(original)
    expect(original.getDate()).toBe(14)
  })
})

describe('isSameDay', () => {
  it('returns true for the same local day', () => {
    expect(isSameDay(new Date(2026, 9, 14, 8, 0, 0), new Date(2026, 9, 14, 20, 0, 0))).toBe(true)
  })

  it('returns false for different days', () => {
    expect(isSameDay(new Date(2026, 9, 14), new Date(2026, 9, 15))).toBe(false)
  })
})
