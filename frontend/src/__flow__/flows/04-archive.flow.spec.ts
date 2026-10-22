import '../harness/clientSetup'
import { describe, beforeAll, it, expect } from 'vitest'
import { assertBackendReachable } from '../harness/clientSetup'
import { authApi, coursesApi, schedulesApi, notesApi, tasksApi, academicEventsApi } from '@/api'
import { toDateKey } from '@/utils/dayKey'

describe('User Story 4: Course Archive', () => {
  let archivedCourse: Awaited<ReturnType<typeof coursesApi.create>>
  let activeCourse: Awaited<ReturnType<typeof coursesApi.create>>
  let scheduleId: number
  let noteId: string
  let taskId: string
  let eventId: string

  beforeAll(async () => {
    await assertBackendReachable()

    const username = `flow_archive_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    await authApi.register({ username })
    await authApi.login({ username })

    archivedCourse = await coursesApi.create({
      name: 'Archive Flow Course',
      description: 'Archived during this flow',
    })
    activeCourse = await coursesApi.create({
      name: 'Archive Flow Control',
      description: 'Stays active during this flow',
    })

    // The backend rejects writes on items of archived courses, so seed first.
    const schedule = await schedulesApi.create({
      courseId: archivedCourse.id,
      day: 'MONDAY',
      startTime: '09:00',
      endTime: '10:30',
    })
    scheduleId = schedule.id

    const note = await notesApi.create({
      courseId: archivedCourse.id,
      entryDate: toDateKey(new Date()),
      content: 'Archive flow journal note',
    })
    noteId = note.id

    const task = await tasksApi.create({
      courseId: archivedCourse.id,
      title: 'Archive flow task',
    })
    taskId = task.id

    const eventDate = new Date()
    eventDate.setDate(eventDate.getDate() + 3)
    const pad = (n: number) => String(n).padStart(2, '0')
    const deadline = `${toDateKey(eventDate)}T${pad(eventDate.getHours())}:${pad(eventDate.getMinutes())}:${pad(eventDate.getSeconds())}`

    const event = await academicEventsApi.create({
      courseId: archivedCourse.id,
      title: 'Archive flow event',
      deadline,
    })
    eventId = event.id
  })

  describe('Archive', () => {
    it('archives the course and stamps archivedAt', async () => {
      const archived = await coursesApi.archive(archivedCourse.id)

      expect(archived.id).toBe(archivedCourse.id)
      expect(archived.archivedAt).not.toBeNull()
    })
  })

  describe('Active Lists', () => {
    it('hides the archived course and its content from default lists', async () => {
      const courses = await coursesApi.list()
      expect(courses.map((c) => c.id)).toContain(activeCourse.id)
      expect(courses.map((c) => c.id)).not.toContain(archivedCourse.id)

      const schedules = await schedulesApi.list()
      expect(schedules.map((s) => s.id)).not.toContain(scheduleId)

      const notes = await notesApi.list()
      expect(notes.map((n) => n.id)).not.toContain(noteId)

      const tasks = await tasksApi.list()
      expect(tasks.map((t) => t.id)).not.toContain(taskId)

      const events = await academicEventsApi.list()
      expect(events.map((e) => e.id)).not.toContain(eventId)
    })

    it('keeps the same exclusions for explicit archived=false lists', async () => {
      const courses = await coursesApi.list({ archived: false })
      expect(courses.map((c) => c.id)).not.toContain(archivedCourse.id)

      const schedules = await schedulesApi.list({ archived: false })
      expect(schedules.map((s) => s.id)).not.toContain(scheduleId)

      const notes = await notesApi.list({ archived: false })
      expect(notes.map((n) => n.id)).not.toContain(noteId)

      const tasks = await tasksApi.list({ archived: false })
      expect(tasks.map((t) => t.id)).not.toContain(taskId)

      const events = await academicEventsApi.list({ archived: false })
      expect(events.map((e) => e.id)).not.toContain(eventId)
    })
  })

  describe('Archive Page', () => {
    it('lists the archived course under archived=true', async () => {
      const archived = await coursesApi.list({ archived: true })

      expect(archived.map((c) => c.id)).toContain(archivedCourse.id)
      expect(archived.map((c) => c.id)).not.toContain(activeCourse.id)
    })
  })

  describe('Archived Content', () => {
    it('reads archived course content through course-scoped archived lists', async () => {
      const scoped = { courseId: archivedCourse.id, archived: true }

      const schedules = await schedulesApi.list(scoped)
      expect(schedules.map((s) => s.id)).toContain(scheduleId)

      const notes = await notesApi.list(scoped)
      expect(notes.map((n) => n.id)).toContain(noteId)

      const tasks = await tasksApi.list(scoped)
      expect(tasks.map((t) => t.id)).toContain(taskId)

      const events = await academicEventsApi.list(scoped)
      expect(events.map((e) => e.id)).toContain(eventId)
    })
  })

  describe('Unarchive', () => {
    it('restores the course and its content to the active lists', async () => {
      const restored = await coursesApi.unarchive(archivedCourse.id)
      expect(restored.archivedAt).toBeNull()

      const courses = await coursesApi.list()
      expect(courses.map((c) => c.id)).toContain(archivedCourse.id)

      const schedules = await schedulesApi.list({ courseId: archivedCourse.id })
      expect(schedules.map((s) => s.id)).toContain(scheduleId)

      const notes = await notesApi.list({ courseId: archivedCourse.id })
      expect(notes.map((n) => n.id)).toContain(noteId)

      const tasks = await tasksApi.list({ courseId: archivedCourse.id })
      expect(tasks.map((t) => t.id)).toContain(taskId)

      const events = await academicEventsApi.list({ courseId: archivedCourse.id })
      expect(events.map((e) => e.id)).toContain(eventId)
    })
  })
})
