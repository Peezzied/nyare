import { describe, expect, it } from 'vitest'
import type { AcademicEventResponse } from '@/types/api'
import { deriveDeadlineSections } from '../deadlineSections'

function makeEvent(
  overrides: Partial<AcademicEventResponse> & { id: string },
): AcademicEventResponse {
  return {
    courseId: 4,
    title: 'Sample event',
    deadline: '2026-10-14',
    createdAt: '2026-10-13T08:00:00',
    ...overrides,
  }
}

// Wednesday, October 21 2026 at 10:00 local time.
const NOW = new Date(2026, 9, 21, 10, 0, 0)

describe('deriveDeadlineSections', () => {
  it('splits events into upcoming and past against now', () => {
    const events = [
      makeEvent({ id: 'past', deadline: '2026-10-20T09:00:00' }),
      makeEvent({ id: 'now', deadline: '2026-10-21T10:00:00' }),
      makeEvent({ id: 'future', deadline: '2026-10-25T09:00:00' }),
    ]
    const sections = deriveDeadlineSections(events, NOW)
    expect(sections.upcoming.flatMap((s) => s.rows.map((r) => r.event.id))).toEqual([
      'now',
      'future',
    ])
    expect(sections.past.flatMap((s) => s.rows.map((r) => r.event.id))).toEqual(['past'])
  })

  it('orders upcoming days ascending and past days descending', () => {
    const events = [
      makeEvent({ id: 'up2', deadline: '2026-10-25T09:00:00' }),
      makeEvent({ id: 'up1', deadline: '2026-10-22T09:00:00' }),
      makeEvent({ id: 'pa2', deadline: '2026-10-19T09:00:00' }),
      makeEvent({ id: 'pa1', deadline: '2026-10-20T09:00:00' }),
    ]
    const sections = deriveDeadlineSections(events, NOW)
    expect(sections.upcoming.map((s) => s.dateKey)).toEqual(['2026-10-22', '2026-10-25'])
    expect(sections.past.map((s) => s.dateKey)).toEqual(['2026-10-20', '2026-10-19'])
  })

  it('groups same-day deadlines into one section', () => {
    const events = [
      makeEvent({ id: 'b', deadline: '2026-10-22T18:00:00' }),
      makeEvent({ id: 'a', deadline: '2026-10-22T09:00:00' }),
    ]
    const sections = deriveDeadlineSections(events, NOW)
    expect(sections.upcoming).toHaveLength(1)
    expect(sections.upcoming[0]?.rows.map((r) => r.event.id)).toEqual(['a', 'b'])
  })

  it('labels countdowns by calendar day distance', () => {
    const events = [
      makeEvent({ id: 'today', deadline: '2026-10-21T18:00:00' }),
      makeEvent({ id: 'tomorrow', deadline: '2026-10-22T09:00:00' }),
      makeEvent({ id: 'later', deadline: '2026-10-25T09:00:00' }),
    ]
    const rows = deriveDeadlineSections(events, NOW).upcoming.flatMap((s) => s.rows)
    expect(rows.map((r) => r.countdownLabel)).toEqual(['Today', 'Tomorrow', 'In 4 days'])
  })

  it('formats the deadline time in 12-hour style', () => {
    const events = [makeEvent({ id: 'a', deadline: '2026-10-22T14:30:00' })]
    const row = deriveDeadlineSections(events, NOW).upcoming[0]?.rows[0]
    expect(row?.timeLabel).toBe('2:30 PM')
  })

  it('labels day sections like the calendar header', () => {
    const events = [makeEvent({ id: 'a', deadline: '2026-10-22T09:00:00' })]
    expect(deriveDeadlineSections(events, NOW).upcoming[0]?.label).toBe('Thu, Oct 22')
  })

  it('leaves the countdown empty on past rows', () => {
    const events = [makeEvent({ id: 'a', deadline: '2026-10-20T09:00:00' })]
    expect(deriveDeadlineSections(events, NOW).past[0]?.rows[0]?.countdownLabel).toBe('')
  })

  it('drops malformed deadlines', () => {
    const events = [
      makeEvent({ id: 'bad', deadline: 'not-a-date' }),
      makeEvent({ id: 'invalid', deadline: '2026-13-40T09:00:00' }),
      makeEvent({ id: 'good', deadline: '2026-10-22T09:00:00' }),
    ]
    const sections = deriveDeadlineSections(events, NOW)
    expect(sections.upcoming.flatMap((s) => s.rows.map((r) => r.event.id))).toEqual(['good'])
  })

  it('returns empty sections for an empty list', () => {
    const sections = deriveDeadlineSections([], NOW)
    expect(sections.upcoming).toEqual([])
    expect(sections.past).toEqual([])
  })
})
