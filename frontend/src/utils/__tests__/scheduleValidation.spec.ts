import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  rangesOverlap,
  buildKnownSet,
  findDuplicateName,
  findClash,
  findEditorConflict,
  unavailableDaysFor,
} from '../scheduleValidation'
import type { CourseResponse, ScheduleResponse } from '@/types/api'
import type { CourseEditor } from '@/composables/useCourseEditor'
import type { TimeBlockDraft } from '@/components/TimeBlockCard.vue'

describe('timeToMinutes', () => {
  it('parses HH:MM into minutes since midnight', () => {
    expect(timeToMinutes('09:00')).toBe(540)
    expect(timeToMinutes('14:30')).toBe(870)
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('parses HH:MM:SS into minutes since midnight', () => {
    expect(timeToMinutes('09:00:00')).toBe(540)
    expect(timeToMinutes('14:30:15')).toBe(870)
  })

  it('returns NaN for empty or malformed inputs', () => {
    expect(Number.isNaN(timeToMinutes(''))).toBe(true)
    expect(Number.isNaN(timeToMinutes('invalid'))).toBe(true)
    expect(Number.isNaN(timeToMinutes('25:00'))).toBe(true)
    expect(Number.isNaN(timeToMinutes('12:60'))).toBe(true)
    expect(Number.isNaN(timeToMinutes('-01:00'))).toBe(true)
  })
})

describe('rangesOverlap', () => {
  it('returns true when time ranges overlap', () => {
    expect(rangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true)
    expect(rangesOverlap('09:30', '10:30', '09:00', '10:00')).toBe(true)
    expect(rangesOverlap('09:00', '11:00', '09:30', '10:00')).toBe(true)
  })

  it('returns false for adjacent ranges', () => {
    expect(rangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
    expect(rangesOverlap('10:00', '11:00', '09:00', '10:00')).toBe(false)
  })

  it('returns false for disjoint ranges', () => {
    expect(rangesOverlap('09:00', '10:00', '14:00', '15:00')).toBe(false)
  })

  it('returns false when start equals or exceeds end', () => {
    expect(rangesOverlap('10:00', '10:00', '09:00', '11:00')).toBe(false)
    expect(rangesOverlap('11:00', '10:00', '09:00', '12:00')).toBe(false)
  })

  it('returns false when any input is invalid or empty', () => {
    expect(rangesOverlap('', '10:00', '09:00', '11:00')).toBe(false)
    expect(rangesOverlap('09:00', '', '09:00', '11:00')).toBe(false)
    expect(rangesOverlap('09:00', '10:00', 'bad', '11:00')).toBe(false)
  })
})

describe('buildKnownSet', () => {
  it('combines stored catalog and drafts into KnownCourse and KnownSchedule sets', () => {
    const storedCourses = [
      { id: 1, name: 'CS 101' },
      { id: 2, name: 'MATH 201' },
    ]
    const storedSchedules = [
      {
        id: 10,
        courseId: 1,
        day: 'MONDAY' as const,
        startTime: '09:00',
        endTime: '10:30',
      },
    ]
    const drafts = {
      courses: [
        {
          tempId: 'temp-bio',
          name: 'Biology 101',
          colorId: 'emerald',
          schedules: [
            {
              day: 'TUESDAY' as const,
              startTime: '11:00',
              endTime: '12:30',
            },
          ],
        },
      ],
    }

    const result = buildKnownSet(storedCourses, storedSchedules, drafts)

    expect(result.courses).toEqual([
      { id: 1, name: 'CS 101' },
      { id: 2, name: 'MATH 201' },
      { id: 'temp-bio', name: 'Biology 101' },
    ])

    expect(result.schedules).toEqual([
      {
        courseId: 1,
        courseName: 'CS 101',
        day: 'MONDAY',
        startTime: '09:00',
        endTime: '10:30',
      },
      {
        courseId: 'temp-bio',
        courseName: 'Biology 101',
        day: 'TUESDAY',
        startTime: '11:00',
        endTime: '12:30',
      },
    ])
  })

  it('handles empty inputs gracefully', () => {
    const result = buildKnownSet([], [], { courses: [] })
    expect(result.courses).toEqual([])
    expect(result.schedules).toEqual([])
  })
})

describe('findDuplicateName', () => {
  const knownCourses = [
    { id: 1, name: 'CS 101' },
    { id: 2, name: 'Linear Algebra' },
  ]

  it('matches exact name', () => {
    const match = findDuplicateName('CS 101', knownCourses)
    expect(match).toEqual({ id: 1, name: 'CS 101' })
  })

  it('matches case-insensitively', () => {
    const match = findDuplicateName('cs 101', knownCourses)
    expect(match).toEqual({ id: 1, name: 'CS 101' })
  })

  it('matches with leading or trailing whitespace', () => {
    const match = findDuplicateName('  CS 101  ', knownCourses)
    expect(match).toEqual({ id: 1, name: 'CS 101' })
  })

  it('returns null when name is not in known courses', () => {
    const match = findDuplicateName('Math 201', knownCourses)
    expect(match).toBeNull()
  })

  it('returns null for empty or whitespace-only name', () => {
    expect(findDuplicateName('', knownCourses)).toBeNull()
    expect(findDuplicateName('   ', knownCourses)).toBeNull()
  })
})

describe('findClash', () => {
  const knownSchedules = [
    {
      courseId: 1,
      courseName: 'CS 101',
      day: 'MONDAY' as const,
      startTime: '09:00',
      endTime: '10:00',
    },
    {
      courseId: 2,
      courseName: 'Physics',
      day: 'TUESDAY' as const,
      startTime: '14:00',
      endTime: '15:30',
    },
  ]

  it('detects overlap on the same weekday', () => {
    const candidate = {
      day: 'MONDAY' as const,
      startTime: '09:30',
      endTime: '10:30',
    }
    const match = findClash(candidate, knownSchedules)
    expect(match).toEqual(knownSchedules[0])
  })

  it('allows adjacent times on the same weekday without clash', () => {
    const candidate = {
      day: 'MONDAY' as const,
      startTime: '10:00',
      endTime: '11:00',
    }
    expect(findClash(candidate, knownSchedules)).toBeNull()
  })

  it('allows different weekdays with the same time range without clash', () => {
    const candidate = {
      day: 'TUESDAY' as const,
      startTime: '09:00',
      endTime: '10:00',
    }
    expect(findClash(candidate, knownSchedules)).toBeNull()
  })

  it('allows non-overlapping times on the same weekday', () => {
    const candidate = {
      day: 'MONDAY' as const,
      startTime: '14:00',
      endTime: '15:00',
    }
    expect(findClash(candidate, knownSchedules)).toBeNull()
  })
})

describe('unavailableDaysFor', () => {
  const knownSchedules = [
    {
      courseId: 1,
      courseName: 'CS 101',
      day: 'MONDAY' as const,
      startTime: '09:00',
      endTime: '10:00',
    },
  ]

  it('marks a weekday unavailable when a known schedule clashes', () => {
    const block = {
      id: 'block-1',
      startTime: '09:30',
      endTime: '10:30',
      selectedDays: [],
    }
    const days = unavailableDaysFor(block, knownSchedules, [])
    expect(days).toEqual(['MONDAY'])
  })

  it('marks a weekday unavailable when a sibling block clashes on the same weekday', () => {
    const block = {
      id: 'block-1',
      startTime: '13:00',
      endTime: '14:00',
      selectedDays: [],
    }
    const siblings = [
      {
        id: 'block-2',
        startTime: '13:30',
        endTime: '14:30',
        selectedDays: ['WEDNESDAY' as const],
      },
    ]
    const days = unavailableDaysFor(block, [], siblings)
    expect(days).toEqual(['WEDNESDAY'])
  })

  it('returns empty array when block time is empty or invalid', () => {
    expect(unavailableDaysFor({ startTime: '', endTime: '' }, knownSchedules, [])).toEqual([])
    expect(
      unavailableDaysFor({ startTime: '10:00', endTime: '09:00' }, knownSchedules, []),
    ).toEqual([])
    expect(
      unavailableDaysFor({ startTime: '10:00', endTime: '10:00' }, knownSchedules, []),
    ).toEqual([])
  })
})

describe('findEditorConflict', () => {
  function makeBlock(overrides: Partial<TimeBlockDraft> = {}): TimeBlockDraft {
    return {
      id: 'block-1',
      selectedDays: [],
      startTime: '',
      endTime: '',
      room: '',
      state: 'draft',
      schedules: [],
      error: '',
      ...overrides,
    }
  }

  function makeEditor(overrides: Partial<CourseEditor> = {}): CourseEditor {
    return {
      id: 'editor-1',
      name: '',
      colorId: 'emerald',
      colorOpen: false,
      blocks: [],
      pendingSlot: null,
      pendingBlockId: null,
      isSaved: false,
      lastSavedSnapshot: '',
      ...overrides,
    }
  }

  const catalogCourses: CourseResponse[] = [
    { id: 1, name: 'CS 101' },
    { id: 2, name: 'Physics' },
  ]
  const catalogSchedules: ScheduleResponse[] = [
    {
      id: 10,
      courseId: 1,
      day: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
    },
  ]

  it('detects a duplicate course name from the catalog', () => {
    const editor = makeEditor({
      name: 'cs 101',
      blocks: [
        makeBlock({ selectedDays: ['TUESDAY'], startTime: '13:00', endTime: '14:00' }),
      ],
    })

    expect(findEditorConflict(editor, catalogCourses, catalogSchedules)).toBe(
      'A course named "cs 101" already exists.',
    )
  })

  it('detects a clash with another course schedule', () => {
    const editor = makeEditor({
      name: 'New Course',
      blocks: [
        makeBlock({ selectedDays: ['MONDAY'], startTime: '09:30', endTime: '10:30' }),
      ],
    })

    expect(findEditorConflict(editor, catalogCourses, catalogSchedules)).toBe(
      'A class time clashes with CS 101 on MONDAY.',
    )
  })

  it('ignores rows of the course being edited through persistedId', () => {
    const editor = makeEditor({
      name: 'CS 101',
      persistedId: 1,
      blocks: [
        makeBlock({ selectedDays: ['MONDAY'], startTime: '09:30', endTime: '10:30' }),
      ],
    })

    expect(findEditorConflict(editor, catalogCourses, catalogSchedules)).toBeNull()
  })

  it('detects overlapping sibling blocks of the same editor', () => {
    const editor = makeEditor({
      name: 'New Course',
      blocks: [
        makeBlock({
          id: 'block-1',
          selectedDays: ['WEDNESDAY'],
          startTime: '13:00',
          endTime: '14:00',
        }),
        makeBlock({
          id: 'block-2',
          selectedDays: ['WEDNESDAY'],
          startTime: '13:30',
          endTime: '14:30',
        }),
      ],
    })

    expect(findEditorConflict(editor, catalogCourses, catalogSchedules)).toBe(
      'Two time blocks for this course overlap on WEDNESDAY.',
    )
  })

  it('returns null when the editor has no conflict', () => {
    const editor = makeEditor({
      name: 'New Course',
      blocks: [
        makeBlock({ selectedDays: ['MONDAY'], startTime: '11:00', endTime: '12:00' }),
      ],
    })

    expect(findEditorConflict(editor, catalogCourses, catalogSchedules)).toBeNull()
  })
})
