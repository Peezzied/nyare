# Contract: Session Enforcement

## Protected paths (session required)

`/api/courses/**`, `/api/schedules/**`, `/api/tasks/**`, `/api/notes/**`, `/api/academic-events/**`, `/api/images/**`, `/api/study-planner/**`

| Condition | Status | Body |
|---|---|---|
| No session, or session without `USER_ID` | 401 | RFC 7807 `application/problem+json`: `title` "Unauthorized", `status` 401, `detail` "Authentication required" |
| Session, record owned by another user | 404 | RFC 7807, same as other not-found errors |
| Session, own record | Unchanged from today | Unchanged |

CORS preflight (`OPTIONS`) is not blocked.

## Open paths (no session needed)

| Method and path | Purpose |
|---|---|
| `POST /api/users` | Register |
| `POST /api/users/login` | Start session |
| `POST /api/users/logout` | End session (idempotent) |
| `GET /api/users/me` | Session probe (already answers 401) |
| `GET /api/users`, `GET /api/users/{id}`, `DELETE /api/users/{id}` | Account picker. Open by decision, see research Decision 5. |

## Removed inputs

| Removed | Replacement |
|---|---|
| `GET /api/courses?userId={id}` | Session user |
| `CourseRequest.userId` body field | Session user |

## Frontend contract

- `apiClient` throws `ApiError` with `status` 401 on a protected 401 and calls the registered unauthorized handler once.
- Calls to `/api/users/me` and `/api/users/login` do not call the handler. `ensureSession` handles them.
- The router handler runs `clearSessionUser()` and navigates to route `start` unless already there.
- The mock adapter returns the same 401 body for protected routes when `currentUser` is null.
