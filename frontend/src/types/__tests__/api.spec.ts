import { describe, it, expect } from 'vitest'
import type {
  TaskResponse,
  TaskRequest,
  TaskStatusRequest,
  AcademicEventResponse,
  AcademicEventRequest,
  AcademicContextResponse,
  ProcessSummaryResponse,
  ImageUploadResponse,
  NoteResponse,
  NoteSummaryResponse,
  NoteRequest,
  CourseResponse,
  CourseRequest,
  ScheduleResponse,
  ScheduleRequest,
  UserResponse,
  UserRequest,
  LoginRequest,
  ProblemDetail,
  TaskStatus,
  PlanCategory,
  DayOfWeek,
} from '../api'

describe('API Types Contract', () => {
  it('instantiates valid TaskResponse object matching Spring DTO', () => {
    const task: TaskResponse = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      courseId: 1,
      noteId: null,
      title: 'Review Chapter 4',
      description: 'Study for upcoming quiz',
      scheduledDate: '2026-10-12',
      duration: 'PT1H30M',
      status: 'TODO',
      planCategory: 'SCHEDULED',
      createdAt: '2026-10-08T10:00:00Z',
      updatedAt: '2026-10-08T10:00:00Z',
    }
    expect(task.status).toBe('TODO')
    expect(task.planCategory).toBe('SCHEDULED')
    expect(task.duration).toBe('PT1H30M')
  })

  it('instantiates valid TaskRequest and TaskStatusRequest', () => {
    const request: TaskRequest = {
      courseId: 1,
      title: 'Finish lab exercises',
      description: 'Exercises 1 to 5',
      scheduledDate: '2026-10-14',
      duration: 'PT2H',
      status: 'IN_PROGRESS',
    }
    const statusRequest: TaskStatusRequest = {
      status: 'COMPLETED',
    }
    expect(request.title).toBe('Finish lab exercises')
    expect(statusRequest.status).toBe('COMPLETED')
  })

  it('instantiates valid ProblemDetail matching RFC 7807', () => {
    const error: ProblemDetail = {
      type: 'about:blank',
      title: 'Bad Request',
      status: 400,
      detail: 'Course ID is required',
      instance: '/api/tasks',
    }
    expect(error.status).toBe(400)
    expect(error.title).toBe('Bad Request')
  })

  it('instantiates valid User, Course, and Schedule contracts', () => {
    const user: UserResponse = {
      id: 10,
      username: 'student1',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    }
    const userReq: UserRequest = { username: 'student1' }
    const loginReq: LoginRequest = { username: 'student1' }

    const course: CourseResponse = {
      id: 1,
      name: 'CS101',
      description: 'Intro to Computer Science',
      userId: 10,
    }
    const courseReq: CourseRequest = {
      name: 'CS101',
      description: 'Intro to Computer Science',
      userId: 10,
    }

    const schedule: ScheduleResponse = {
      id: 5,
      courseId: 1,
      day: 'MONDAY',
      startTime: '09:00:00',
      endTime: '10:30:00',
    }
    const scheduleReq: ScheduleRequest = {
      courseId: 1,
      day: 'MONDAY',
      startTime: '09:00:00',
      endTime: '10:30:00',
    }

    expect(user.username).toBe('student1')
    expect(userReq.username).toBe('student1')
    expect(loginReq.username).toBe('student1')
    expect(course.id).toBe(1)
    expect(courseReq.name).toBe('CS101')
    expect(schedule.day).toBe('MONDAY')
    expect(scheduleReq.startTime).toBe('09:00:00')
  })

  it('instantiates valid Note contracts and summary', () => {
    const note: NoteResponse = {
      id: 'note-uuid-1',
      courseId: 1,
      title: 'Lecture notes',
      content: '# Lecture notes',
      entryDate: '2026-10-08',
      createdAt: '2026-10-08T09:00:00Z',
      updatedAt: '2026-10-08T09:30:00Z',
      lastProcessedAt: null,
    }
    const summary: NoteSummaryResponse = {
      id: 'note-uuid-1',
      courseId: 1,
      title: 'Lecture notes',
      preview: 'Lecture notes preview',
      truncated: false,
      contentLength: 15,
      entryDate: '2026-10-08',
      createdAt: '2026-10-08T09:00:00Z',
      updatedAt: '2026-10-08T09:30:00Z',
    }
    const noteReq: NoteRequest = {
      courseId: 1,
      title: 'Lecture notes',
      content: '# Lecture notes',
      entryDate: '2026-10-08',
    }

    expect(note.content).toContain('Lecture notes')
    expect(note.title).toBe('Lecture notes')
    expect(note.entryDate).toBe('2026-10-08')
    expect(summary.truncated).toBe(false)
    expect(noteReq.courseId).toBe(1)
  })

  it('instantiates valid AcademicEvent and AcademicContext contracts', () => {
    const event: AcademicEventResponse = {
      id: 'event-uuid-1',
      courseId: 1,
      noteId: 'note-uuid-1',
      title: 'Midterm Exam',
      description: 'Covers chapters 1 to 5',
      deadline: '2026-10-20T14:00:00',
      createdAt: '2026-10-08T09:00:00Z',
    }
    const eventReq: AcademicEventRequest = {
      courseId: 1,
      noteId: null,
      title: 'Midterm Exam',
      description: null,
      deadline: '2026-10-20T14:00:00',
    }
    const context: AcademicContextResponse = {
      id: 'context-uuid-1',
      courseId: 1,
      noteId: 'note-uuid-1',
      value: 'Student struggles with tree traversal',
      createdAt: '2026-10-08T09:00:00Z',
    }

    expect(event.deadline).toBe('2026-10-20T14:00:00')
    expect(eventReq.title).toBe('Midterm Exam')
    expect(context.value).toContain('tree traversal')
  })

  it('instantiates valid ImageUpload and ProcessSummary contracts', () => {
    const image: ImageUploadResponse = {
      id: 'img-uuid-1',
      url: '/uploads/board.png',
      contentType: 'image/png',
      size: 204800,
      createdAt: '2026-10-08T10:00:00Z',
    }
    const processSummary: ProcessSummaryResponse = {
      tasksCreated: 3,
      eventsCreated: 1,
      contextsCreated: 2,
    }

    expect(image.size).toBe(204800)
    expect(processSummary.tasksCreated).toBe(3)
  })

  it('validates enum union assignments', () => {
    const status: TaskStatus = 'TODO'
    const planCategory: PlanCategory = 'BACKLOG'
    const day: DayOfWeek = 'FRIDAY'

    expect(status).toBe('TODO')
    expect(planCategory).toBe('BACKLOG')
    expect(day).toBe('FRIDAY')
  })
})
