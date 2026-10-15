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

/** Formats YYYY-MM-DD as short date. Returns raw value for invalid input. */
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
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Formats YYYY-MM-DD with long month. Returns raw value for invalid input. */
export function formatEntryDateLong(entryDate: string | null | undefined): string {
  if (!entryDate || typeof entryDate !== 'string') {
    return ''
  }
  const date = parseEntryDate(entryDate)
  if (!date) {
    return entryDate
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}
