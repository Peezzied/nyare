import { ref } from 'vue'
import type { Ref } from 'vue'
import { ApiError, authApi } from '@/api'
import { getDevUser } from '@/api/auth'
import type { UserResponse } from '@/types/api'

/** Session user, or `null` while no valid linked user session exists. */
const user: Ref<UserResponse | null> = ref(null)

/** Tracks whether the session check already concluded for this app load. */
let sessionChecked = false

/** Tracks whether the configured dev user is missing in the backend. */
const isDevUserMissing: Ref<boolean> = ref(false)

/**
 * Checks the session once per app load via `GET /api/users/me`.
 * The browser sends the session cookie through `credentials: 'include'` (see `apiClient`).
 * A `401` or `404` confirms no valid session. If VITE_DEV_USER is enabled in DEV,
 * it attempts to auto-login. If the dev user is missing from the database (404),
 * it marks isDevUserMissing as true.
 * @returns the session user, `null` when the backend confirmed no session,
 * or `undefined` when the session state could not be determined.
 */
export async function ensureSession(): Promise<UserResponse | null | undefined> {
  if (sessionChecked) {
    return user.value
  }
  try {
    user.value = await authApi.getCurrentUser()
    sessionChecked = true
    isDevUserMissing.value = false
    return user.value
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
      const devUser = getDevUser()
      if (devUser) {
        try {
          user.value = await authApi.login({ username: devUser })
          sessionChecked = true
          isDevUserMissing.value = false
          return user.value
        } catch (loginErr) {
          if (loginErr instanceof ApiError && loginErr.status === 404) {
            isDevUserMissing.value = true
          }
        }
      }
      sessionChecked = true
      user.value = null
      return null
    }
    return undefined
  }
}

/**
 * Stores the session user after a login or registration.
 * Marks the session as checked so the guard skips another `/me` roundtrip.
 * @param next the authenticated user DTO from the login or register call.
 */
export function setSessionUser(next: UserResponse): void {
  user.value = next
  sessionChecked = true
  isDevUserMissing.value = false
}

/** Clears the whole session state: the user and the concluded-check marker. */
export function clearSessionUser(): void {
  user.value = null
  sessionChecked = false
  isDevUserMissing.value = false
}

/** Exposes the shared session state for components. */
export function useAuth(): {
  user: Ref<UserResponse | null>
  isDevUserMissing: Ref<boolean>
  configuredDevUser: string
  ensureSession: () => Promise<UserResponse | null | undefined>
  setSessionUser: (next: UserResponse) => void
  clearSessionUser: () => void
} {
  return {
    user,
    isDevUserMissing,
    configuredDevUser: getDevUser() || 'dev_student',
    ensureSession,
    setSessionUser,
    clearSessionUser,
  }
}
