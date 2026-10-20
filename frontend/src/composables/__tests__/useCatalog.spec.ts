import { describe, it, expect, vi, beforeEach } from 'vitest'
import { coursesApi, schedulesApi } from '@/api'
import { useCatalog } from '../useCatalog'
import type { CourseResponse, ScheduleResponse } from '@/types/api'

const course: CourseResponse = { id: 1, name: 'CS 201', description: null, userId: 1 }
const schedule: ScheduleResponse = {
  id: 1,
  courseId: 1,
  day: 'MONDAY',
  startTime: '09:00:00',
  endTime: '10:30:00',
}

describe('useCatalog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // The cache is module-level state, so clear it to isolate each test.
    useCatalog().resetCatalog()
  })

  it('loads courses and schedules once per intent', async () => {
    const listCourses = vi.spyOn(coursesApi, 'list').mockResolvedValue([course])
    const listSchedules = vi.spyOn(schedulesApi, 'list').mockResolvedValue([schedule])
    const catalog = useCatalog()

    await catalog.loadCatalog()
    await catalog.loadCatalog()

    expect(listCourses).toHaveBeenCalledTimes(1)
    expect(listSchedules).toHaveBeenCalledTimes(1)
    expect(catalog.courses.value).toEqual([course])
    expect(catalog.schedules.value).toEqual([schedule])
  })

  it('reloads when forced', async () => {
    const listCourses = vi.spyOn(coursesApi, 'list').mockResolvedValue([course])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([schedule])
    const catalog = useCatalog()

    await catalog.loadCatalog()
    await catalog.loadCatalog(true)

    expect(listCourses).toHaveBeenCalledTimes(2)
  })

  it('applies course and schedule mutations locally without refetch', async () => {
    vi.spyOn(coursesApi, 'list').mockResolvedValue([course])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([schedule])
    const catalog = useCatalog()
    await catalog.loadCatalog()

    const created: CourseResponse = { id: 2, name: 'MATH 204', description: null, userId: 1 }
    catalog.applyCourseCreated(created)
    expect(catalog.courses.value).toEqual([course, created])

    const updated: ScheduleResponse = { ...schedule, day: 'WEDNESDAY' }
    catalog.applyScheduleUpdated(updated)
    expect(catalog.schedules.value).toEqual([updated])

    catalog.applyScheduleDeleted(schedule.id)
    expect(catalog.schedules.value).toEqual([])

    catalog.applyCourseDeleted(course.id)
    expect(catalog.courses.value).toEqual([created])
  })

  it('removes orphaned schedules when a course is deleted', async () => {
    vi.spyOn(coursesApi, 'list').mockResolvedValue([course])
    vi.spyOn(schedulesApi, 'list').mockResolvedValue([schedule])
    const catalog = useCatalog()
    await catalog.loadCatalog()

    catalog.applyCourseDeleted(course.id)

    expect(catalog.courses.value).toEqual([])
    expect(catalog.schedules.value).toEqual([])
  })

  describe('courseColor', () => {
    it('resolves the stored color slug of a catalog course', async () => {
      vi.spyOn(coursesApi, 'list').mockResolvedValue([{ ...course, color: 'peacock' }])
      vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
      const catalog = useCatalog()
      await catalog.loadCatalog()

      expect(catalog.courseColor(1).id).toBe('peacock')
      expect(catalog.courseColor(1).solid).toBe('#039BE5')

      catalog.applyCourseUpdated({ ...course, color: 'grape' })
      expect(catalog.courseColor(1).id).toBe('grape')
    })

    it('falls back to the derived color for a missing course or unknown slug', async () => {
      vi.spyOn(coursesApi, 'list').mockResolvedValue([
        { ...course, color: 'not-a-slug' },
        { id: 2, name: 'MATH 204', color: null },
      ])
      vi.spyOn(schedulesApi, 'list').mockResolvedValue([])
      const catalog = useCatalog()
      await catalog.loadCatalog()

      // Unknown slug and null color both derive from the course id.
      expect(catalog.courseColor(1).id).toBe('flamingo')
      expect(catalog.courseColor(2).id).toBe('radicchio')
      // An absent course derives from its id too: 5 % 24 = 5 (Pumpkin).
      expect(catalog.courseColor(5).id).toBe('pumpkin')
    })
  })
})
