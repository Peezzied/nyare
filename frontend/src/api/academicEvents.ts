import { apiClient } from './client'
import type { AcademicEventRequest, AcademicEventResponse } from '@/types/api'

/** Server-side filters for `GET /api/academic-events`. */
export interface AcademicEventListParams {
  courseId?: number
  /** `true` returns only events with a deadline at or after the current time. */
  upcoming?: boolean
}

/** API service for academic events and deadlines. */
export const academicEventsApi = {
  /** Lists events with `GET /api/academic-events`. */
  list(params?: AcademicEventListParams): Promise<AcademicEventResponse[]> {
    return apiClient.get<AcademicEventResponse[]>('/api/academic-events', params)
  },

  /**
   * Fetches one event with `GET /api/academic-events/{id}`.
   * @throws ApiError with status 404 when the event does not exist.
   */
  get(id: string): Promise<AcademicEventResponse> {
    return apiClient.get<AcademicEventResponse>(`/api/academic-events/${id}`)
  },

  /**
   * Creates an event with `POST /api/academic-events`.
   * @returns the saved DTO.
   * @throws ApiError with a ProblemDetail when validation fails.
   */
  create(request: AcademicEventRequest): Promise<AcademicEventResponse> {
    return apiClient.post<AcademicEventResponse>('/api/academic-events', request)
  },

  /**
   * Replaces an event with `PUT /api/academic-events/{id}`.
   * @returns the saved DTO.
   * @throws ApiError with a ProblemDetail when the event does not exist or validation fails.
   */
  update(id: string, request: AcademicEventRequest): Promise<AcademicEventResponse> {
    return apiClient.put<AcademicEventResponse>(`/api/academic-events/${id}`, request)
  },

  /** Deletes an event with `DELETE /api/academic-events/{id}`. */
  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/academic-events/${id}`)
  },
}
