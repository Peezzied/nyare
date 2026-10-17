import type { DayOfWeek } from '@/types/api'
import type { TimeBlockDraft } from '@/components/TimeBlockCard.vue'
import { WEEKDAYS } from '@/components/TimeBlockCard.vue'
import type { CoursePaletteColor } from '@/constants/palette'
import { HOUR_HEIGHT } from '@/constants/calendar'

export interface PreviewBlock {
  id: string
  day: DayOfWeek
  title: string
  startTime: string
  endTime: string
  color: string
  blockId: string
}

export interface PendingSlot {
  day: DayOfWeek
  startTime: string
  endTime: string
}

export function timeToMinutes(timeStr: string): number {
  const [h = 0, m = 0] = timeStr.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.min(24 * 60, Math.max(0, minutes))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function dayFromOffsetX(offsetX: number, gridWidth: number): DayOfWeek {
  if (gridWidth <= 0) return 'SUNDAY'
  const colWidth = gridWidth / 7
  const dayIndex = Math.min(6, Math.max(0, Math.floor(offsetX / colWidth)))
  return WEEKDAYS[dayIndex]?.value ?? 'SUNDAY'
}

export function minutesFromOffsetY(offsetY: number, stepMinutes = 15): number {
  const rawMinutes = (offsetY / HOUR_HEIGHT) * 60
  const snapped = Math.floor(rawMinutes / stepMinutes) * stepMinutes
  return Math.min(24 * 60, Math.max(0, snapped))
}

export function derivePreviewBlocks(
  blocks: TimeBlockDraft[],
  name: string,
  color: CoursePaletteColor,
): PreviewBlock[] {
  const trimmedTitle = name.trim()
  const result: PreviewBlock[] = []

  for (const block of blocks) {
    if (!block.selectedDays || block.selectedDays.length === 0) {
      continue
    }

    if (!block.startTime || !block.endTime || block.startTime >= block.endTime) {
      continue
    }

    for (const day of block.selectedDays) {
      result.push({
        id: `${block.id}-${day}`,
        day,
        title: trimmedTitle,
        startTime: block.startTime,
        endTime: block.endTime,
        color: color.solid,
        blockId: block.id,
      })
    }
  }

  return result
}

export function slotFromOffset(
  offsetX: number,
  offsetY: number,
  gridWidth: number,
  durationMinutes = 60,
): PendingSlot | null {
  if (gridWidth <= 0) {
    return null
  }

  const maxGridHeight = 24 * HOUR_HEIGHT
  if (offsetX < 0 || offsetX >= gridWidth || offsetY < 0 || offsetY >= maxGridHeight) {
    return null
  }

  const day = dayFromOffsetX(offsetX, gridWidth)
  const startMinutes = Math.min(24 * 60 - 15, minutesFromOffsetY(offsetY, 15))
  const endMinutes = Math.min(24 * 60, startMinutes + durationMinutes)

  return {
    day,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
  }
}

export function slotFrom2DDrag(
  startOffsetY: number,
  currentOffsetY: number,
  currentOffsetX: number,
  gridWidth: number,
): PendingSlot {
  const day = dayFromOffsetX(currentOffsetX, gridWidth)
  const topY = Math.min(startOffsetY, currentOffsetY)
  const bottomY = Math.max(startOffsetY, currentOffsetY)

  const startMinutes = minutesFromOffsetY(topY, 15)
  const rawBottomMinutes = (bottomY / HOUR_HEIGHT) * 60
  let endMinutes = Math.min(24 * 60, Math.ceil(rawBottomMinutes / 15) * 15)

  if (endMinutes <= startMinutes) {
    endMinutes = Math.min(24 * 60, startMinutes + 15)
  }

  return {
    day,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
  }
}

export function moveSlot2D(
  slot: PendingSlot,
  currentOffsetX: number,
  currentOffsetY: number,
  initialClickOffsetMinutes: number,
  gridWidth: number,
): PendingSlot {
  const day = dayFromOffsetX(currentOffsetX, gridWidth)
  const duration = timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime)

  const rawMinutes = (currentOffsetY / HOUR_HEIGHT) * 60
  let newStart = Math.floor((rawMinutes - initialClickOffsetMinutes) / 15) * 15
  newStart = Math.max(0, Math.min(24 * 60 - duration, newStart))
  const newEnd = newStart + duration

  return {
    day,
    startTime: minutesToTime(newStart),
    endTime: minutesToTime(newEnd),
  }
}

export function resizeSlotHandle(
  slot: PendingSlot,
  handle: 'top' | 'bottom',
  currentOffsetY: number,
): PendingSlot {
  const currentStart = timeToMinutes(slot.startTime)
  const currentEnd = timeToMinutes(slot.endTime)
  const rawMinutes = (currentOffsetY / HOUR_HEIGHT) * 60

  if (handle === 'top') {
    const snappedStart = Math.floor(rawMinutes / 15) * 15
    const newStart = Math.max(0, Math.min(currentEnd - 15, snappedStart))
    return {
      ...slot,
      startTime: minutesToTime(newStart),
    }
  } else {
    const snappedEnd = Math.ceil(rawMinutes / 15) * 15
    const newEnd = Math.min(24 * 60, Math.max(currentStart + 15, snappedEnd))
    return {
      ...slot,
      endTime: minutesToTime(newEnd),
    }
  }
}
