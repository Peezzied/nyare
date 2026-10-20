# Research: Onboarding Flow Completion

No `NEEDS CLARIFICATION` items remained after the spec. The decisions below record the choices that planning had to make.

## R1: Where to store the onboarding flag

- **Decision**: A non-null boolean column on the existing `users` table.
- **Rationale**: The flag is account-level, must survive restarts and devices (FR-009), and the backend already owns the account. Session-only or `localStorage` storage fails cross-device and breaks on shared devices (FR-017).
- **Alternatives considered**: `localStorage` (per-device, loses state on cache clear, wrong account on shared devices); a separate `onboarding` table (extra join and entity for one boolean, violates minimalism); deriving "onboarded" from "has any course" (breaks the edge case where a student deletes all courses and must stay onboarded).

## R2: Migrating existing accounts under `ddl-auto=update`

- **Decision**: `@Column(nullable = false, columnDefinition = "boolean default true")`. New users are created with `false` in `UserServiceImpl.createUser`.
- **Rationale**: SQLite cannot add a `NOT NULL` column without a default. A DDL default of `true` backfills every existing row as onboarded (FR-006) and the entity sets the real value on insert, so the default never applies to new accounts. `data.sql` also states `onboarded` explicitly for the seed row.
- **Alternatives considered**: nullable `Boolean` treated as true when null (spreads null handling into DTO and service); a manual migration script (project uses `ddl-auto=update`, no migration tool).

## R3: How the frontend learns the flag

- **Decision**: Add `onboarded` to `UserResponse`. The router guard reads it from the `useAuth` session user already fetched by `GET /api/users/me`.
- **Rationale**: Zero new roundtrips, matches the "trust mutation responses, cache static data" conventions. `login` and `register` responses carry it too, so `setSessionUser` stays correct.
- **Alternatives considered**: a dedicated `GET /api/users/me/onboarding` (extra request on every cold load, redundant with `/me`).

## R4: Write endpoint shape

- **Decision**: `POST /api/users/me/onboarding/complete`, no body, idempotent, returns `UserResponse`.
- **Rationale**: Verb-style sub-resource fits a one-way state change. No client-supplied user id, so a student cannot complete another account's onboarding. `/api/users/**` is already excluded from the session interceptor, so the controller self-checks the session like `/me` does.
- **Alternatives considered**: `PATCH /api/users/{id}` with a body (needs general user update surface and ownership checks); `PUT /me` (invites arbitrary field updates).

## R5: Enforcing "at least one saved course"

- **Decision**: `UserServiceImpl.completeOnboarding` throws `BadRequestException` when the user has no course (`CourseRepository.existsByUserId`).
- **Rationale**: Backend invariant, so a buggy or scripted client cannot mark an empty account onboarded. The frontend already calls it only after `flush()`.
- **Alternatives considered**: frontend-only check (bypassable, drifts from backend rules per Principle IX).

## R6: Leave guard source of truth

- **Decision**: `draftCourses.length > 0` counts as unsaved.
- **Rationale**: `flush()` unstages each course after its API calls succeed, so remaining drafts are exactly the session-only or failed courses (FR-010, FR-013). No new state to keep in sync.
- **Alternatives considered**: a separate `persisted` flag on each editor (duplicates what `persistedId` plus draft membership already encode); persisting on per-course save (rejected by the user earlier: only Save all writes).

## R7: Stale `/schedule` bookmarks

- **Decision**: Replace the route with `redirect: '/'`.
- **Rationale**: The `/` route plus the guard sends the student to the right place for their state (calendar if onboarded, welcome if not), satisfying spec scenario 4 without a dedicated screen.
- **Alternatives considered**: a 404 page (spec says no error page); redirecting straight to `/create-schedule` (skips Welcome for not-onboarded accounts and fails for onboarded ones).
