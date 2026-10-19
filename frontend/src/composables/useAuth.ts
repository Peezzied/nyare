import { ref } from 'vue'
import type { Ref } from 'vue'
import { ApiError, authApi } from '@/api'
import { getDevUser } from '@/api/auth'
import { resetAllCaches } from './createCache'
import type { UserResponse } from '@/types/api'

/** Session user, or `null` while no valid linked user session exists. */
const user: Ref<UserResponse | null> = ref(null)

/** Tracks whether the session check already concluded for this app load. */
let sessionChecked = false

/** Tracks whether the configured dev user is missing in the backend. */
const isDevUserMissing: Ref<boolean> = ref(false)

/** The shared in-flight session check. Concurrent callers await the same promise. */
let sessionPromise: Promise<UserResponse | null | undefined> | null = null

/**
 * Checks the session once per app load via `GET /api/users/me`.
 * The browser sends the session cookie through `credentials: 'include'` (see `apiClient`).
 * A `401` or `404` confirms no valid session. If VITE_DEV_USER is enabled in DEV,
 * it attempts to auto-login. If the dev user is missing from the database (404),
 * it marks isDevUserMissing as true.
 * @returns the session user, `null` when the backend confirmed no session,
 * or `undefined` when the session state could not be determined.
 */
export function ensureSession(): Promise<UserResponse | null | undefined> {
  if (sessionChecked) {
    return Promise.resolve(user.value)
  }
  if (!sessionPromise) {
    sessionPromise = checkSession().finally(() => {
      sessionPromise = null
    })
  }
  return sessionPromise
}

async function checkSession(): Promise<UserResponse | null | undefined> {
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

/** Clears the whole session state, the in-flight check, and every data cache. */
export function clearSessionUser(): void {
  user.value = null
  sessionChecked = false
  isDevUserMissing.value = false
  sessionPromise = null
  resetAllCaches()
}

/**
 * Ends the session deliberately. Unlike `clearSessionUser`, the check stays
 * concluded so the next navigation does not re-probe `/me` and trigger the
 * dev auto-login, which would undo the sign-out.
 */
export function endSession(): void {
  user.value = null
  sessionChecked = true
  isDevUserMissing.value = false
  sessionPromise = null
  resetAllCaches()
}

/** Exposes the shared session state for components. */
export function useAuth(): {
  user: Ref<UserResponse | null>
  isDevUserMissing: Ref<boolean>
  configuredDevUser: string
  ensureSession: () => Promise<UserResponse | null | undefined>
  setSessionUser: (next: UserResponse) => void
  clearSessionUser: () => void
  endSession: () => void
} {
  return {
    user,
    isDevUserMissing,
    configuredDevUser: getDevUser() || 'dev_student',
    ensureSession,
    setSessionUser,
    clearSessionUser,
    endSession,
  }
}
