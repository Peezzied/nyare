import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCourseDrafts } from '../useCourseDrafts'
import { coursesApi, schedulesApi } from '@/api'

vi.mock('@/api', () => ({
  coursesApi: {
    create: vi.fn<() => Promise<any>>(),
  },
  schedulesApi: {
    create: vi.fn<() => Promise<any>>(),
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
    } as any)

    vi.mocked(schedulesApi.create).mockResolvedValueOnce({
      id: 101,
      courseId: 42,
      day: 'FRIDAY',
      startTime: '13:00',
      endTime: '14:00',
    } as any)

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
})
