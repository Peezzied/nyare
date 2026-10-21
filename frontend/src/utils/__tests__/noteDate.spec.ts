import { describe, it, expect } from 'vitest'
import { formatCardTimestamp, formatEntryDate } from '../noteDate'

describe('formatEntryDate', () => {
  it('formats ISO date as MMM dd', () => {
    expect(formatEntryDate('2026-10-06')).toBe('Oct 06')
  })

  it('returns empty string for missing input', () => {
    expect(formatEntryDate(null)).toBe('')
    expect(formatEntryDate(undefined)).toBe('')
  })

  it('returns raw value for invalid input', () => {
    expect(formatEntryDate('Oct 06')).toBe('Oct 06')
  })
})

describe('formatCardTimestamp', () => {
  const now = new Date('2026-10-06T15:00:00Z')

  it('shows time when created within 24 hours', () => {
    const expected = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date('2026-10-06T09:30:00Z'))
    expect(formatCardTimestamp('2026-10-06', '2026-10-06T09:30:00Z', now)).toBe(expected)
  })

  it('shows MMM dd when created 24 hours ago or more', () => {
    expect(formatCardTimestamp('2026-10-05', '2026-10-05T14:00:00Z', now)).toBe('Oct 05')
  })

  it('shows MMM dd when createdAt is missing or invalid', () => {
    expect(formatCardTimestamp('2026-10-05', null, now)).toBe('Oct 05')
    expect(formatCardTimestamp('2026-10-05', 'not-a-date', now)).toBe('Oct 05')
  })
})
