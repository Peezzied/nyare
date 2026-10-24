# Implementation Plan: Onboarding Flow Completion

**Branch**: `feat-start-up-improvements` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-onboarding-flow-completion/spec.md`

## Summary

Close the onboarding chain so a new account can finish setup. Remove the dead `ScheduleView`, re-point Welcome to `/create-schedule`, store a per-account `onboarded` flag on the backend (existing accounts default to onboarded), gate routes on that flag in the router guard, complete onboarding when "Save all" persists every staged course, and stop the create-schedule screen from silently losing session-only courses (leave guard counts staged drafts; per-course save stops claiming "saved").

Technical approach: one new session-scoped backend endpoint (`POST /api/users/me/onboarding/complete`) plus an `onboarded` field on the user DTO; frontend reads the flag from the existing `GET /api/users/me` response, so the router guard needs no extra roundtrip.

## Technical Context

**Language/Version**: Java 25 (backend), TypeScript 5 / Vue 3 (frontend)

**Primary Dependencies**: Spring Boot 4.1.1 (`webmvc`, `data-jpa`, `validation`), Vue Router, Vitest, existing `vue-sonner`

**Storage**: SQLite via JPA/Hibernate, `ddl-auto=update` in prod, `create-drop` in tests

**Testing**: JUnit 5 + Mockito (`UserServiceImplTest`), `@WebMvcTest` + `@MockitoBean` on `UserService` (`UserControllerTest`), Vitest + Vue Test Utils (router, `useAuth`, `CreateScheduleView`, `WelcomeView`)

**Target Platform**: Mobile-first web, 390px viewport

**Project Type**: web-application (frontend + backend)

**Performance Goals**: No extra request at route-guard time; completion is one POST

**Constraints**: Existing SQLite rows must migrate without data loss under `ddl-auto=update`; no new exception classes; views stay free of dev-env logic; no Pinia/Axios

**Scale/Scope**: One new endpoint, one new column, ~6 frontend files edited, 1 view deleted

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Note |
|-----------|--------|------|
| V. Layer isolation | Pass | Controller -> `UserService` interface -> `UserServiceImpl` -> repositories. Entity never leaves service; DTO carries `onboarded`. |
| VI. Canonical errors | Pass | Only `BadRequestException` (no courses) and `ResourceNotFoundException`. No new exception classes. |
| VII. Ponytail minimalism | Pass | Reuse `useAuth` user ref and existing `/me` response. No new store, no new endpoint for reading the flag. |
| VIII. Surgical edits | Pass | Edits limited to listed files. No reformatting of adjacent code. |
| IX. FE-BE alignment | Pass | Course ownership untouched; flag is account-level. |
| X. Dev env separation | Pass | Guard reads `user.onboarded` from the API. No `import.meta.env` in views. Dev user is onboarded through the seed row, not a client bypass. |
| II. Course anchor | N/A | Feature adds no academic records. |

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/009-onboarding-flow-completion/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── onboarding-api.md
└── tasks.md             # Phase 2 (/speckit-tasks) - not created here
```

### Source Code (repository root)

```text
app/src/main/java/group/four/nyare/nyare/
├── model/User.java                      # + onboarded column
├── dto/UserResponse.java                # + onboarded
├── controller/UserController.java       # + POST /me/onboarding/complete
├── service/UserService.java             # + completeOnboarding(Long userId)
├── service/impl/UserServiceImpl.java    # + impl, new users start false, toResponse maps flag
└── repository/CourseRepository.java     # + existsByUserId
app/src/main/resources/data.sql      # dev_student seeded onboarded
app/src/test/java/.../UserServiceImplTest.java, UserControllerTest.java

frontend/src/
├── types/api.ts                         # UserResponse.onboarded
├── api/auth.ts                          # authApi.completeOnboarding()
├── composables/useAuth.ts               # completeOnboarding(), isOnboarded
├── composables/useCourseDrafts.ts       # drafts cleared on session reset
├── router/index.ts                      # remove /schedule route, onboarding gating
├── views/WelcomeView.vue                # Continue -> /create-schedule
├── views/CreateScheduleView.vue         # leave guard, copy, completion + redirect
├── views/ScheduleView.vue               # DELETED
└── **/__tests__/*.spec.ts               # updated/added
```

**Structure Decision**: Existing web-application layout (`app/` + `frontend/`). No new top-level directories.

## Design Decisions

1. **Flag storage**: `User.onboarded` (`Boolean`, non-null). Column DDL default is `true`, so `ddl-auto=update` adds it to existing rows as onboarded (FR-006). `UserServiceImpl.createUser` sets `false` explicitly (FR-004).
2. **Flag read path**: `onboarded` rides on `UserResponse`, served by `/me`, `/login`, and list endpoints. The guard reads `user.onboarded` from the cached session user. No extra roundtrip.
3. **Flag write path**: `POST /api/users/me/onboarding/complete`, session-scoped, idempotent, returns the updated `UserResponse`. Rejects with 400 when the user owns no course (spec assumption: onboarding needs at least one saved course).
4. **Route gating** (`router.beforeEach`, after session resolution):
   - Not onboarded + target is `calendar`/`tasks`/`notes`/`note-*`/`task-detail` -> `welcome`.
   - Onboarded + target is `welcome` or `create-schedule` -> `calendar`.
   - `start` with a session: onboarded -> `calendar`, not onboarded -> `welcome`.
   - `/schedule` becomes `redirect: '/'` so stale bookmarks resolve through the guard.
5. **Completion trigger**: in `CreateScheduleView.saveAll`, after `flush()` resolves and the user is not onboarded, call `useAuth().completeOnboarding()` then push `/calendar`. `flush()` throws on any failure, so completion never runs while a staged course is unsaved (FR-005). A completion failure keeps the student on the screen with an error toast; pressing Save all again retries because `flush()` on an empty draft list is a no-op.
6. **Lost-course guard**: `hasUnsavedChanges` becomes `editors.some(isEditorDirty) || draftCourses.length > 0`. Staged drafts exist only until `flush()` persists them, so a non-empty draft list means unsaved work (FR-010, FR-013). Discard also calls `resetDrafts()`.
7. **Copy**: per-course save toast changes to "Course kept for this session. Use Save all to save it to your account." (FR-012).
8. **Back/close destination**: `closeImmediately` pushes `/welcome` instead of the removed `/schedule`.
9. **Account isolation** (FR-017): `useCourseDrafts` registers its reset with the cache registry (`createCache(onReset)`) so `clearSessionUser()` empties drafts on sign-out or account switch.

## Risks

- Hibernate `update` on SQLite adding a `NOT NULL` column needs the DDL default. Verified path: `columnDefinition = "boolean default true"` plus `nullable = false`. Covered by a test run against a pre-existing table in quickstart step 5.
- Dev account creation is blocked client-side while `VITE_DEV_USER` is set (service boundary, unchanged). The new-account path is verified by tests and by running the app with `VITE_DEV_USER` unset.
- Welcome name still has no storage (out of scope per spec).
