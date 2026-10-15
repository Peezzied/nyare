import { describe, it, expect } from 'vitest'
import { formatEntryDate, formatEntryDateLong } from '../noteDate'

describe('formatEntryDate', () => {
  it('formats ISO date as short label', () => {
    expect(formatEntryDate('2026-10-06')).toBe('Oct 6')
  })

  it('returns empty string for missing input', () => {
    expect(formatEntryDate(null)).toBe('')
    expect(formatEntryDate(undefined)).toBe('')
  })

  it('returns raw value for invalid input', () => {
    expect(formatEntryDate('Oct 6')).toBe('Oct 6')
  })
})

describe('formatEntryDateLong', () => {
  it('formats ISO date with long month', () => {
    expect(formatEntryDateLong('2026-09-28')).toBe('September 28')
  })

  it('returns empty string for missing input', () => {
    expect(formatEntryDateLong(null)).toBe('')
    expect(formatEntryDateLong(undefined)).toBe('')
  })

  it('returns raw value for invalid input', () => {
    expect(formatEntryDateLong('Sep 28')).toBe('Sep 28')
  })
})
