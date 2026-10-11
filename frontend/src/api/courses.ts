import { apiClient } from './client'
import type { CourseRequest, CourseResponse } from '@/types/api'

export const coursesApi = {
  list(userId?: number): Promise<CourseResponse[]> {
    return apiClient.get<CourseResponse[]>('/api/courses', { userId })
  },

  get(id: number): Promise<CourseResponse> {
    return apiClient.get<CourseResponse>(`/api/courses/${id}`)
  },

  create(request: CourseRequest): Promise<CourseResponse> {
    return apiClient.post<CourseResponse>('/api/courses', request)
  },

  delete(id: number): Promise<void> {
    return apiClient.delete(`/api/courses/${id}`)
  },
}
