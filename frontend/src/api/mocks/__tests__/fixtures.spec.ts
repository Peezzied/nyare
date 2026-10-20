import { describe, it, expect } from 'vitest'
import { createInitialFixtures } from '../fixtures'
import type { FixtureState } from '../fixtures'

describe('createInitialFixtures', () => {
  it('returns fixture state with all required entities', () => {
    const fixtures: FixtureState = createInitialFixtures()

    expect(fixtures).toBeDefined()
    expect(fixtures.users.length).toBeGreaterThanOrEqual(1)
    expect(fixtures.currentUser).not.toBeNull()
    expect(fixtures.currentUser?.id).toBe(1)
    expect(fixtures.currentUser?.username).toBe('karol')

    const karol = fixtures.users.find((u) => u.username === 'karol' && u.id === 1)
    expect(karol).toBeDefined()

    expect(fixtures.courses.length).toBe(8)
    const courseNames = fixtures.courses.map((c) => c.name)
    expect(courseNames).toContain('Computer Architecture and Organization')
    expect(courseNames).toContain('Calculus 2')
    expect(courseNames).toContain('Object-Oriented Programming')

    expect(fixtures.schedules.length).toBeGreaterThanOrEqual(5)
    for (const schedule of fixtures.schedules) {
      expect(schedule.courseId).toBeGreaterThan(0)
      expect(schedule.day).toBeDefined()
      expect(schedule.startTime).toMatch(/^\d{2}:\d{2}(:\d{2})?$/)
      expect(schedule.endTime).toMatch(/^\d{2}:\d{2}(:\d{2})?$/)
    }

    expect(fixtures.notes.length).toBeGreaterThanOrEqual(2)
    for (const note of fixtures.notes) {
      expect(note.courseId).toBeGreaterThan(0)
      expect(note.title).toBeTruthy()
      expect(note.content).toMatch(/^#\s+.+/m)
      expect(note.content).toMatch(/^-\s+.+/m)
      expect(note.entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }

    expect(fixtures.tasks.length).toBeGreaterThanOrEqual(5)
    expect(fixtures.academicEvents.length).toBeGreaterThanOrEqual(2)
    expect(fixtures.processSummary).toEqual({
      tasksCreated: 2,
      eventsCreated: 1,
      contextsCreated: 1,
      affectedCourseIds: [2],
    })
  })

  it('covers tri-state planning categories and task status edge cases', () => {
    const fixtures = createInitialFixtures()

    const scheduledTask = fixtures.tasks.find(
      (t) => Boolean(t.scheduledDate) && Boolean(t.duration),
    )
    expect(scheduledTask).toBeDefined()
    expect(scheduledTask?.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(scheduledTask?.duration).toMatch(/^PT\d+[HMS]/)

    const laterTask = fixtures.tasks.find((t) => !t.scheduledDate && Boolean(t.duration))
    expect(laterTask).toBeDefined()
    expect(laterTask?.scheduledDate).toBeNull()
    expect(laterTask?.duration).toMatch(/^PT\d+[HMS]/)

    const backlogTask = fixtures.tasks.find((t) => !t.scheduledDate && !t.duration)
    expect(backlogTask).toBeDefined()
    expect(backlogTask?.scheduledDate).toBeNull()
    expect(backlogTask?.duration).toBeNull()

    const completedTask = fixtures.tasks.find((t) => t.status === 'COMPLETED')
    expect(completedTask).toBeDefined()

    const inProgressTask = fixtures.tasks.find((t) => t.status === 'IN_PROGRESS')
    expect(inProgressTask).toBeDefined()

    const longDescTask = fixtures.tasks.find((t) => (t.description?.length ?? 0) > 200)
    expect(longDescTask).toBeDefined()
    expect(longDescTask?.description?.length ?? 0).toBeGreaterThan(200)
  })

  it('provides independent states on repeated factory invocations', () => {
    const stateA = createInitialFixtures()
    const stateB = createInitialFixtures()

    expect(stateA).not.toBe(stateB)
    expect(stateA.users).not.toBe(stateB.users)
    expect(stateA.tasks).not.toBe(stateB.tasks)

    // The DTO fields are readonly, so the cast allows a mutation that proves the deep copy.
    const mutableFirstTask = stateA.tasks[0] as { title: string }
    mutableFirstTask.title = 'Mutated Task Title'
    expect(stateB.tasks[0]!.title).not.toBe('Mutated Task Title')

    stateA.users.push({
      id: 999,
      username: 'mutated_user',
      createdAt: '2026-10-08T00:00:00Z',
      updatedAt: '2026-10-08T00:00:00Z',
    })
    expect(stateB.users.length).not.toBe(stateA.users.length)

    const mutableSummary = stateA.processSummary as { tasksCreated: number }
    mutableSummary.tasksCreated = 99
    expect(stateB.processSummary.tasksCreated).toBe(2)
  })

  it('validates ISO-8601 timestamps and deadlines parse cleanly', () => {
    const fixtures = createInitialFixtures()

    for (const user of fixtures.users) {
      expect(Number.isNaN(Date.parse(user.createdAt))).toBe(false)
      expect(Number.isNaN(Date.parse(user.updatedAt))).toBe(false)
    }

    expect(fixtures.currentUser).not.toBeNull()
    expect(Number.isNaN(Date.parse(fixtures.currentUser!.createdAt))).toBe(false)
    expect(Number.isNaN(Date.parse(fixtures.currentUser!.updatedAt))).toBe(false)

    for (const note of fixtures.notes) {
      expect(Number.isNaN(Date.parse(note.createdAt))).toBe(false)
      expect(Number.isNaN(Date.parse(note.updatedAt))).toBe(false)
    }

    const processedNotes = fixtures.notes.filter((note) => Boolean(note.lastProcessedAt))
    for (const note of processedNotes) {
      expect(Number.isNaN(Date.parse(note.lastProcessedAt!))).toBe(false)
    }

    for (const task of fixtures.tasks) {
      expect(Number.isNaN(Date.parse(task.createdAt))).toBe(false)
      expect(Number.isNaN(Date.parse(task.updatedAt))).toBe(false)
    }

    for (const event of fixtures.academicEvents) {
      expect(Number.isNaN(Date.parse(event.createdAt))).toBe(false)
      expect(Number.isNaN(Date.parse(event.deadline))).toBe(false)
      expect(event.deadline).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    }
  })

  it('validates ISO-8601 duration formatting across tasks', () => {
    const fixtures = createInitialFixtures()
    const isoDurationPattern = /^PT(?:(\d+)D)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/

    const tasksWithDuration = fixtures.tasks.filter((task) => Boolean(task.duration))
    expect(tasksWithDuration.length).toBeGreaterThan(0)
    for (const task of tasksWithDuration) {
      expect(task.duration).toMatch(isoDurationPattern)
    }
  })
})
