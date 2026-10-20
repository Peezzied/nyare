# Implementation Plan: Headless Flow Harness & Composable Wiring

**Branch**: `005-headless-flow-harness` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-headless-flow-harness/spec.md`

## Summary

Build and verify the complete frontend data layer and headless end-to-end user flow against the live backend without presentation UI components.
1. Implement the missing reactive composables: `useTasks`, `useAcademicEvents`, `usePlannerStatus`, and the derived `useStudyPlan` (aligned with Constitution Principle I).
2. Create a Node-based Vitest execution environment (`vitest.flow.config.ts`) equipped with a session cookie jar to mirror real browser cookie persistence across native `fetch` requests.
3. Build the scenario test suite replicating the Spring AI backend integration test fixture (`FullStudyPlannerEngineIntegrationTest.java`), exercising the complete pipeline through composables.
4. Provide opt-in support (`RUN_AI=1`) for executing the real Spring AI Planner stream and validating domain invariants (tri-state planning, non-destructive titles).

## Technical Context

**Language/Version**: TypeScript 5.x / Vue 3.5 (Composition API) / Node 22+
**Primary Dependencies**: Vitest, Vue 3, `tough-cookie` (dev-dependency for flow harness cookie jar)
**Storage**: SQLite backend (`nyare.db` preserved; backend uses dedicated test profile or throwaway SQLite database)
**Testing**: Vitest (`vitest.flow.config.ts` running in `node` environment without mock adapter)
**Target Platform**: Node.js test environment targeting Spring Boot backend at `http://localhost:8080`
**Project Type**: Full-stack Web Application (Frontend data layer integration)
**Performance Goals**: Non-AI flow passes in < 2 minutes; AI flow completes in < 10 minutes
**Constraints**: Zero Pinia/Axios; native `fetch` only; non-destructive AI validation; 8-hour delivery limit
**Scale/Scope**: 4 new composables, 1 flow harness runner, 1 scenario fixture mirroring backend test suite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Virtual Study Plan and Tri-State Planning**: `useStudyPlan` dynamically derives `SCHEDULED`, `LATER`, `BACKLOG` using `getPlanCategory()`. No database table or backend endpoints created.
- [x] **II. Course Anchor and Single Parentage**: All tasks, events, and notes are parented to a specific course.
- [x] **III. Grounded Uncertainty Preservation**: AI output verified without inventing deadlines or priority scores.
- [x] **IV. Non-Destructive Additive Planning**: AI plan verification asserts no task titles are rewritten or modified.
- [x] **VII. Ponytail Minimalism and Native Features**: No Pinia or Axios added; minimal composables using native Vue `ref` and `computed`.
- [x] **IX. Frontend-Backend Domain Rule Alignment**: Client derivations strictly match backend rules.
- [x] **X. Separation of Development Environment Rules from Presentation Components**: All session and environment logic contained in service/composable boundaries.

## Project Structure

### Documentation (this feature)

```text
specs/005-headless-flow-harness/
├── plan.md              # This file
├── research.md          # Composable gaps, cookie jar strategy, fixture mapping
├── data-model.md        # Composable interface types and scenario schema
├── quickstart.md        # Execution guide for non-AI and AI flow runs
├── contracts/
│   └── ui-contract.md   # Plug-and-play UI consumption guide
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code Layout

```text
frontend/
├── vitest.flow.config.ts                     # Dedicated Vitest config for flow tests
├── package.json                              # Added test:flow and test:flow:ai scripts
├── src/
│   ├── composables/
│   │   ├── useTasks.ts                       # Task cache & CRUD mutations
│   │   ├── useAcademicEvents.ts              # Event cache & CRUD mutations
│   │   ├── usePlannerStatus.ts               # Duckota button status derivation
│   │   └── useStudyPlan.ts                   # Virtual study plan computed derivation
│   └── __flow__/
│       ├── harness/
│       │   ├── cookieJarFetch.ts             # Session cookie persistence wrapper
│       │   └── clientSetup.ts                # Environment and base URL setup
│       ├── fixtures/
│       │   ├── plannerScenario.ts            # Mirrored backend test fixture
│       │   └── assets/                       # Synthetic test PNGs
│       └── flows/
│           ├── 01-session-catalog.flow.spec.ts  # Story 1: Auth, courses, schedules
│           ├── 02-journal-planner.flow.spec.ts  # Story 2: Notes, status, Process AI
│           └── 03-failures-cancel.flow.spec.ts  # Story 3: 401, 404, cancel handling
```

**Structure Decision**: Place all flow harness code under `frontend/src/__flow__/` with a distinct `vitest.flow.config.ts` so normal unit tests (`npm run test:unit`) remain isolated and fast in `jsdom`, while flow tests run in `node` with live network requests.

## Complexity Tracking

*No violations of project constitution.*
