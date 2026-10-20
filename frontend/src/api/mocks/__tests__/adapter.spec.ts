import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { initMockAdapter, resetMockFixtures } from '../adapter'
import {
  apiClient,
  ApiError,
  authApi,
  coursesApi,
  schedulesApi,
  notesApi,
  tasksApi,
  academicEventsApi,
  studyPlannerApi,
  imagesApi,
} from '@/api'
import type { ProcessSummaryResponse } from '@/types/api'

describe('Mock Adapter', () => {
  const originalDevUser = import.meta.env.VITE_DEV_USER

  beforeEach(async () => {
    import.meta.env.VITE_DEV_USER = ''
    initMockAdapter()
    // The mock store is module state, so each test starts from fresh fixtures.
    resetMockFixtures()
    // Protected routes need a session, so start each test logged in.
    await authApi.login({ username: 'karol' })
  })

  afterEach(() => {
    import.meta.env.VITE_DEV_USER = originalDevUser
  })

  describe('courses', () => {
    it('lists initial courses and creates new course', async () => {
      const initialCourses = await coursesApi.list()
      expect(initialCourses.length).toBe(8)

      const created = await coursesApi.create({
        name: 'CS 301 - Operating Systems',
        description: 'Processes, threads, and synchronization',
      })
      expect(created.id).toBeDefined()
      expect(created.name).toBe('CS 301 - Operating Systems')

      const updatedList = await coursesApi.list()
      expect(updatedList.length).toBe(9)

      const fetched = await coursesApi.get(created.id)
      expect(fetched.name).toBe('CS 301 - Operating Systems')

      await coursesApi.delete(created.id)
      const afterDelete = await coursesApi.list()
      expect(afterDelete.length).toBe(8)

      await expect(coursesApi.get(created.id)).rejects.toThrow(ApiError)
    })

    it('updates a course and rejects missing courses', async () => {
      const updated = await coursesApi.update(1, {
        name: 'CS 201 - Renamed',
        description: 'New description',
      })
      expect(updated.id).toBe(1)
      expect(updated.name).toBe('CS 201 - Renamed')
      expect(updated.description).toBe('New description')

      const fetched = await coursesApi.get(1)
      expect(fetched.name).toBe('CS 201 - Renamed')

      await expect(coursesApi.update(999, { name: 'Ghost' })).rejects.toThrow(ApiError)
    })

    it('stores and returns the submitted course color', async () => {
      const created = await coursesApi.create({
        name: 'CS 301 - Operating Systems',
        color: 'flamingo',
      })
      expect(created.color).toBe('flamingo')

      const fetched = await coursesApi.get(created.id)
      expect(fetched.color).toBe('flamingo')
    })

    it('updates the course color on PUT', async () => {
      const updated = await coursesApi.update(1, {
        name: 'CS 201 - Data Structures & Algorithms',
        color: 'basil',
      })
      expect(updated.color).toBe('basil')

      const fetched = await coursesApi.get(1)
      expect(fetched.color).toBe('basil')
    })

    it('leaves color unset when the request omits it', async () => {
      const created = await coursesApi.create({ name: 'No Color Course' })
      expect(created.color).toBeNull()

      const seeded = await coursesApi.get(1)
      expect(seeded.color).toBeUndefined()
    })
  })

  describe('tasks and tri-state planCategory', () => {
    it('derives SCHEDULED when scheduledDate is present', async () => {
      const task = await tasksApi.create({
        courseId: 1,
        title: 'Scheduled Task',
        scheduledDate: '2026-10-15',
        duration: 'PT1H',
      })
      expect(task.planCategory).toBe('SCHEDULED')
      expect(task.scheduledDate).toBe('2026-10-15')
    })

    it('derives LATER when scheduledDate is null and duration is present', async () => {
      const task = await tasksApi.create({
        courseId: 1,
        title: 'Later Task',
        scheduledDate: null,
        duration: 'PT2H',
      })
      expect(task.planCategory).toBe('LATER')
      expect(task.duration).toBe('PT2H')
    })

    it('derives BACKLOG when scheduledDate and duration are null', async () => {
      const task = await tasksApi.create({
        courseId: 1,
        title: 'Backlog Task',
        scheduledDate: null,
        duration: null,
      })
      expect(task.planCategory).toBe('BACKLOG')
    })

    it('updates planCategory when scheduledDate is modified', async () => {
      const task = await tasksApi.create({
        courseId: 1,
        title: 'Transition Task',
        scheduledDate: null,
        duration: 'PT1H',
      })
      expect(task.planCategory).toBe('LATER')

      const updated = await tasksApi.update(task.id, {
        courseId: 1,
        title: 'Transition Task',
        scheduledDate: '2026-10-20',
        duration: 'PT1H',
      })
      expect(updated.planCategory).toBe('SCHEDULED')
      expect(updated.scheduledDate).toBe('2026-10-20')
    })

    it('patches task status without altering planCategory', async () => {
      const task = await tasksApi.create({
        courseId: 1,
        title: 'Status Task',
        scheduledDate: '2026-10-15',
        duration: 'PT1H',
      })
      expect(task.status).toBe('TODO')

      const patched = await tasksApi.updateStatus(task.id, 'IN_PROGRESS')
      expect(patched.status).toBe('IN_PROGRESS')
      expect(patched.planCategory).toBe('SCHEDULED')

      const completed = await tasksApi.updateStatus(task.id, { status: 'COMPLETED' })
      expect(completed.status).toBe('COMPLETED')
    })

    it('filters tasks by courseId, status, and scheduled flag', async () => {
      const course1Tasks = await tasksApi.list({ courseId: 1 })
      expect(course1Tasks.every((t) => t.courseId === 1)).toBe(true)

      const completedTasks = await tasksApi.list({ status: 'COMPLETED' })
      expect(completedTasks.every((t) => t.status === 'COMPLETED')).toBe(true)

      const scheduledTasks = await tasksApi.list({ scheduled: true })
      expect(scheduledTasks.every((t) => t.scheduledDate !== null)).toBe(true)

      const unscheduledTasks = await tasksApi.list({ scheduled: false })
      expect(unscheduledTasks.every((t) => t.scheduledDate === null)).toBe(true)
    })

    it('deletes task and throws error on missing task retrieval', async () => {
      const task = await tasksApi.create({
        courseId: 1,
        title: 'Delete Me',
      })
      await tasksApi.delete(task.id)
      await expect(tasksApi.get(task.id)).rejects.toThrow(ApiError)
    })
  })

  describe('auth and user management', () => {
    it('executes login, me, and logout cycle', async () => {
      // The fixtures start with 'karol' logged in.
      const initialMe = await authApi.getCurrentUser()
      expect(initialMe.username).toBe('karol')

      await authApi.logout()
      await expect(authApi.getCurrentUser()).rejects.toThrow(ApiError)

      const loggedIn = await authApi.login({ username: 'karol' })
      expect(loggedIn.username).toBe('karol')

      const verifiedMe = await authApi.getCurrentUser()
      expect(verifiedMe.username).toBe('karol')
    })

    it('registers and retrieves users', async () => {
      const newUser = await authApi.register({ username: 'bob' })
      expect(newUser.username).toBe('bob')

      const fetchedUser = await authApi.getUser(newUser.id)
      expect(fetchedUser.username).toBe('bob')

      const userList = await authApi.listUsers()
      expect(userList.some((u) => u.username === 'bob')).toBe(true)

      await authApi.deleteUser(newUser.id)
      await expect(authApi.getUser(newUser.id)).rejects.toThrow(ApiError)
    })

    it('fails login with unknown user', async () => {
      await expect(authApi.login({ username: 'nonexistent_user' })).rejects.toThrow(ApiError)
    })
  })

  describe('notes', () => {
    it('returns preview summary in note list and full content in note get', async () => {
      const noteSummaries = await notesApi.list()
      expect(noteSummaries.length).toBeGreaterThanOrEqual(2)

      const avlSummary = noteSummaries.find((n) => n.id === 'note-cs201-avl')
      expect(avlSummary).toBeDefined()
      expect(avlSummary?.title).toBe('Lecture 7: Self-Balancing Trees')
      expect(avlSummary?.entryDate).toBe('2026-10-05')
      expect(avlSummary?.truncated).toBe(true)
      // 200 is the preview limit that the backend also uses.
      expect(avlSummary?.preview.length).toBe(200)
      expect(avlSummary?.contentLength).toBeGreaterThan(200)

      const fullNote = await notesApi.get('note-cs201-avl')
      expect(fullNote.title).toBe(avlSummary?.title)
      expect(fullNote.entryDate).toBe(avlSummary?.entryDate)
      expect(fullNote.content.length).toBe(avlSummary?.contentLength)
      expect(fullNote.content.startsWith(avlSummary?.preview ?? '')).toBe(true)
    })

    it('filters notes by courseId', async () => {
      const course2Notes = await notesApi.list(2)
      expect(course2Notes.every((n) => n.courseId === 2)).toBe(true)
    })

    it('supports note creation, modification, and deletion', async () => {
      const newNote = await notesApi.create({
        courseId: 3,
        title: 'Lab notes',
        content: 'Short note content',
        entryDate: '2026-10-07',
      })
      expect(newNote.id).toBeDefined()
      expect(newNote.title).toBe('Lab notes')
      expect(newNote.entryDate).toBe('2026-10-07')

      const summaryList = await notesApi.list(3)
      const foundSummary = summaryList.find((n) => n.id === newNote.id)
      expect(foundSummary?.title).toBe('Lab notes')
      expect(foundSummary?.entryDate).toBe('2026-10-07')
      expect(foundSummary?.truncated).toBe(false)
      expect(foundSummary?.preview).toBe('Short note content')

      const updated = await notesApi.update(newNote.id, {
        courseId: 3,
        title: 'Updated lab notes',
        content: 'Updated note content',
        entryDate: '2026-10-08',
      })
      expect(updated.title).toBe('Updated lab notes')
      expect(updated.content).toBe('Updated note content')
      expect(updated.entryDate).toBe('2026-10-08')

      await notesApi.delete(newNote.id)
      await expect(notesApi.get(newNote.id)).rejects.toThrow(ApiError)
    })
  })

  describe('schedules', () => {
    it('filters schedules by courseId and day', async () => {
      const course1Schedules = await schedulesApi.list({ courseId: 1 })
      expect(course1Schedules.length).toBe(3)
      expect(course1Schedules.every((s) => s.courseId === 1)).toBe(true)

      const mondaySchedules = await schedulesApi.list({ day: 'MONDAY' })
      expect(mondaySchedules.every((s) => s.day === 'MONDAY')).toBe(true)

      const filtered = await schedulesApi.list({ courseId: 1, day: 'WEDNESDAY' })
      expect(filtered.length).toBe(2)
      expect(filtered[0]?.day).toBe('WEDNESDAY')
      expect(filtered[0]?.courseId).toBe(1)
    })

    it('creates, updates, and deletes schedule entries', async () => {
      const created = await schedulesApi.create({
        courseId: 3,
        day: 'MONDAY',
        startTime: '14:00:00',
        endTime: '15:30:00',
      })
      expect(created.id).toBeDefined()

      const updated = await schedulesApi.update(created.id, {
        courseId: 3,
        day: 'MONDAY',
        startTime: '14:30:00',
        endTime: '16:00:00',
      })
      expect(updated.startTime).toBe('14:30:00')

      await schedulesApi.delete(created.id)
      await expect(schedulesApi.get(created.id)).rejects.toThrow(ApiError)
    })
  })

  describe('academic events and study planner', () => {
    it('handles academic events CRUD and course filtering', async () => {
      const events = await academicEventsApi.list({ courseId: 1 })
      expect(events.length).toBe(1)
      expect(events[0]?.courseId).toBe(1)

      const created = await academicEventsApi.create({
        courseId: 1,
        title: 'CS 201 Final Exam',
        deadline: '2026-12-15T09:00:00',
      })
      expect(created.id).toBeDefined()

      const fetched = await academicEventsApi.get(created.id)
      expect(fetched.title).toBe('CS 201 Final Exam')

      await academicEventsApi.delete(created.id)
      await expect(academicEventsApi.get(created.id)).rejects.toThrow(ApiError)
    })

    it('returns processSummary on study planner process trigger', async () => {
      // apiClient.post() uses the mock router. process() uses the patched `fetch` SSE stream.
      const result = await apiClient.post<ProcessSummaryResponse>('/api/study-planner/process')
      expect(result).toEqual({
        tasksCreated: 2,
        eventsCreated: 1,
        contextsCreated: 1,
        affectedCourseIds: [2],
      })

      const apiResult = await studyPlannerApi.process()
      expect(apiResult).toEqual({
        tasksCreated: 2,
        eventsCreated: 1,
        contextsCreated: 1,
        affectedCourseIds: [2],
      })
    })

    it('reports dirty notes on status and clears them on process', async () => {
      // Fixture note-math204-eigen has lastProcessedAt: null, so it counts as dirty.
      const before = await studyPlannerApi.status()
      expect(before.hasPendingNotes).toBe(true)
      expect(before.dirtyNoteCount).toBe(1)
      expect(before.dirtyDates).toEqual(['2026-10-06'])
      expect(before.courseNames).toEqual(['Principles of Programming Languages'])
      expect(before.pendingNotes[0]?.id).toBe('note-math204-eigen')

      await studyPlannerApi.process()

      const after = await studyPlannerApi.status()
      expect(after.hasPendingNotes).toBe(false)
      expect(after.dirtyNoteCount).toBe(0)
      expect(after.pendingNotes).toEqual([])
    })

    it('marks a newly created note as dirty', async () => {
      await notesApi.create({ courseId: 1, content: 'New lecture notes' })

      const status = await studyPlannerApi.status()
      expect(status.dirtyNoteCount).toBe(2)
      expect(status.courseNames).toContain('Computer Architecture and Organization')
    })

    it('supports image upload and deletion', async () => {
      const file = new File(['dummy bytes'], 'avatar.png', { type: 'image/png' })
      const uploaded = await imagesApi.upload(file)
      expect(uploaded.id).toBeDefined()
      // In tests the mock skips blob URLs and returns the API path.
      expect(uploaded.url).toContain('/api/images/')

      const fetchedImage = await apiClient.get<{ id: string }>(`/api/images/${uploaded.id}`)
      expect(fetchedImage.id).toBe(uploaded.id)

      await imagesApi.delete(uploaded.id)
      await expect(apiClient.get(`/api/images/${uploaded.id}`)).rejects.toThrow(ApiError)
    })
  })

  describe('session enforcement', () => {
    it('rejects protected list calls with 401 when there is no session', async () => {
      await authApi.logout()

      const expectUnauthorized = async (call: Promise<unknown>) => {
        await expect(call).rejects.toSatisfy((err: unknown) => {
          expect(err).toBeInstanceOf(ApiError)
          const apiErr = err as ApiError
          expect(apiErr.status).toBe(401)
          expect(apiErr.problem).toEqual({
            title: 'Unauthorized',
            status: 401,
            detail: 'Authentication required',
          })
          return true
        })
      }

      await expectUnauthorized(coursesApi.list())
      await expectUnauthorized(tasksApi.list())
      await expectUnauthorized(notesApi.list())
    })

    it('allows protected list calls after login', async () => {
      await authApi.logout()
      await authApi.login({ username: 'karol' })

      const courses = await coursesApi.list()
      expect(courses.length).toBe(8)
    })
  })

  describe('resetMockFixtures', () => {
    it('resets modified state back to initial state', async () => {
      await coursesApi.create({ name: 'Temporary Course' })
      const courseCountBefore = (await coursesApi.list()).length
      expect(courseCountBefore).toBe(9)

      resetMockFixtures()

      const courseCountAfter = (await coursesApi.list()).length
      expect(courseCountAfter).toBe(8)
    })
  })
})
