// ponytail: deadline list derivation for the calendar's Deadlines mode.

import type { AcademicEventResponse } from '@/types/api'
import { formatDateHeader, formatTime12h } from './scheduleExpander'

export interface DeadlineRow {
  event: AcademicEventResponse
  /** 12-hour deadline time such as `9 AM`; empty when the deadline is date-only. */
  timeLabel: string
  /** `Today`, `Tomorrow`, or `In N days`; empty for past rows. */
  countdownLabel: string
}

export interface DeadlineDaySection {
  /** Local day key `YYYY-MM-DD` shared by every row in the section. */
  dateKey: string
  /** Local Date for the day; day headers tap through to the day view. */
  date: Date
  /** Header label such as `Thu, Oct 22`. */
  label: string
  rows: DeadlineRow[]
}

export interface DeadlineSections {
  /** Deadlines at or after now, grouped by day ascending. */
  upcoming: DeadlineDaySection[]
  /** Deadlines before now, grouped by day descending. */
  past: DeadlineDaySection[]
}

// `2026-10-22T09:00:00`; the time part is optional.
const DEADLINE_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/

interface ParsedDeadline {
  dateKey: string
  date: Date
  at: number
  timeLabel: string
}

function parseDeadline(deadline: string): ParsedDeadline | null {
  const match = DEADLINE_RE.exec(deadline)
  if (!match) return null
  const [, yearStr, monthStr, dayStr, hourStr, minuteStr] = match
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const hour = Number(hourStr ?? '0')
  const minute = Number(minuteStr ?? '0')
  const date = new Date(year, month - 1, day)
  // Reject calendar-invalid parts such as month 13 or day 40.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return {
    dateKey: `${yearStr}-${monthStr}-${dayStr}`,
    date,
    at: new Date(year, month - 1, day, hour, minute).getTime(),
    timeLabel: hourStr ? formatTime12h(`${hourStr}:${minuteStr}`) : '',
  }
}

/** Whole calendar days from `from` to `to`, ignoring the clock time. */
function dayDistance(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime()
  return Math.round((b - a) / 86400000)
}

function countdownLabel(now: Date, date: Date): string {
  const days = dayDistance(now, date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

function toSections(
  items: { event: AcademicEventResponse; parsed: ParsedDeadline }[],
  countdown: (date: Date) => string,
): DeadlineDaySection[] {
  const sections: DeadlineDaySection[] = []
  const byDay = new Map<string, DeadlineDaySection>()
  for (const { event, parsed } of items) {
    let section = byDay.get(parsed.dateKey)
    if (!section) {
      section = {
        dateKey: parsed.dateKey,
        date: parsed.date,
        label: formatDateHeader(parsed.date),
        rows: [],
      }
      byDay.set(parsed.dateKey, section)
      sections.push(section)
    }
    section.rows.push({ event, timeLabel: parsed.timeLabel, countdownLabel: countdown(parsed.date) })
  }
  return sections
}

/**
 * Splits academic events into upcoming and past day sections against `now`.
 * Malformed deadlines are dropped rather than guessed.
 */
export function deriveDeadlineSections(
  events: readonly AcademicEventResponse[],
  now: Date,
): DeadlineSections {
  const parsed = events
    .map((event) => ({ event, parsed: parseDeadline(event.deadline) }))
    .filter((item): item is { event: AcademicEventResponse; parsed: ParsedDeadline } =>
      item.parsed !== null,
    )

  const upcoming = parsed
    .filter((item) => item.parsed.at >= now.getTime())
    .sort((a, b) => a.parsed.at - b.parsed.at || a.event.title.localeCompare(b.event.title))
  const past = parsed
    .filter((item) => item.parsed.at < now.getTime())
    .sort((a, b) => b.parsed.at - a.parsed.at || a.event.title.localeCompare(b.event.title))

  return {
    upcoming: toSections(upcoming, (date) => countdownLabel(now, date)),
    past: toSections(past, () => ''),
  }
}
