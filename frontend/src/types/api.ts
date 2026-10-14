/**
 * Strict TypeScript definitions of Nyare backend DTOs and entities.
 * Parity target: Spring Boot 4.1.1 and Jackson 3 JSON serialization.
 */

/** Progress state of a task. */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

/**
 * Tri-state plan category of a task. The value is derived, not stored.
 * `SCHEDULED` has a `scheduledDate`. `LATER` has only a `duration`. `BACKLOG` has neither.
 */
export type PlanCategory = 'SCHEDULED' | 'LATER' | 'BACKLOG'

/** Day of the week in the Java `DayOfWeek` enum format. */
export type DayOfWeek =
  'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

/** RFC 7807 Problem Details representation emitted by GlobalExceptionHandler. */
export interface ProblemDetail {
  readonly type?: string
  readonly title: string
  readonly status: number
  readonly detail: string
  readonly instance?: string
  readonly [key: string]: unknown
}

/** User account returned by the `/api/users` endpoints. */
export interface UserResponse {
  readonly id: number
  readonly username: string
  /** ISO-8601 UTC timestamp. */
  readonly createdAt: string
  /** ISO-8601 UTC timestamp. */
  readonly updatedAt: string
}

/** Request body to register a user with `POST /api/users`. */
export interface UserRequest {
  readonly username: string
}

/** Request body to start a session with `POST /api/users/login`. */
export interface LoginRequest {
  readonly username: string
}

/** Academic course that owns schedules, notes, tasks, and events. */
export interface CourseResponse {
  readonly id: number
  readonly name: string
  readonly description?: string | null
  /** ID of the user that owns the course. */
  readonly userId?: number | null
}

/** Request body to create a course with `POST /api/courses`. */
export interface CourseRequest {
  readonly name: string
  readonly description?: string | null
  /** Owner user ID. The backend uses it only when no session user exists. */
  readonly userId?: number | null
}

/** Recurring weekly class meeting of a course. */
export interface ScheduleResponse {
  readonly id: number
  readonly courseId: number
  readonly day: DayOfWeek
  /** ISO local time of day, such as `09:00` or `09:00:00`. */
  readonly startTime: string
  /** ISO local time of day, such as `10:30` or `10:30:00`. */
  readonly endTime: string
}

/** Request body to create or replace a class meeting. */
export interface ScheduleRequest {
  readonly courseId: number
  readonly day: DayOfWeek
  /** ISO local time of day, such as `09:00:00`. */
  readonly startTime: string
  /** ISO local time of day, such as `10:30:00`. */
  readonly endTime: string
}

/** Full course-linked journal entry with its complete content. */
export interface NoteResponse {
  readonly id: string
  readonly courseId: number
  readonly title: string
  readonly content: string
  /** Academic date of the entry as ISO date `YYYY-MM-DD`. */
  readonly entryDate: string
  /** ISO-8601 UTC timestamp. */
  readonly createdAt: string
  /** ISO-8601 UTC timestamp. A value after `lastProcessedAt` makes the note dirty. */
  readonly updatedAt: string
  /**
   * ISO-8601 UTC timestamp of the last Process run on this note.
   * `null` means Process did not handle the note yet, so the note is dirty.
   */
  readonly lastProcessedAt?: string | null
}

/** List view of a note with a content preview instead of the full content. */
export interface NoteSummaryResponse {
  readonly id: string
  readonly courseId: number
  readonly title: string
  /** First part of the content. The backend cuts it at 200 characters. */
  readonly preview: string
  /** `true` when `preview` is shorter than the full content. */
  readonly truncated: boolean
  /** Character count of the full content. */
  readonly contentLength: number
  /** Academic date of the entry as ISO date `YYYY-MM-DD`. */
  readonly entryDate: string
  readonly createdAt: string
  readonly updatedAt: string
}

/** Request body to create or update a note. */
export interface NoteRequest {
  readonly courseId: number
  /** Blank or omitted values make the backend compute a fallback title from the content. */
  readonly title?: string | null
  readonly content: string
  /**
   * ISO date `YYYY-MM-DD`. On create, an omitted value means today.
   * On update, an omitted value keeps the stored date.
   */
  readonly entryDate?: string | null
}

