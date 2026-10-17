import { ref } from 'vue'
import type { Ref } from 'vue'
import { ApiError, authApi } from '@/api'
import type { UserResponse } from '@/types/api'

/** Session user, or `null` while no valid linked user session exists. */
const user: Ref<UserResponse | null> = ref(null)

/** Tracks whether the session check already concluded for this app load. */
let sessionChecked = false

/**
 * Checks the session once per app load via `GET /api/users/me`.
 * The browser sends the session cookie through `credentials: 'include'` (see `apiClient`).
 * A `401` confirms no session. Network or server failures leave the session state
 * unknown: the result is not cached, so the next navigation retries the check.
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
    return user.value
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
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
}

/** Clears the whole session state: the user and the concluded-check marker. */
export function clearSessionUser(): void {
  user.value = null
  sessionChecked = false
}

/** Exposes the shared session state for components. */
export function useAuth(): {
  user: Ref<UserResponse | null>
  ensureSession: () => Promise<UserResponse | null | undefined>
  setSessionUser: (next: UserResponse) => void
  clearSessionUser: () => void
} {
  return { user, ensureSession, setSessionUser, clearSessionUser }
}
