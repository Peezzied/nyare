# Implementation Plan: Configurable Planning and Backdating Horizons

**Branch**: `015-configure-planning-horizons` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/015-configure-planning-horizons/spec.md`

## Summary

Make the study planning lookahead horizon and note backdating horizon configurable per user account. Store `planningHorizonDays` and `backdatingHorizonDays` directly on the `User` entity (default 14, range 1–60). Expose dedicated `/api/settings` REST endpoints following Dr. JSkill Spring Boot conventions. Inject dynamic planning horizons into `StudyPlannerEngine` and note backdating validation into `NoteServiceImpl`. Provide a dedicated, accessible Settings page in the Vue frontend reached via `HamburgerMenu.vue` adhering to Impeccable UI/UX standards, featuring tactile "Save" and "Reset to Defaults" buttons with toast feedback.

## Technical Context

**Language/Version**: Java 25 (Backend), TypeScript 5.x / Vue 3 (Frontend)

**Primary Dependencies**: Spring Boot 4.1.1 (`webmvc`, `data-jpa`, `validation`), Spring AI 2.0.0, Vue 3, Vite, Tailwind CSS 4, `@lucide/vue`

**Storage**: SQLite (`nyare.db` in prod, in-memory SQLite in tests) via Spring Data JPA / Hibernate

**Testing**: JUnit 5, Mockito, AssertJ, Spring WebMvcTest (`app/`), Vitest with `@vue/test-utils` and jsdom (`frontend/`)

**Target Platform**: Single deployable Spring Boot JAR serving bundled Vue SPA static assets (`app/src/main/resources/static/`)

**Project Type**: Full-stack web application (Spring Boot + Vue.js SPA)

**Performance Goals**: Settings retrieval and persistence response time < 50ms; instant frontend input reactivity; toast visual confirmation < 1s

**Constraints**: YAGNI minimalism (no separate preference table, direct fields on User); session-based user authentication; strictly canonical exceptions (RFC 7807 400/404); no Pinia/Axios on frontend (native fetch composables)

**Scale/Scope**: 1 new frontend view (`SettingsView.vue`), 1 new controller (`SettingsController`), 1 new service interface/impl (`UserSettingsService`), minor updates to `User`, `NoteServiceImpl`, `StudyPlannerEngine`, and `HamburgerMenu.vue`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
|:---|:---|:---|
| **I. Virtual Study Plan and Tri-State Planning** | Study plan remains virtual; horizons only adjust lookahead window for upcoming event tasks. No hourly micro-scheduling. | PASS |
| **II. Course Anchor and Single Parentage** | Academic items remain anchored to courses. Settings are user-scoped preferences. | PASS |
| **III. Grounded Uncertainty Preservation** | AI planner continues to schedule without fabricating deadlines or priorities. | PASS |
| **IV. Non-Destructive Additive Planning** | AI planner only generates prep tasks within the user's configured horizon. Student notes and task titles remain unmutated. | PASS |
| **V. Strict Architectural Layer Isolation** | `SettingsController` -> `UserSettingsService` -> `UserRepository`. Entities never leave service layer. DTOs used exclusively. | PASS |
| **VI. Canonical Error Strategy** | Uses only `BadRequestException` (400) for validation and RFC 7807 Problem Details. No custom exception classes. | PASS |
| **VII. Ponytail Minimalism and Native Features** | Direct columns on `User` entity (no over-engineered tables); native Vue fetch composables; zero new external dependencies. | PASS |
| **VIII. Evidence-First Verification and Surgical Edits** | Changes scoped strictly to settings and horizon usage. All steps bracketed by tests. | PASS |
| **IX. Frontend-Backend Alignment** | Both sides enforce identical 1–60 day bounds and 14-day defaults. | PASS |
| **X. Dev Audit Trace Isolation** | Setting changes do not pollute domain trace trees or break dev observability tools. | PASS |

## Project Structure

### Documentation (this feature)

```text
specs/015-configure-planning-horizons/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan
├── research.md          # Technical decisions & rationale
├── data-model.md        # Data models, DTOs, and schema changes
├── quickstart.md        # End-to-end validation scenarios
├── contracts/           # API contract specification
│   └── settings-api.yaml
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Layout

```text
app/src/main/java/group/four/nyare/nyare/
├── controller/
│   └── SettingsController.java              # REST endpoints for /api/settings
├── dto/
│   ├── UserSettingsRequest.java             # Request validation payload
│   └── UserSettingsResponse.java            # Settings transfer representation
├── model/
│   └── User.java                            # Added planningHorizonDays & backdatingHorizonDays
├── service/
│   ├── UserSettingsService.java             # Settings service interface
│   └── impl/
│       ├── UserSettingsServiceImpl.java     # Service implementation
│       ├── NoteServiceImpl.java             # Dynamic backdating enforcement
│       └── StudyPlannerServiceImpl.java     # Passes user planning horizon
└── ai/
    └── StudyPlannerEngine.java              # Parameterized planningScopeDays prompt injection

frontend/src/
├── api/
│   └── settings.ts                          # Native fetch client for /api/settings
├── types/
│   └── api.ts                               # UserSettings TypeScript interface
├── router/
│   └── index.ts                             # /settings route registration
├── components/
│   └── HamburgerMenu.vue                    # Added Settings drawer navigation link
└── views/
    ├── SettingsView.vue                     # Dedicated Settings page with tactile controls
    └── __tests__/
        └── SettingsView.spec.ts             # Component unit tests
```

## Complexity Tracking

*No constitutional violations. Zero complexity exceptions.*
