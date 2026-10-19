# Data Model: Onboarding Flow Completion

## User (changed)

| Field | Type | Rules |
|-------|------|-------|
| `id` | Long | unchanged |
| `username` | String | unchanged |
| `onboarded` | boolean, non-null | **New.** `false` for accounts created after this feature. `true` for every row that existed before (column default). Never reverts to `false`. |
| `createdAt`, `updatedAt` | Instant | unchanged |

### State transitions

```text
(created) --> onboarded = false --complete--> onboarded = true
(pre-existing row) --------------------------> onboarded = true
```

- `complete` is idempotent: completing an onboarded user returns the same state.
- `complete` is rejected when the user owns zero courses.
- Deleting all courses later does not change `onboarded`.

## UserResponse (changed)

Adds `onboarded: boolean`. Returned by `POST /api/users`, `POST /api/users/login`, `GET /api/users`, `GET /api/users/{id}`, `GET /api/users/me`, and the new complete endpoint.

## DraftCourse (frontend, unchanged shape)

Session-only record held in `useCourseDrafts`. Lifecycle used by the leave guard:

```text
stageCourse --> in draftCourses (unsaved)
flush success --> unstageCourse (saved to account)
flush failure --> stays in draftCourses (still unsaved)
session reset / Discard --> resetDrafts
```

A non-empty `draftCourses` list means unsaved work.

## CourseEditor (frontend, unchanged shape)

Already carries `persistedId` after a successful flush. Used so a persisted course does not clash with itself.

## Validation rules

| Rule | Where enforced |
|------|----------------|
| New account starts not onboarded (FR-004) | `UserServiceImpl.createUser` |
| Pre-existing accounts onboarded (FR-006) | column default |
| Complete only with at least one course (FR-005 backstop) | `UserServiceImpl.completeOnboarding` |
| Complete only after every staged course saved (FR-005) | `CreateScheduleView.saveAll` (completion runs after `flush()` resolves) |
| Per-account isolation (FR-017) | session-scoped endpoint; drafts reset on session clear |
