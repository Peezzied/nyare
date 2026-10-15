// ponytail: ISO-8601 duration parsing and formatting for academic task durations.

/**
 * Parses an ISO-8601 duration string into total minutes.
 * Examples: 'PT1H30M' -> 90, 'PT45M' -> 45, 'PT2H' -> 120, 'P1DT2H' -> 1560.
 */
export function durationToMinutes(iso: string | null | undefined): number | null {
  if (!iso || typeof iso !== 'string') {
    return null
  }

  const trimmed = iso.trim()
  if (!trimmed) {
    return null
  }

  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(trimmed)
  if (!match) {
    return null
  }

  const [, daysStr, hoursStr, minsStr, secsStr] = match
  // The regex also matches a bare 'P' or 'PT'. Reject them because they hold no value.
  if (!daysStr && !hoursStr && !minsStr && !secsStr) {
    return null
  }

  const days = daysStr ? parseInt(daysStr, 10) : 0
  const hours = hoursStr ? parseInt(hoursStr, 10) : 0
  const minutes = minsStr ? parseInt(minsStr, 10) : 0
  const seconds = secsStr ? parseFloat(secsStr) : 0

  return days * 1440 + hours * 60 + minutes + Math.round(seconds / 60)
}

/**
 * Formats a duration in minutes to an ISO-8601 duration string.
 * Examples: 90 -> 'PT1H30M', 45 -> 'PT45M', 120 -> 'PT2H', 0 -> 'PT0M'.
 */
export function minutesToDuration(mins: number | null | undefined): string | null {
  if (
    mins === null ||
    mins === undefined ||
    typeof mins !== 'number' ||
    Number.isNaN(mins) ||
    mins < 0
  ) {
    return null
  }

  const totalMinutes = Math.round(mins)
  // Hours do not fold into days, so 1560 formats as 'PT26H'.
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours > 0 && remainingMinutes > 0) {
    return `PT${hours}H${remainingMinutes}M`
  }

  if (hours > 0 && remainingMinutes === 0) {
    return `PT${hours}H`
  }

  if (hours === 0 && remainingMinutes > 0) {
    return `PT${remainingMinutes}M`
  }

  return 'PT0M'
}
