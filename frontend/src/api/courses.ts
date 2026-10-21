import { apiClient } from './client'
import type { CourseRequest, CourseResponse, UnarchiveRequest } from '@/types/api'

/** Server-side filters for `GET /api/courses`. */
export interface CourseListParams {
  userId?: number
  /** `true` returns archived courses only. `false` returns active courses. */
  archived?: boolean
}

/** API service for courses. */
export const coursesApi = {
  /** Lists courses with `GET /api/courses`. The backend scopes them to the session user. */
  list(params?: CourseListParams): Promise<CourseResponse[]> {
    return apiClient.get<CourseResponse[]>('/api/courses', params)
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

  /**
   * Archives a course with `POST /api/courses/{id}/archive`.
   * @returns the saved DTO.
   * @throws ApiError with status 404 when the course does not exist.
   */
  archive(id: number): Promise<CourseResponse> {
    return apiClient.post<CourseResponse>(`/api/courses/${id}/archive`)
  },

  /**
   * Restores an archived course with `POST /api/courses/{id}/unarchive`.
   * @returns the saved DTO.
   * @throws ApiError with status 404 when the course does not exist.
   */
  unarchive(id: number): Promise<CourseResponse> {
    return apiClient.post<CourseResponse>(`/api/courses/${id}/unarchive`)
  },

  /**
   * Archives every active course in one call with `POST /api/courses/archive-all`.
   * @returns the archived DTOs, each stamped with one shared `archivedAt`.
   */
  archiveAll(): Promise<CourseResponse[]> {
    return apiClient.post<CourseResponse[]>('/api/courses/archive-all')
  },

  /**
   * Restores archived courses in one call with `POST /api/courses/unarchive`.
   * @returns the saved DTOs.
   * @throws ApiError with status 404 when a course id is unknown or foreign.
   */
  unarchiveMany(ids: number[]): Promise<CourseResponse[]> {
    const request: UnarchiveRequest = { courseIds: ids }
    return apiClient.post<CourseResponse[]>('/api/courses/unarchive', request)
  },
}
