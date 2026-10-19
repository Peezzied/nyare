import './cookieJarFetch'

// Clear the development interception before any api module reads it: an empty dev
// user lets `authApi.register()` through, and no mock adapter answers requests.
import.meta.env.VITE_DEV_USER = ''
import.meta.env.VITE_USE_MOCKS = 'false'

/** Origin of the backend the flow suite runs against. */
export const BACKEND_URL = 'http://localhost:8080'

/** True in the opt-in `npm run test:flow:ai` run (the `flow-ai` Vite mode). */
export const aiEnabled = import.meta.env.MODE === 'flow-ai'

const REACHABILITY_STEP = 'backend reachability check via GET /api/users/me'

/**
 * Probes `GET /api/users/me` and throws a message that names the failing step
 * and the cause when the backend is unreachable (FR-001, SC-005). A 401 or 404
 * means the backend is reachable but has no session yet.
 */
export async function assertBackendReachable(): Promise<void> {
  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}/api/users/me`, {
      headers: { Accept: 'application/json' },
    })
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err)
    throw new Error(
      `Failed ${REACHABILITY_STEP}: cannot reach ${BACKEND_URL}. ` +
        `Start the backend before running the flow suite. Cause: ${cause}`,
    )
  }

  if (response.status >= 500) {
    throw new Error(
      `Failed ${REACHABILITY_STEP}: ${BACKEND_URL} answered HTTP ${response.status}. ` +
        'The backend is running but not ready.',
    )
  }
}
