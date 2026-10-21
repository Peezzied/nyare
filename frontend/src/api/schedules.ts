import { apiClient } from './client'
import type { DayOfWeek, ScheduleRequest, ScheduleResponse } from '@/types/api'

/** Server-side filters for `GET /api/schedules`. */
export interface ScheduleListParams {
  courseId?: number
  day?: DayOfWeek
  /** `true` returns schedules of archived courses only. `false` returns schedules of active courses. */
  archived?: boolean
}

/** API service for recurring weekly class meetings. */
export const schedulesApi = {
  /** Lists class meetings with `GET /api/schedules`. */
  list(params?: ScheduleListParams): Promise<ScheduleResponse[]> {
    return apiClient.get<ScheduleResponse[]>('/api/schedules', params)
  },

  /**
   * Fetches one class meeting with `GET /api/schedules/{id}`.
   * @throws ApiError with status 404 when the meeting does not exist.
   */
  get(id: number): Promise<ScheduleResponse> {
    return apiClient.get<ScheduleResponse>(`/api/schedules/${id}`)
  },

  /**
   * Creates a class meeting with `POST /api/schedules`.
   * @returns the saved DTO.
   */
  create(request: ScheduleRequest): Promise<ScheduleResponse> {
    return apiClient.post<ScheduleResponse>('/api/schedules', request)
  },

  /**
   * Replaces a class meeting with `PUT /api/schedules/{id}`.
   * @returns the saved DTO.
   */
  update(id: number, request: ScheduleRequest): Promise<ScheduleResponse> {
    return apiClient.put<ScheduleResponse>(`/api/schedules/${id}`, request)
  },

  /** Deletes a class meeting with `DELETE /api/schedules/{id}`. */
  delete(id: number): Promise<void> {
    return apiClient.delete(`/api/schedules/${id}`)
  },
}
