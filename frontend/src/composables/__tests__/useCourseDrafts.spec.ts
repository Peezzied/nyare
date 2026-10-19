import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCourseDrafts } from '../useCourseDrafts'
import { coursesApi, schedulesApi } from '@/api'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

vi.mock('@/api', () => ({
  coursesApi: {
    create: vi.fn<() => Promise<unknown>>(),
    delete: vi.fn<() => Promise<unknown>>(),
  },
  schedulesApi: {
    create: vi.fn<() => Promise<unknown>>(),
  },
}))

describe('useCourseDrafts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { resetDrafts } = useCourseDrafts()
    resetDrafts()
  })

  it('stages a course and its schedules', () => {
    const { draftCourses, draftSchedules, stageCourse, stageSchedule } = useCourseDrafts()

    expect(draftCourses.value).toHaveLength(0)
    expect(draftSchedules.value).toHaveLength(0)

    stageCourse({
      tempId: 'temp-1',
      name: 'Physics 101',
      colorId: 'coral',
      schedules: [
        {
          day: 'MONDAY',
          startTime: '09:00',
          endTime: '10:30',
        },
      ],
    })

    expect(draftCourses.value).toHaveLength(1)
    expect(draftCourses.value[0]?.name).toBe('Physics 101')
    expect(draftSchedules.value).toHaveLength(1)
    expect(draftSchedules.value[0]?.tempId).toBe('temp-1')
    expect(draftSchedules.value[0]?.day).toBe('MONDAY')

    stageSchedule('temp-1', {
      day: 'WEDNESDAY',
      startTime: '09:00',
      endTime: '10:30',
    })

    expect(draftSchedules.value).toHaveLength(2)
  })

  it('clears draft courses and schedules on resetDrafts', () => {
    const { draftCourses, draftSchedules, stageCourse, resetDrafts } = useCourseDrafts()

    stageCourse({
      tempId: 'temp-1',
      name: 'Physics 101',
      colorId: 'coral',
      schedules: [],
    })

    expect(draftCourses.value).toHaveLength(1)
    resetDrafts()
    expect(draftCourses.value).toHaveLength(0)
    expect(draftSchedules.value).toHaveLength(0)
  })

  it('persists drafts through coursesApi and schedulesApi on flush', async () => {
    const { stageCourse, flush } = useCourseDrafts()

    vi.mocked(coursesApi.create).mockResolvedValueOnce({
      id: 42,
      name: 'Math 101',
      color: '#FF5733',
    } as unknown as CourseResponse)

    vi.mocked(schedulesApi.create).mockResolvedValueOnce({
      id: 101,
      courseId: 42,
      day: 'FRIDAY',
      startTime: '13:00',
      endTime: '14:00',
    } as ScheduleResponse)

    stageCourse({
      tempId: 'temp-math',
      name: 'Math 101',
      colorId: 'sky',
      schedules: [
        {
          day: 'FRIDAY',
          startTime: '13:00',
          endTime: '14:00',
        },
      ],
    })

    await flush()

    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Math 101' })
    expect(schedulesApi.create).toHaveBeenCalledWith({
      courseId: 42,
      day: 'FRIDAY',
      startTime: '13:00',
      endTime: '14:00',
    })
  })

  it('unstages persisted drafts and returns the created courses on flush', async () => {
    const { draftCourses, draftSchedules, stageCourse, flush } = useCourseDrafts()

    vi.mocked(coursesApi.create).mockResolvedValueOnce({
      id: 7,
      name: 'Biology',
    } as unknown as CourseResponse)
    vi.mocked(schedulesApi.create).mockResolvedValueOnce({
      id: 70,
      courseId: 7,
      day: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
    } as ScheduleResponse)

    stageCourse({
      tempId: 'temp-bio',
      name: 'Biology',
      colorId: 'sage',
      schedules: [{ day: 'MONDAY', startTime: '09:00', endTime: '10:00' }],
    })

    const created = await flush()

    expect(created).toEqual([{ tempId: 'temp-bio', course: { id: 7, name: 'Biology' } }])
    expect(draftCourses.value).toHaveLength(0)
    expect(draftSchedules.value).toHaveLength(0)
  })

  it('replaces the persisted course when the draft carries courseId', async () => {
    const { stageCourse, flush } = useCourseDrafts()

    vi.mocked(coursesApi.create).mockResolvedValueOnce({
      id: 9,
      name: 'Chemistry',
    } as unknown as CourseResponse)

    stageCourse({
      tempId: 'temp-chem',
      name: 'Chemistry',
      colorId: 'coral',
      schedules: [],
      courseId: 4,
    })

    await flush()

    expect(coursesApi.delete).toHaveBeenCalledWith(4)
    expect(coursesApi.create).toHaveBeenCalledWith({ name: 'Chemistry' })
  })

  it('keeps the draft staged and deletes the new course when a schedule create fails', async () => {
    const { draftCourses, stageCourse, flush } = useCourseDrafts()

    vi.mocked(coursesApi.create).mockResolvedValueOnce({
      id: 11,
      name: 'Geology',
    } as unknown as CourseResponse)
    vi.mocked(schedulesApi.create).mockRejectedValueOnce(new Error('schedule failed'))

    stageCourse({
      tempId: 'temp-geo',
      name: 'Geology',
      colorId: 'coral',
      schedules: [{ day: 'FRIDAY', startTime: '13:00', endTime: '14:00' }],
    })

    await expect(flush()).rejects.toThrow('schedule failed')

    expect(coursesApi.delete).toHaveBeenCalledWith(11)
    expect(draftCourses.value).toHaveLength(1)
    expect(draftCourses.value[0]?.name).toBe('Geology')
  })

  it('updates an existing course and replaces its schedules when tempId matches', () => {
    const { draftCourses, draftSchedules, stageCourse } = useCourseDrafts()

    stageCourse({
      tempId: 'draft-abc',
      name: 'Initial Name',
      colorId: 'coral',
      schedules: [
        {
          day: 'MONDAY',
          startTime: '08:00',
          endTime: '09:00',
        },
      ],
    })

    expect(draftCourses.value).toHaveLength(1)
    expect(draftSchedules.value).toHaveLength(1)
    expect(draftCourses.value[0]?.name).toBe('Initial Name')

    // Re-stage course with same tempId and updated schedule
    stageCourse({
      tempId: 'draft-abc',
      name: 'Updated Name',
      colorId: 'lavender',
      schedules: [
        {
          day: 'TUESDAY',
          startTime: '10:00',
          endTime: '11:00',
        },
        {
          day: 'THURSDAY',
          startTime: '10:00',
          endTime: '11:00',
        },
      ],
    })

    expect(draftCourses.value).toHaveLength(1)
    expect(draftCourses.value[0]?.name).toBe('Updated Name')
    expect(draftCourses.value[0]?.colorId).toBe('lavender')
    expect(draftSchedules.value).toHaveLength(2)
    expect(draftSchedules.value.every((s) => s.tempId === 'draft-abc')).toBe(true)
    expect(draftSchedules.value[0]?.day).toBe('TUESDAY')
    expect(draftSchedules.value[1]?.day).toBe('THURSDAY')
  })
})

