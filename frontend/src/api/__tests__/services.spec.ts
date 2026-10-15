import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  apiClient,
  authApi,
  coursesApi,
  schedulesApi,
  notesApi,
  tasksApi,
  academicEventsApi,
  studyPlannerApi,
  imagesApi,
} from '../index'
import type {
  UserResponse,
  CourseResponse,
  ScheduleResponse,
  NoteResponse,
  NoteSummaryResponse,
  TaskResponse,
  AcademicEventResponse,
  ProcessSummaryResponse,
  PlannerStatusResponse,
  ProcessProgressEvent,
  ImageUploadResponse,
} from '@/types/api'

describe('API Services', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('authApi', () => {
    it('calls login endpoint with credentials', async () => {
      const mockUser: UserResponse = {
        id: 1,
        username: 'alice',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockUser)

      const result = await authApi.login({ username: 'alice' })
      expect(result).toEqual(mockUser)
      expect(postSpy).toHaveBeenCalledWith('/api/users/login', { username: 'alice' })
    })

    it('calls logout endpoint', async () => {
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined)

      await authApi.logout()
      expect(postSpy).toHaveBeenCalledWith('/api/users/logout')
    })

    it('calls getCurrentUser endpoint', async () => {
      const mockUser: UserResponse = {
        id: 1,
        username: 'alice',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockUser)

      const result = await authApi.getCurrentUser()
      expect(result).toEqual(mockUser)
      expect(getSpy).toHaveBeenCalledWith('/api/users/me')
    })

    it('calls register endpoint', async () => {
      const mockUser: UserResponse = {
        id: 2,
        username: 'bob',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockUser)

      const result = await authApi.register({ username: 'bob' })
      expect(result).toEqual(mockUser)
      expect(postSpy).toHaveBeenCalledWith('/api/users', { username: 'bob' })
    })

    it('calls listUsers endpoint', async () => {
      const mockUsers: UserResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockUsers)

      const result = await authApi.listUsers()
      expect(result).toEqual(mockUsers)
      expect(getSpy).toHaveBeenCalledWith('/api/users')
    })

    it('calls getUser endpoint with id', async () => {
      const mockUser: UserResponse = {
        id: 5,
        username: 'charlie',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockUser)

      const result = await authApi.getUser(5)
      expect(result).toEqual(mockUser)
      expect(getSpy).toHaveBeenCalledWith('/api/users/5')
    })

    it('calls deleteUser endpoint with id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await authApi.deleteUser(5)
      expect(deleteSpy).toHaveBeenCalledWith('/api/users/5')
    })
  })

  describe('coursesApi', () => {
    it('calls list without parameters', async () => {
      const mockCourses: CourseResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockCourses)

      const result = await coursesApi.list()
      expect(result).toEqual(mockCourses)
      expect(getSpy).toHaveBeenCalledWith('/api/courses', { userId: undefined })
    })

    it('calls list with userId parameter', async () => {
      const mockCourses: CourseResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockCourses)

      const result = await coursesApi.list(12)
      expect(result).toEqual(mockCourses)
      expect(getSpy).toHaveBeenCalledWith('/api/courses', { userId: 12 })
    })

    it('calls get with course id', async () => {
      const mockCourse: CourseResponse = { id: 3, name: 'CS 101' }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockCourse)

      const result = await coursesApi.get(3)
      expect(result).toEqual(mockCourse)
      expect(getSpy).toHaveBeenCalledWith('/api/courses/3')
    })

    it('calls create with course request', async () => {
      const payload = { name: 'CS 102', description: 'Intro to Algorithms' }
      const mockCourse: CourseResponse = { id: 4, ...payload }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockCourse)

      const result = await coursesApi.create(payload)
      expect(result).toEqual(mockCourse)
      expect(postSpy).toHaveBeenCalledWith('/api/courses', payload)
    })

    it('calls delete with course id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await coursesApi.delete(4)
      expect(deleteSpy).toHaveBeenCalledWith('/api/courses/4')
    })
  })

  describe('schedulesApi', () => {
    it('calls list with optional query parameters', async () => {
      const mockSchedules: ScheduleResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSchedules)

      const result = await schedulesApi.list({ courseId: 1, day: 'MONDAY' })
      expect(result).toEqual(mockSchedules)
      expect(getSpy).toHaveBeenCalledWith('/api/schedules', { courseId: 1, day: 'MONDAY' })
    })

    it('calls get with schedule id', async () => {
      const mockSchedule: ScheduleResponse = {
        id: 7,
        courseId: 1,
        day: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '10:30',
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockSchedule)

      const result = await schedulesApi.get(7)
      expect(result).toEqual(mockSchedule)
      expect(getSpy).toHaveBeenCalledWith('/api/schedules/7')
    })

    it('calls create with schedule request', async () => {
      const payload = {
        courseId: 1,
        day: 'FRIDAY' as const,
        startTime: '13:00',
        endTime: '14:30',
      }
      const mockSchedule: ScheduleResponse = { id: 8, ...payload }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockSchedule)

      const result = await schedulesApi.create(payload)
      expect(result).toEqual(mockSchedule)
      expect(postSpy).toHaveBeenCalledWith('/api/schedules', payload)
    })

    it('calls update with schedule request', async () => {
      const payload = {
        courseId: 1,
        day: 'FRIDAY' as const,
        startTime: '14:00',
        endTime: '15:30',
      }
      const mockSchedule: ScheduleResponse = { id: 8, ...payload }
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(mockSchedule)

      const result = await schedulesApi.update(8, payload)
      expect(result).toEqual(mockSchedule)
      expect(putSpy).toHaveBeenCalledWith('/api/schedules/8', payload)
    })

    it('calls delete with schedule id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await schedulesApi.delete(8)
      expect(deleteSpy).toHaveBeenCalledWith('/api/schedules/8')
    })
  })

  describe('notesApi', () => {
    it('calls list with optional courseId parameter', async () => {
      const mockNotes: NoteSummaryResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockNotes)

      const result = await notesApi.list(10)
      expect(result).toEqual(mockNotes)
      expect(getSpy).toHaveBeenCalledWith('/api/notes', { courseId: 10 })
    })

    it('calls get with note id', async () => {
      const mockNote: NoteResponse = {
        id: 'note-1',
        courseId: 10,
        title: 'Lecture notes',
        content: 'Lecture notes',
        entryDate: '2026-10-08',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockNote)

      const result = await notesApi.get('note-1')
      expect(result).toEqual(mockNote)
      expect(getSpy).toHaveBeenCalledWith('/api/notes/note-1')
    })

    it('calls create with note request', async () => {
      const payload = { courseId: 10, content: 'New note content' }
      const mockNote: NoteResponse = {
        id: 'note-2',
        courseId: 10,
        title: 'New note',
        content: payload.content,
        entryDate: '2026-10-08',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockNote)

      const result = await notesApi.create(payload)
      expect(result).toEqual(mockNote)
      expect(postSpy).toHaveBeenCalledWith('/api/notes', payload)
    })

    it('calls update with note request', async () => {
      const payload = { courseId: 10, content: 'Updated content' }
      const mockNote: NoteResponse = {
        id: 'note-2',
        courseId: 10,
        title: 'Updated title',
        content: payload.content,
        entryDate: '2026-10-08',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T01:00:00Z',
      }
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(mockNote)

      const result = await notesApi.update('note-2', payload)
      expect(result).toEqual(mockNote)
      expect(putSpy).toHaveBeenCalledWith('/api/notes/note-2', payload)
    })

    it('calls delete with note id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await notesApi.delete('note-2')
      expect(deleteSpy).toHaveBeenCalledWith('/api/notes/note-2')
    })
  })

  describe('tasksApi', () => {
    it('calls list with filter parameters', async () => {
      const mockTasks: TaskResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockTasks)

      const result = await tasksApi.list({ courseId: 5, status: 'TODO', scheduled: true })
      expect(result).toEqual(mockTasks)
      expect(getSpy).toHaveBeenCalledWith('/api/tasks', {
        courseId: 5,
        status: 'TODO',
        scheduled: true,
      })
    })

    it('calls get with task id', async () => {
      const mockTask: TaskResponse = {
        id: 'task-1',
        courseId: 5,
        title: 'Review chapter 1',
        status: 'TODO',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockTask)

      const result = await tasksApi.get('task-1')
      expect(result).toEqual(mockTask)
      expect(getSpy).toHaveBeenCalledWith('/api/tasks/task-1')
    })

    it('calls create with task request', async () => {
      const payload = { courseId: 5, title: 'Read notes' }
      const mockTask: TaskResponse = {
        id: 'task-2',
        courseId: 5,
        title: 'Read notes',
        status: 'TODO',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockTask)

      const result = await tasksApi.create(payload)
      expect(result).toEqual(mockTask)
      expect(postSpy).toHaveBeenCalledWith('/api/tasks', payload)
    })

    it('calls update with task request', async () => {
      const payload = { courseId: 5, title: 'Read chapter 2' }
      const mockTask: TaskResponse = {
        id: 'task-2',
        courseId: 5,
        title: 'Read chapter 2',
        status: 'TODO',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T01:00:00Z',
      }
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(mockTask)

      const result = await tasksApi.update('task-2', payload)
      expect(result).toEqual(mockTask)
      expect(putSpy).toHaveBeenCalledWith('/api/tasks/task-2', payload)
    })

    it('calls updateStatus with task status object', async () => {
      const mockTask: TaskResponse = {
        id: 'task-2',
        courseId: 5,
        title: 'Read chapter 2',
        status: 'COMPLETED',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T02:00:00Z',
      }
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockTask)

      const result = await tasksApi.updateStatus('task-2', { status: 'COMPLETED' })
      expect(result).toEqual(mockTask)
      expect(patchSpy).toHaveBeenCalledWith('/api/tasks/task-2/status', { status: 'COMPLETED' })
    })

    it('calls updateStatus with task status string', async () => {
      const mockTask: TaskResponse = {
        id: 'task-2',
        courseId: 5,
        title: 'Read chapter 2',
        status: 'IN_PROGRESS',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T02:00:00Z',
      }
      const patchSpy = vi.spyOn(apiClient, 'patch').mockResolvedValue(mockTask)

      const result = await tasksApi.updateStatus('task-2', 'IN_PROGRESS')
      expect(result).toEqual(mockTask)
      expect(patchSpy).toHaveBeenCalledWith('/api/tasks/task-2/status', { status: 'IN_PROGRESS' })
    })

    it('calls delete with task id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await tasksApi.delete('task-2')
      expect(deleteSpy).toHaveBeenCalledWith('/api/tasks/task-2')
    })
  })

  describe('academicEventsApi', () => {
    it('calls list with filter parameters', async () => {
      const mockEvents: AcademicEventResponse[] = []
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockEvents)

      const result = await academicEventsApi.list({ courseId: 3, upcoming: true })
      expect(result).toEqual(mockEvents)
      expect(getSpy).toHaveBeenCalledWith('/api/academic-events', { courseId: 3, upcoming: true })
    })

    it('calls get with event id', async () => {
      const mockEvent: AcademicEventResponse = {
        id: 'event-1',
        courseId: 3,
        title: 'Midterm Exam',
        deadline: '2026-10-15T09:00:00Z',
        createdAt: '2026-10-08T00:00:00Z',
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockEvent)

      const result = await academicEventsApi.get('event-1')
      expect(result).toEqual(mockEvent)
      expect(getSpy).toHaveBeenCalledWith('/api/academic-events/event-1')
    })

    it('calls create with event request', async () => {
      const payload = {
        courseId: 3,
        title: 'Final Project',
        deadline: '2026-11-20T23:59:59Z',
      }
      const mockEvent: AcademicEventResponse = {
        id: 'event-2',
        ...payload,
        createdAt: '2026-10-08T00:00:00Z',
      }
      const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockEvent)

      const result = await academicEventsApi.create(payload)
      expect(result).toEqual(mockEvent)
      expect(postSpy).toHaveBeenCalledWith('/api/academic-events', payload)
    })

    it('calls update with event request', async () => {
      const payload = {
        courseId: 3,
        title: 'Final Project Rescheduled',
        deadline: '2026-11-25T23:59:59Z',
      }
      const mockEvent: AcademicEventResponse = {
        id: 'event-2',
        ...payload,
        createdAt: '2026-10-08T00:00:00Z',
      }
      const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(mockEvent)

      const result = await academicEventsApi.update('event-2', payload)
      expect(result).toEqual(mockEvent)
      expect(putSpy).toHaveBeenCalledWith('/api/academic-events/event-2', payload)
    })

    it('calls delete with event id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await academicEventsApi.delete('event-2')
      expect(deleteSpy).toHaveBeenCalledWith('/api/academic-events/event-2')
    })
  })

  describe('studyPlannerApi', () => {
    it('status calls GET /api/study-planner/status', async () => {
      const mockStatus: PlannerStatusResponse = {
        hasPendingNotes: false,
        dirtyNoteCount: 0,
        dirtyDates: [],
        courseNames: [],
        pendingNotes: [],
      }
      const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue(mockStatus)

      const result = await studyPlannerApi.status()
      expect(result).toEqual(mockStatus)
      expect(getSpy).toHaveBeenCalledWith('/api/study-planner/status')
    })

    it('streamProcess parses done event and triggers onDone callback', async () => {
      const summary: ProcessSummaryResponse = {
        tasksCreated: 3,
        eventsCreated: 1,
        contextsCreated: 2,
      }
      const sseText = `event: done\ndata: ${JSON.stringify(summary)}\n\n`

      // `body: null` makes streamProcess read the whole SSE text through `text()`.
      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        text: async () => sseText,
        body: null,
      } as unknown as Response)

      const onDone = vi.fn<(summary: ProcessSummaryResponse) => void>()
      const onError = vi.fn<(error: unknown) => void>()

      await studyPlannerApi.streamProcess({ onDone, onError })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/study-planner/process',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Accept: 'text/event-stream',
          }),
          credentials: 'include',
        }),
      )
      expect(onDone).toHaveBeenCalledWith(summary)
      expect(onError).not.toHaveBeenCalled()
    })

    it('streamProcess handles error event and triggers onError callback', async () => {
      const errorData = { status: 400, title: 'Bad Request', detail: 'Notes already processed' }
      const sseText = `event: error\ndata: ${JSON.stringify(errorData)}\n\n`

      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        text: async () => sseText,
        body: null,
      } as unknown as Response)

      const onDone = vi.fn<(summary: ProcessSummaryResponse) => void>()
      const onError = vi.fn<(error: unknown) => void>()

      await studyPlannerApi.streamProcess({ onDone, onError })

      expect(onDone).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalledWith(errorData)
    })

    it('streamProcess handles HTTP error status and calls onError', async () => {
      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Internal Server Error',
        body: null,
      } as unknown as Response)

      const onDone = vi.fn<(summary: ProcessSummaryResponse) => void>()
      const onError = vi.fn<(error: unknown) => void>()

      await studyPlannerApi.streamProcess({ onDone, onError })

      expect(onDone).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalled()
    })

    it('process wrapper resolves summary from done event', async () => {
      const summary: ProcessSummaryResponse = {
        tasksCreated: 2,
        eventsCreated: 0,
        contextsCreated: 1,
      }
      const sseText = `event: done\ndata: ${JSON.stringify(summary)}\n\n`

      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        text: async () => sseText,
        body: null,
      } as unknown as Response)

      const result = await studyPlannerApi.process()
      expect(result).toEqual(summary)
    })

    it('process wrapper rejects on error event', async () => {
      const errorData = { status: 400, title: 'Bad Request', detail: 'Invalid request' }
      const sseText = `event: error\ndata: ${JSON.stringify(errorData)}\n\n`

      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        text: async () => sseText,
        body: null,
      } as unknown as Response)

      await expect(studyPlannerApi.process()).rejects.toThrow('Invalid request')
    })

    it('streamProcess decodes ReadableStream chunks across chunk boundaries', async () => {
      const summary: ProcessSummaryResponse = {
        tasksCreated: 4,
        eventsCreated: 2,
        contextsCreated: 1,
      }
      // Split the frame inside the event name, so the parser must carry the tail to the next chunk.
      const chunk1 = new TextEncoder().encode('event: do')
      const chunk2 = new TextEncoder().encode(`ne\ndata: ${JSON.stringify(summary)}\n\n`)

      let readIndex = 0
      const mockReader = {
        read: vi
          .fn<() => Promise<{ done: boolean; value: Uint8Array | undefined }>>()
          .mockImplementation(async () => {
            if (readIndex === 0) {
              readIndex++
              return { done: false, value: chunk1 }
            }
            if (readIndex === 1) {
              readIndex++
              return { done: false, value: chunk2 }
            }
            return { done: true, value: undefined }
          }),
      }

      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: {
          getReader: () => mockReader,
        },
      } as unknown as Response)

      const onDone = vi.fn<(summary: ProcessSummaryResponse) => void>()
      await studyPlannerApi.streamProcess({ onDone })

      expect(onDone).toHaveBeenCalledWith(summary)
    })

    it('process wrapper rejects when stream ends without completion event', async () => {
      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        text: async () => '',
        body: null,
      } as unknown as Response)

      await expect(studyPlannerApi.process()).rejects.toThrow(
        'Stream ended without completion event',
      )
    })

    it('streamProcess routes init and progress events and ignores ping comments', async () => {
      const status: PlannerStatusResponse = {
        hasPendingNotes: true,
        dirtyNoteCount: 2,
        dirtyDates: ['2026-10-01', '2026-10-03'],
        courseNames: ['CS101'],
        pendingNotes: [],
      }
      const progress = { date: '2026-10-01', index: 1, total: 2 }
      const summary: ProcessSummaryResponse = {
        tasksCreated: 1,
        eventsCreated: 0,
        contextsCreated: 0,
      }
      const sseText =
        `event: init\ndata: ${JSON.stringify(status)}\n\n` +
        // Heartbeat comment frame. The backend sends one at a fixed interval.
        `:ping\n\n` +
        `event: progress\ndata: ${JSON.stringify(progress)}\n\n` +
        `event: done\ndata: ${JSON.stringify(summary)}\n\n`

      globalThis.fetch = vi.fn<typeof fetch>().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        text: async () => sseText,
        body: null,
      } as unknown as Response)

      const onInit = vi.fn<(s: PlannerStatusResponse) => void>()
      const onProgress = vi.fn<(p: ProcessProgressEvent) => void>()
      const onDone = vi.fn<(s: ProcessSummaryResponse) => void>()
      const onError = vi.fn<(error: unknown) => void>()

      await studyPlannerApi.streamProcess({ onDone, onError, onInit, onProgress })

      expect(onInit).toHaveBeenCalledWith(status)
      expect(onProgress).toHaveBeenCalledWith(progress)
      expect(onDone).toHaveBeenCalledWith(summary)
      expect(onError).not.toHaveBeenCalled()
      expect(onInit).toHaveBeenCalledTimes(1)
      expect(onProgress).toHaveBeenCalledTimes(1)
    })

    it('streamProcess passes signal to fetch and swallows abort errors silently', async () => {
      const controller = new AbortController()
      controller.abort()

      // Real `fetch` rejects with an AbortError when the signal is already aborted.
      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockRejectedValue(new DOMException('aborted', 'AbortError'))

      const onDone = vi.fn<(s: ProcessSummaryResponse) => void>()
      const onError = vi.fn<(error: unknown) => void>()

      await studyPlannerApi.streamProcess({ onDone, onError, signal: controller.signal })

      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/study-planner/process',
        expect.objectContaining({ signal: controller.signal }),
      )
      expect(onDone).not.toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })

    it('process rejects with the AbortError when aborted', async () => {
      const controller = new AbortController()
      controller.abort()

      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockRejectedValue(new DOMException('aborted', 'AbortError'))

      // process() rejects with `signal.reason`, not with the error from `fetch`.
      await expect(studyPlannerApi.process(controller.signal)).rejects.toBe(
        controller.signal.reason,
      )
      expect((controller.signal.reason as DOMException).name).toBe('AbortError')
    })
  })

  describe('imagesApi', () => {
    it('calls upload with file', async () => {
      const file = new File(['content'], 'diagram.png', { type: 'image/png' })
      const mockResponse: ImageUploadResponse = {
        id: 'img-10',
        url: '/api/images/img-10',
        contentType: 'image/png',
        size: 1024,
        createdAt: '2026-10-08T00:00:00Z',
      }
      const uploadSpy = vi.spyOn(apiClient, 'upload').mockResolvedValue(mockResponse)

      const result = await imagesApi.upload(file)
      expect(result).toEqual(mockResponse)
      expect(uploadSpy).toHaveBeenCalledWith('/api/images', file)
    })

    it('getImageUrl formats image URL path', () => {
      const url = imagesApi.getImageUrl('img-10')
      expect(url).toBe('/api/images/img-10')
    })

    it('calls delete with image id', async () => {
      const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined)

      await imagesApi.delete('img-10')
      expect(deleteSpy).toHaveBeenCalledWith('/api/images/img-10')
    })
  })
})
