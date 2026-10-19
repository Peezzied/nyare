import { ApiError, apiClient } from './client'
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

  /** Returns the configured dev username when in development mode. */
  getDevUser(): string | undefined {
    return getDevUser()
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
   * Prohibited in development mode for the configured VITE_DEV_USER account.
   * @throws ApiError with status 404 when the user does not exist.
   */
  async deleteUser(id: number): Promise<void> {
    const devUser = getDevUser()
    if (devUser) {
      try {
        const user = await this.getUser(id)
        if (user.username === devUser) {
          throw new ApiError(400, `The ${devUser} account is protected and cannot be deleted.`)
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          throw err
        }
      }
    }
    return apiClient.delete(`/api/users/${id}`)
  },
}

/** Returns the configured dev username when in development mode. */
export function getDevUser(): string | undefined {
  return import.meta.env.DEV ? import.meta.env.VITE_DEV_USER || undefined : undefined
}
