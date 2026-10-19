import { describe, it, expect } from 'vitest'
import type { TimeBlockDraft } from '@/components/TimeBlockCard.vue'
import type { CoursePaletteColor } from '@/constants/palette'
import {
  derivePreviewBlocks,
  slotFromOffset,
  timeToMinutes,
  minutesToTime,
  dayFromOffsetX,
  minutesFromOffsetY,
} from '@/utils/weekPreview'

const sampleColor: CoursePaletteColor = {
  id: 'tomato',
  name: 'Tomato',
  solid: '#D50000',
  bg: '#FFEBEE',
  text: '#B71C1C',
  border: '#EF9A9A',
}

describe('derivePreviewBlocks', () => {
  it('yields two preview blocks for one draft with Monday and Wednesday', () => {
    const draft: TimeBlockDraft = {
      id: 'block-1',
      selectedDays: ['MONDAY', 'WEDNESDAY'],
      startTime: '09:00',
      endTime: '10:00',
      room: 'Room 101',
      state: 'draft',
      schedules: [],
      error: '',
    }

    const result = derivePreviewBlocks([draft], 'CS 101', sampleColor)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'block-1-MONDAY',
      day: 'MONDAY',
      title: 'CS 101',
      startTime: '09:00',
      endTime: '10:00',
      color: '#D50000',
      blockId: 'block-1',
    })
    expect(result[1]).toEqual({
      id: 'block-1-WEDNESDAY',
      day: 'WEDNESDAY',
      title: 'CS 101',
      startTime: '09:00',
      endTime: '10:00',
      color: '#D50000',
      blockId: 'block-1',
    })
  })

  it('yields no preview block when a block has no selected weekday', () => {
    const draft: TimeBlockDraft = {
      id: 'block-1',
      selectedDays: [],
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }

    const result = derivePreviewBlocks([draft], 'CS 101', sampleColor)
    expect(result).toEqual([])
  })

  it('yields no preview block when start or end time is empty, or start is not before end', () => {
    const emptyStart: TimeBlockDraft = {
      id: 'block-1',
      selectedDays: ['MONDAY'],
      startTime: '',
      endTime: '10:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }
    const emptyEnd: TimeBlockDraft = {
      id: 'block-2',
      selectedDays: ['MONDAY'],
      startTime: '09:00',
      endTime: '',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }
    const invertedTime: TimeBlockDraft = {
      id: 'block-3',
      selectedDays: ['MONDAY'],
      startTime: '10:00',
      endTime: '09:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }
    const equalTime: TimeBlockDraft = {
      id: 'block-4',
      selectedDays: ['MONDAY'],
      startTime: '09:00',
      endTime: '09:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }

    expect(
      derivePreviewBlocks([emptyStart, emptyEnd, invertedTime, equalTime], 'CS 101', sampleColor),
    ).toEqual([])
  })

  it('yields a block with an empty title when the name is empty or whitespace-only', () => {
    const draft: TimeBlockDraft = {
      id: 'block-1',
      selectedDays: ['MONDAY'],
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }

    const emptyResult = derivePreviewBlocks([draft], '', sampleColor)
    expect(emptyResult[0]?.title).toBe('')

    const wsResult = derivePreviewBlocks([draft], '   ', sampleColor)
    expect(wsResult[0]?.title).toBe('')
  })

  it('trims whitespace from course name', () => {
    const draft: TimeBlockDraft = {
      id: 'block-1',
      selectedDays: ['MONDAY'],
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }

    const result = derivePreviewBlocks([draft], '  CS 101  ', sampleColor)
    expect(result[0]?.title).toBe('CS 101')
  })

  it('applies the solid color from the palette', () => {
    const draft: TimeBlockDraft = {
      id: 'block-1',
      selectedDays: ['MONDAY'],
      startTime: '09:00',
      endTime: '10:00',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
    }

    const result = derivePreviewBlocks([draft], 'CS 101', sampleColor)
    expect(result[0]?.color).toBe('#D50000')
  })
})

describe('time helpers', () => {
  it('converts between minutes and time strings', () => {
    expect(timeToMinutes('09:15')).toBe(555)
    expect(minutesToTime(555)).toBe('09:15')
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(1440)).toBe('24:00')
  })

  it('resolves weekday from horizontal offset', () => {
    expect(dayFromOffsetX(50, 700)).toBe('SUNDAY')
    expect(dayFromOffsetX(150, 700)).toBe('MONDAY')
    expect(dayFromOffsetX(250, 700)).toBe('TUESDAY')
    expect(dayFromOffsetX(650, 700)).toBe('SATURDAY')
  })

  it('snaps vertical offset to 15-minute intervals', () => {
    // HOUR_HEIGHT = 80px: 0px = 0m, 20px = 15m, 40px = 30m, 60px = 45m
    expect(minutesFromOffsetY(0)).toBe(0)
    expect(minutesFromOffsetY(25)).toBe(15)
    expect(minutesFromOffsetY(45)).toBe(30)
    expect(minutesFromOffsetY(65)).toBe(45)
    expect(minutesFromOffsetY(80)).toBe(60)
  })
})

describe('slotFromOffset with sub-hour precision', () => {
  it('maps click between lines to 15-minute start and default 1h duration', () => {
    // hour 1 = 80px. offsetY = 120px is 1 hour + 40px (1:30 PM)
    const result = slotFromOffset(250, 120, 700)
    expect(result).toEqual({
      day: 'TUESDAY',
      startTime: '01:30',
      endTime: '02:30',
    })
  })

  it('clamps start time at the bottom of the grid', () => {
    const result = slotFromOffset(50, 1915, 700)
    expect(result).toEqual({
      day: 'SUNDAY',
      startTime: '23:45',
      endTime: '24:00',
    })
  })

  it('returns null when tap is outside grid bounds', () => {
    expect(slotFromOffset(-10, 100, 700)).toBeNull()
    expect(slotFromOffset(700, 100, 700)).toBeNull()
    expect(slotFromOffset(100, -5, 700)).toBeNull()
    expect(slotFromOffset(100, 24 * 80 + 1, 700)).toBeNull()
    expect(slotFromOffset(100, 100, 0)).toBeNull()
  })
})