/**
 * Actionable task of a course.
 * The virtual StudyPlan view groups tasks by the derived `planCategory`.
 */
export interface TaskResponse {
  readonly id: string
  readonly courseId: number
  /** Source note of the task. `null` means no note produced the task. */
  readonly noteId?: string | null
  readonly title: string
  readonly description?: string | null
  /** Recommended work day as ISO date `YYYY-MM-DD`. `null` means no planned day. */
  readonly scheduledDate?: string | null
  /** ISO-8601 duration such as `PT1H30M`. `null` means the effort is unknown. */
  readonly duration?: string | null
  readonly status: TaskStatus
  /** Derived from `scheduledDate` and `duration`. Use `getPlanCategory()` when this is absent. */
  readonly planCategory?: PlanCategory | null
  readonly createdAt: string
  readonly updatedAt: string
}

/** Request body to create or replace a task. */
export interface TaskRequest {
  readonly courseId: number
  readonly title: string
  readonly description?: string | null
  /** ISO date `YYYY-MM-DD`. */
  readonly scheduledDate?: string | null
  /** ISO-8601 duration such as `PT1H30M`. */
  readonly duration?: string | null
  readonly status?: TaskStatus | null
}

/** Request body for `PATCH /api/tasks/{id}/status`. */
export interface TaskStatusRequest {
  readonly status: TaskStatus
}

/** Fixed time-anchored occurrence of a course, such as an exam or a submission deadline. */
export interface AcademicEventResponse {
  readonly id: string
  readonly courseId: number
  /** Source note of the event. `null` means no note produced the event. */
  readonly noteId?: string | null
  readonly title: string
  readonly description?: string | null
  /** ISO local date-time such as `2026-10-22T09:00:00`, without a time zone. */
  readonly deadline: string
  readonly createdAt: string
}

/** Request body to create or replace an academic event. */
export interface AcademicEventRequest {
  readonly courseId: number
  readonly noteId?: string | null
  readonly title: string
  readonly description?: string | null
  /** ISO local date-time such as `2026-10-22T09:00:00`, without a time zone. */
  readonly deadline: string
}

/** Academic fact that Process extracts from a journal note. */
export interface AcademicContextResponse {
  readonly id: string
  readonly courseId: number
  readonly noteId?: string | null
  /** Text of the extracted fact. */
  readonly value: string
  readonly createdAt: string
}

/** Metadata of an image that `POST /api/images` stores. */
export interface ImageUploadResponse {
  readonly id: string
  readonly url: string
  readonly contentType: string
  /** File size in bytes. */
  readonly size: number
  readonly createdAt: string
}

/** Short description of one dirty note that waits for Process. */
export interface PendingNoteSummary {
  readonly id: string
  readonly title: string | null
  readonly courseName: string | null
  /** ISO date `YYYY-MM-DD`. */
  readonly entryDate: string
}

/** Pending dirty note state from `GET /api/study-planner/status`. */
export interface PlannerStatusResponse {
  readonly hasPendingNotes: boolean
  readonly dirtyNoteCount: number
  /** Distinct entry dates of dirty notes as ISO dates `YYYY-MM-DD`, in ascending order. */
  readonly dirtyDates: string[]
  /** Distinct names of courses with dirty notes, in sorted order. */
  readonly courseNames: string[]
  readonly pendingNotes: PendingNoteSummary[]
}

/** Payload of the SSE `progress` event. Process sends one when it starts each dirty date. */
export interface ProcessProgressEvent {
  /** Dirty date that Process starts now, as ISO date `YYYY-MM-DD`. */
  readonly date: string
  /** 1-based position of `date` in the run. */
  readonly index: number
  /** Count of dirty dates in the run. */
  readonly total: number
}

/** Payload of the SSE `done` event with the counts of entities that Process created. */
export interface ProcessSummaryResponse {
  readonly tasksCreated: number
  readonly eventsCreated: number
  readonly contextsCreated: number
  /**
   * IDs of courses that the run processed.
   * The client refetches tasks and events for these courses only.
   */
  readonly affectedCourseIds?: number[]
}
