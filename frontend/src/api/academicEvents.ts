import { apiClient } from './client'
import type { AcademicEventRequest, AcademicEventResponse } from '@/types/api'

export interface AcademicEventListParams {
  courseId?: number
  upcoming?: boolean
}

export const academicEventsApi = {
  list(params?: AcademicEventListParams): Promise<AcademicEventResponse[]> {
    return apiClient.get<AcademicEventResponse[]>('/api/academic-events', params)
  },

  get(id: string): Promise<AcademicEventResponse> {
    return apiClient.get<AcademicEventResponse>(`/api/academic-events/${id}`)
  },

  create(request: AcademicEventRequest): Promise<AcademicEventResponse> {
    return apiClient.post<AcademicEventResponse>('/api/academic-events', request)
  },

  update(id: string, request: AcademicEventRequest): Promise<AcademicEventResponse> {
    return apiClient.put<AcademicEventResponse>(`/api/academic-events/${id}`, request)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/academic-events/${id}`)
  },
}
