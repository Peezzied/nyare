# Contract: Onboarding API

Base path: `/api/users`. Session via `JSESSIONID` cookie (`credentials: 'include'`). Errors are RFC 7807 problem details.

## Changed: `UserResponse`

```json
{
  "id": 7,
  "username": "ana",
  "onboarded": false,
  "createdAt": "2026-10-19T08:00:00Z",
  "updatedAt": "2026-10-19T08:00:00Z"
}
```

`onboarded` is present on every endpoint that returns a user.

## New: complete onboarding

`POST /api/users/me/onboarding/complete`

- **Auth**: requires a session. The controller reads the session user id (same self-check as `GET /me`). No request body and no client-supplied user id.
- **Idempotent**: calling it on an already onboarded user returns 200 with `onboarded: true`.

| Status | When | Body |
|--------|------|------|
| 200 | User now onboarded | `UserResponse` with `onboarded: true` |
| 400 | User owns no course | Problem detail: "Add at least one course before completing onboarding" (`BadRequestException`) |
| 401 | No session | empty body (matches `GET /me`) |
| 404 | Session user no longer exists | Problem detail (`ResourceNotFoundException`) |

## Frontend contract

```ts
// types/api.ts
interface UserResponse { id; username; onboarded: boolean; createdAt; updatedAt }

// api/auth.ts
authApi.completeOnboarding(): Promise<UserResponse>   // POST /api/users/me/onboarding/complete

// composables/useAuth.ts
useAuth().completeOnboarding(): Promise<UserResponse> // calls API, then setSessionUser(result)
```

## Route contract

| Target | Not onboarded | Onboarded |
|--------|---------------|-----------|
| `/` (start) with session | redirect `/welcome` | redirect `/calendar` |
| `/welcome`, `/create-schedule` | allowed | redirect `/calendar` |
| `/calendar`, `/tasks`, `/notes`, `/notes/*`, `/tasks/:id` | redirect `/welcome` | allowed |
| `/schedule` (removed) | redirect `/` then as above | redirect `/` then as above |
| `/`, `/select-account`, `/dev-missing` without session | unchanged | unchanged |
