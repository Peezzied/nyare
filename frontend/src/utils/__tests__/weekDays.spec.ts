import { describe, it, expect } from 'vitest'
import { isoWeekNumber } from '../weekDays'

describe('isoWeekNumber', () => {
  it('numbers an ordinary mid-year week', () => {
    expect(isoWeekNumber(new Date(2026, 9, 19))).toBe(43) // Mon 2026-10-19
    expect(isoWeekNumber(new Date(2026, 9, 25))).toBe(43) // Sun of the same week
  })

  it('assigns late-December days to the next year when Thursday crosses', () => {
    expect(isoWeekNumber(new Date(2025, 11, 29))).toBe(1) // Mon, week owned by 2026
  })

  it('assigns early-January days to the previous year when Thursday stays back', () => {
    // 2026 starts on a Thursday, so it is a 53-week ISO year; Jan 1 2027 is W53.
    expect(isoWeekNumber(new Date(2027, 0, 1))).toBe(53)
  })
})
