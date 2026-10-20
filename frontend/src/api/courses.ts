import { apiClient } from './client'
import type { CourseRequest, CourseResponse } from '@/types/api'

/** API service for courses. */
export const coursesApi = {
  /** Lists courses with `GET /api/courses`. The backend scopes them to the session user. */
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

  /**
   * Replaces a course with `PUT /api/courses/{id}`.
   * @returns the saved DTO.
   * @throws ApiError with status 404 when the course does not exist.
   */
  update(id: number, request: CourseRequest): Promise<CourseResponse> {
    return apiClient.put<CourseResponse>(`/api/courses/${id}`, request)
  },

  /** Deletes a course with `DELETE /api/courses/{id}`. */
  delete(id: number): Promise<void> {
    return apiClient.delete(`/api/courses/${id}`)
  },
}
