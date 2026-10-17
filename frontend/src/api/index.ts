// Single import point for the HTTP client, the per-resource API services, and the DTO types.
export { apiClient, ApiError, setMockHandler } from './client'
export type { MockHandler } from './client'

export { authApi, getDevUser } from './auth'
export { coursesApi } from './courses'
export { schedulesApi } from './schedules'
export type { ScheduleListParams } from './schedules'
export { notesApi } from './notes'
export { tasksApi } from './tasks'
export type { TaskListParams } from './tasks'
export { academicEventsApi } from './academicEvents'
export type { AcademicEventListParams } from './academicEvents'
export { studyPlannerApi } from './studyPlanner'
export type { StreamProcessCallbacks } from './studyPlanner'
export { imagesApi } from './images'

export * from '@/types/api'
