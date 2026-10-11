import { apiClient } from './client'
import type { TaskRequest, TaskResponse, TaskStatus, TaskStatusRequest } from '@/types/api'

export interface TaskListParams {
  courseId?: number
  status?: TaskStatus
  scheduled?: boolean
}

export const tasksApi = {
  list(params?: TaskListParams): Promise<TaskResponse[]> {
    return apiClient.get<TaskResponse[]>('/api/tasks', params)
  },

  get(id: string): Promise<TaskResponse> {
    return apiClient.get<TaskResponse>(`/api/tasks/${id}`)
  },

  create(request: TaskRequest): Promise<TaskResponse> {
    return apiClient.post<TaskResponse>('/api/tasks', request)
  },

  update(id: string, request: TaskRequest): Promise<TaskResponse> {
    return apiClient.put<TaskResponse>(`/api/tasks/${id}`, request)
  },

  updateStatus(id: string, request: TaskStatusRequest | TaskStatus): Promise<TaskResponse> {
    const body: TaskStatusRequest = typeof request === 'string' ? { status: request } : request
    return apiClient.patch<TaskResponse>(`/api/tasks/${id}/status`, body)
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/api/tasks/${id}`)
  },
}
