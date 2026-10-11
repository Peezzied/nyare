import { apiClient } from './client'
import type { LoginRequest, UserRequest, UserResponse } from '@/types/api'

export const authApi = {
  login(request: LoginRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/api/users/login', request)
  },

  logout(): Promise<void> {
    return apiClient.post<void>('/api/users/logout')
  },

  getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/api/users/me')
  },

  register(request: UserRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/api/users', request)
  },

  listUsers(): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>('/api/users')
  },

  getUser(id: number): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/api/users/${id}`)
  },

  deleteUser(id: number): Promise<void> {
    return apiClient.delete(`/api/users/${id}`)
  },
}
