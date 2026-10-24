import { apiClient } from './client'
import type { UserSettings } from '@/types/api'

/** API service for the per-user planning horizon settings. */
export const settingsApi = {
  /** Fetches the session user's settings with `GET /api/settings`. */
  get(): Promise<UserSettings> {
    return apiClient.get<UserSettings>('/api/settings')
  },

  /**
   * Persists the session user's settings with `PUT /api/settings`.
   * @returns the saved DTO.
   * @throws ApiError with status 400 when a horizon is outside the 1-60 day bounds.
   */
  update(request: UserSettings): Promise<UserSettings> {
    return apiClient.put<UserSettings>('/api/settings', request)
  },
}
