import { apiClient } from './client'
import type { TaskRequest, TaskResponse, TaskStatus, TaskStatusRequest } from '@/types/api'

/** Server-side filters for `GET /api/tasks`. */
export interface TaskListParams {
  courseId?: number
  status?: TaskStatus
  /** `true` returns tasks with a `scheduledDate`. `false` returns tasks without one. */
  scheduled?: boolean
  /** `true` returns tasks of archived courses only. `false` returns tasks of active courses. */
  archived?: boolean
}

/** API service for tasks. */
export const tasksApi = {
  /** Lists tasks with `GET /api/tasks`. */
  list(params?: TaskListParams): Promise<TaskResponse[]> {
    return apiClient.get<TaskResponse[]>('/api/tasks', params)
  },

  /**
   * Fetches one task with `GET /api/tasks/{id}`.
   * @throws ApiError with status 404 when the task does not exist.
   */
  get(id: string): Promise<TaskResponse> {
    return apiClient.get<TaskResponse>(`/api/tasks/${id}`)
  },

  /**
   * Creates a task with `POST /api/tasks`.
   * @returns the saved DTO.
   */
  create(request: TaskRequest): Promise<TaskResponse> {
    return apiClient.post<TaskResponse>('/api/tasks', request)
  },

  /**
   * Replaces a task with `PUT /api/tasks/{id}`.
   * @returns the saved DTO.
   */
  update(id: string, request: TaskRequest): Promise<TaskResponse> {
    return apiClient.put<TaskResponse>(`/api/tasks/${id}`, request)
  },

  /**
   * Changes only the task status with `PATCH /api/tasks/{id}/status`.
   * A bare status value goes in a `TaskStatusRequest` body.
   * @returns the saved DTO.
   */
  updateStatus(id: string, request: TaskStatusRequest | TaskStatus): Promise<TaskResponse> {
    const body: TaskStatusRequest = typeof request === 'string' ? { status: request } : request
    return apiClient.patch<TaskResponse>(`/api/tasks/${id}/status`, body)
  },

  /** Deletes a task with `DELETE /api/tasks/{id}`. */
  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/tasks/${id}`)
  },
}
