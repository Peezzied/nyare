import { apiClient } from './client'
import type { LoginRequest, UserRequest, UserResponse } from '@/types/api'

/** API service for users and the session login state. */
export const authApi = {
  /**
   * Starts a session for the username with `POST /api/users/login`.
   * The backend sets a session cookie. No password exists.
   * @throws ApiError with status 404 when no user has the username.
   */
  login(request: LoginRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/api/users/login', request)
  },

  /** Ends the current session with `POST /api/users/logout`. */
  logout(): Promise<void> {
    return apiClient.post<void>('/api/users/logout')
  },

  /**
   * Fetches the session user with `GET /api/users/me`.
   * @throws ApiError with status 401 when no session exists.
   */
  getCurrentUser(): Promise<UserResponse> {
    return apiClient.get<UserResponse>('/api/users/me')
  },

  /**
   * Creates a user with `POST /api/users`. This call does not start a session.
   * @returns the saved DTO.
   */
  register(request: UserRequest): Promise<UserResponse> {
    return apiClient.post<UserResponse>('/api/users', request)
  },

  /** Lists all users with `GET /api/users`. */
  listUsers(): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>('/api/users')
  },

  /**
   * Fetches one user with `GET /api/users/{id}`.
   * @throws ApiError with status 404 when the user does not exist.
   */
  getUser(id: number): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/api/users/${id}`)
  },

  /**
   * Deletes a user with `DELETE /api/users/{id}`.
   * The backend ends the session when the deleted user is the session user.
   * @throws ApiError with status 404 when the user does not exist.
   */
  deleteUser(id: number): Promise<void> {
    return apiClient.delete(`/api/users/${id}`)
  },
}
