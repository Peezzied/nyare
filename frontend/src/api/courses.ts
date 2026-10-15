import { apiClient } from './client'
import type { CourseRequest, CourseResponse } from '@/types/api'

/**
 * API service for courses.
 * The backend has no update endpoint for courses.
 */
export const coursesApi = {
  /**
   * Lists courses with `GET /api/courses`.
   * The backend filters by the session user first. It uses `userId` only when no session exists.
   */
  list(userId?: number): Promise<CourseResponse[]> {
    return apiClient.get<CourseResponse[]>('/api/courses', { userId })
  },

  /**
   * Fetches one course with `GET /api/courses/{id}`.
   * @throws ApiError with status 404 when the course does not exist.
   */
  get(id: number): Promise<CourseResponse> {
    return apiClient.get<CourseResponse>(`/api/courses/${id}`)
  },

  /**
   * Creates a course with `POST /api/courses`.
   * @returns the saved DTO.
   * @throws ApiError with status 400 when the backend cannot resolve an owner user.
   */
  create(request: CourseRequest): Promise<CourseResponse> {
    return apiClient.post<CourseResponse>('/api/courses', request)
  },

  /** Deletes a course with `DELETE /api/courses/{id}`. */
  delete(id: number): Promise<void> {
    return apiClient.delete(`/api/courses/${id}`)
  },
}
