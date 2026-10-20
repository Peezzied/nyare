# Implementation Plan: Enforce Backend Session

**Branch**: `006-enforce-backend-session` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/006-enforce-backend-session/spec.md`

## Summary

The backend answers HTTP 401 to every course, task, note, schedule, academic event, image, and planner request that has no session. It scopes every read and write to the session user, including by-ID calls that have no owner check today. The frontend handles a 401 at one place (the API client), clears session state, and returns to the start screen. Mocks, backend tests, frontend tests, and the flow suite follow the new rule.

Technical approach (grounded in `dr-jskill`, Spring Boot 4 practice, and Vue best practices, see [research.md](research.md)):

- One Spring `HandlerInterceptor` denies by default on `/api/**`, with an allow list for the user session endpoints. No Spring Security dependency.
- `SessionContext.requireUserId()` gives each controller a non-null user ID. Services take that ID and filter by owner. A record of another user answers 404.
- `spring.mvc.problemdetails.enabled=true` renders the 401 as RFC 7807 with the built-in `ResponseStatusException`. No new exception class.
- The frontend client exposes `setUnauthorizedHandler`. The router module wires it. Views stay free of 401 logic.

## Technical Context

**Language/Version**: Java 25 (backend), TypeScript 5 with Vue 3 (frontend)

**Primary Dependencies**: Spring Boot 4.1.1 (`webmvc`, `data-jpa`, `validation`), Vue 3, Vue Router 4, Vite. No new dependency.

**Storage**: SQLite through JPA. No schema change. Ownership derives from `Course.user`.

**Testing**: JUnit 5, Mockito, `@WebMvcTest` with `@MockitoBean` (backend). Vitest with jsdom and the headless flow suite (frontend).

**Target Platform**: Spring Boot server on port 8080. Mobile-first web client.

**Project Type**: web application (`backend/` and `frontend/`)

**Performance Goals**: The session check adds one in-memory attribute read per request. No extra database call.

**Constraints**: No new exception classes. Controllers never touch repositories. Entities never leave services. No dev flags in views.

**Scale/Scope**: 7 controllers, 5 services, 4 repositories, 1 client module, 1 router module, 1 mock adapter, about 20 test files.

## Constitution Check

*GATE: pass before Phase 0. Re-checked after Phase 1.*

| Principle | Result | Note |
|---|---|---|
| II Course anchor | Pass | Ownership flows from `Course.user`. No orphan record. |
| V Layer isolation | Pass | Controllers pass `userId` to service interfaces. Repositories stay in services. |
| VI Canonical errors | Pass | 401 uses Spring built-in `ResponseStatusException`. Wrong-owner access throws `ResourceNotFoundException`. |
| VII Ponytail | Pass | No Spring Security, no new library, one interceptor, one client hook. |
| VIII Evidence first | Pass | Each change has a failing test first. See [quickstart.md](quickstart.md). |
| IX Frontend-backend alignment | Pass | Client keeps day-level and cache rules. The 401 hook adds no domain behavior. |
| X Dev rules outside views | Pass | Dev auto-login stays in `useAuth`. The 401 hook lives in the client and router. |
| Testing standards | Pass | Controller tests mock service interfaces. Integration tests run one at a time. |

Post-design re-check: pass. No violation. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/006-enforce-backend-session/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── session-enforcement.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── src/main/java/group/four/nyare/nyare/
│   ├── config/
│   │   ├── SessionContext.java            # add requireUserId()
│   │   ├── SessionInterceptor.java        # new: deny by default on /api/**
│   │   └── WebConfig.java                 # register interceptor
│   ├── controller/                        # pass session user ID, drop userId params
│   ├── dto/CourseRequest.java             # remove userId
│   ├── repository/                        # findByIdAnd...UserId queries
│   └── service/ + service/impl/           # by-ID and create methods take userId
├── src/main/resources/application.properties  # problemdetails.enabled=true
└── src/test/java/.../controller/          # set session attribute, add 401 tests

frontend/
├── src/api/client.ts                      # setUnauthorizedHandler, 401 hook
├── src/api/mocks/adapter.ts               # 401 on protected routes without login
├── src/router/index.ts                    # wire handler, clear session, go to start
├── src/composables/useAuth.ts             # reuse clearSessionUser
├── src/__flow__/flows/                    # add anonymous 401 flow
└── src/**/__tests__/                      # login first or expect 401
```

**Structure Decision**: Reuse the existing `backend/` and `frontend/` split. Add one new Java class (`SessionInterceptor`). Change the rest in place.

## Breaking Changes and Frontend Reconciliation

| Breaking change | Who relied on it | Fix |
|---|---|---|
| Anonymous `GET` on protected lists returns 401, not all data | Frontend mocks and tests, flow suite, backend controller tests | Log in first, or expect 401. See [contracts](contracts/session-enforcement.md). |
| `GET /api/courses?userId=` removed | None in frontend source (no `userId` use found) | Remove the parameter. The session decides the user. |
| `CourseRequest.userId` removed | None in frontend source | Remove the field. Jackson ignores an unknown field from old callers. |
| By-ID calls of another user answer 404 | Tests that cross users | Use one user per test. Add a cross-user test. |
| 401 during use | `apiClient` callers | Client hook clears the session and routes to start. |
| `GET /api/users`, `GET /api/users/{id}`, `DELETE /api/users/{id}` stay open | Account picker screen needs the list before login | Out of scope. Logged as a follow-up risk in research. |
| Implementation extra: `Image` entity has no owner link | None | Left unscoped. The session gate still applies to `/api/images/**`. Any logged-in user can still fetch or delete another user's image by ID. Recorded as a follow-up risk. |
| Implementation extra: `npm run format` reformatted ~78 unrelated `frontend/src` files | Working tree | Cosmetic prettier changes, left in place for the user to review before commit. |
