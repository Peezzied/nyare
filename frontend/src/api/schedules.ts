import { apiClient } from './client'
import type { DayOfWeek, ScheduleRequest, ScheduleResponse } from '@/types/api'

export interface ScheduleListParams {
  courseId?: number
  day?: DayOfWeek
}

export const schedulesApi = {
  list(params?: ScheduleListParams): Promise<ScheduleResponse[]> {
    return apiClient.get<ScheduleResponse[]>('/api/schedules', params)
  },

  get(id: number): Promise<ScheduleResponse> {
    return apiClient.get<ScheduleResponse>(`/api/schedules/${id}`)
  },

  create(request: ScheduleRequest): Promise<ScheduleResponse> {
    return apiClient.post<ScheduleResponse>('/api/schedules', request)
  },

  update(id: number, request: ScheduleRequest): Promise<ScheduleResponse> {
    return apiClient.put<ScheduleResponse>(`/api/schedules/${id}`, request)
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/api/schedules/${id}`)
  },
}
