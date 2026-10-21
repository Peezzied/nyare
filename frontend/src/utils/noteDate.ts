// ponytail: entry-date display for note cards keeps one formatter.

function parseEntryDate(entryDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(entryDate.trim())
  if (!match) {
    return null
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12))
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Formats card timestamp: time when created within 24 hours, else MMM dd. */
export function formatCardTimestamp(
  entryDate: string | null | undefined,
  createdAt: string | null | undefined,
  now: Date = new Date(),
): string {
  const created = createdAt ? new Date(createdAt) : null
  if (created && !Number.isNaN(created.getTime()) && now.getTime() - created.getTime() < DAY_MS) {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(created)
  }
  return formatEntryDate(entryDate)
}

/** Formats YYYY-MM-DD as MMM dd. Returns raw value for invalid input. */
export function formatEntryDate(entryDate: string | null | undefined): string {
  if (!entryDate || typeof entryDate !== 'string') {
    return ''
  }
  const date = parseEntryDate(entryDate)
  if (!date) {
    return entryDate
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}
