/**
 * Strict TypeScript definitions of Nyare backend DTOs and entities.
 * Parity target: Spring Boot 4.1.1 and Jackson 3 JSON serialization.
 */

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED'

export type PlanCategory = 'SCHEDULED' | 'LATER' | 'BACKLOG'

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

export interface UserResponse {
  readonly id: number
  readonly username: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface UserRequest {
  readonly username: string
}

export interface LoginRequest {
  readonly username: string
}

export interface CourseResponse {
  readonly id: number
  readonly name: string
  readonly description?: string | null
  readonly userId?: number | null
}

export interface CourseRequest {
  readonly name: string
  readonly description?: string | null
  readonly userId?: number | null
}

export interface ScheduleResponse {
  readonly id: number
  readonly courseId: number
  readonly day: DayOfWeek
  readonly startTime: string
  readonly endTime: string
}

export interface ScheduleRequest {
  readonly courseId: number
  readonly day: DayOfWeek
  readonly startTime: string
  readonly endTime: string
}

export interface NoteResponse {
  readonly id: string
  readonly courseId: number
  readonly title: string
  readonly content: string
  readonly entryDate: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly lastProcessedAt?: string | null
}

export interface NoteSummaryResponse {
  readonly id: string
  readonly courseId: number
  readonly title: string
  readonly preview: string
  readonly truncated: boolean
  readonly contentLength: number
  readonly entryDate: string
  readonly createdAt: string
  readonly updatedAt: string
}

export interface NoteRequest {
  readonly courseId: number
  readonly title?: string | null
  readonly content: string
  readonly entryDate?: string | null
}

export interface TaskResponse {
  readonly id: string
  readonly courseId: number
  readonly noteId?: string | null
  readonly title: string
  readonly description?: string | null
  readonly scheduledDate?: string | null
  readonly duration?: string | null
  readonly status: TaskStatus
  readonly planCategory?: PlanCategory | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface TaskRequest {
  readonly courseId: number
  readonly title: string
  readonly description?: string | null
  readonly scheduledDate?: string | null
  readonly duration?: string | null
  readonly status?: TaskStatus | null
}

export interface TaskStatusRequest {
  readonly status: TaskStatus
}

export interface AcademicEventResponse {
  readonly id: string
  readonly courseId: number
  readonly noteId?: string | null
  readonly title: string
  readonly description?: string | null
  readonly deadline: string
  readonly createdAt: string
}

export interface AcademicEventRequest {
  readonly courseId: number
  readonly noteId?: string | null
  readonly title: string
  readonly description?: string | null
  readonly deadline: string
}

export interface AcademicContextResponse {
  readonly id: string
  readonly courseId: number
  readonly noteId?: string | null
  readonly value: string
  readonly createdAt: string
}

export interface ImageUploadResponse {
  readonly id: string
  readonly url: string
  readonly contentType: string
  readonly size: number
  readonly createdAt: string
}

export interface PendingNoteSummary {
  readonly id: string
  readonly title: string | null
  readonly courseName: string | null
  readonly entryDate: string
}

export interface PlannerStatusResponse {
  readonly hasPendingNotes: boolean
  readonly dirtyNoteCount: number
  readonly dirtyDates: string[]
  readonly courseNames: string[]
  readonly pendingNotes: PendingNoteSummary[]
}

export interface ProcessProgressEvent {
  readonly date: string
  readonly index: number
  readonly total: number
}

export interface ProcessSummaryResponse {
  readonly tasksCreated: number
  readonly eventsCreated: number
  readonly contextsCreated: number
  readonly affectedCourseIds?: number[]
}
