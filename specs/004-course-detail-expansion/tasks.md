# Tasks: Course Block Expansion & Detail View

**Branch**: `004-course-detail-expansion` | **Date**: 2026-10-16 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions and data interfaces for the detail overlay

- [X] T001 [P] Create TypeScript interfaces for modal state, origin geometry, and block payloads in `frontend/src/types/detailModal.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core overlay shell and animation infrastructure that all user stories depend on

- [X] T002 Create base container transform overlay shell `frontend/src/components/day-view/EventDetailModal.vue` with fixed positioning, backdrop blur (`bg-slate-900/40 backdrop-blur-[3px]`), body scroll lock, and accessibility attributes (`role="dialog"`, `aria-modal="true"`)
- [X] T003 [P] Create unit test suite for modal mounting, state transitions, and props in `frontend/src/components/day-view/__tests__/EventDetailModal.spec.ts`

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 1 - Tapping Course Block Expands into Detail View (Priority: P1) 🎯 MVP

**Goal**: When a user taps a course block on the day calendar grid, the card captures its screen coordinates and fluidly expands into a full-height mobile view using Material 3 decelerate easing and staggered content entrance.

**Independent Test**: Tap an existing course card on the calendar grid at `http://localhost:5173/schedule`. Verify the card expands from its tapped screen coordinates into a full-height view within 320ms without text distortion.

### Implementation for User Story 1

- [X] T004 [P] [US1] Update `frontend/src/components/day-view/CourseCard.vue` to emit `select(event: DayEvent, originRect: DOMRect)` on card tap/click
- [X] T005 [US1] Implement 3-stage container transform expansion in `frontend/src/components/day-view/EventDetailModal.vue` with 320ms `cubic-bezier(0.05, 0.7, 0.1, 1.0)` curve and staggered 100ms content fade-in
- [X] T006 [US1] Wire `CourseCard` select event and active modal state in `frontend/src/components/day-view/ScheduleCalendar.vue` to launch the expansion overlay

**Checkpoint**: User Story 1 functional and independently verifiable

---

## Phase 4: User Story 2 - Dismissing Detail View Returns to Calendar Grid (Priority: P1)

**Goal**: Provide smooth reverse collapse animation back to origin slot coordinates when dismissed via close button, backdrop tap, or device back gesture, maintaining 100% of calendar scroll position.

**Independent Test**: From an open detail view, tap Close or the browser back button. Verify the view contracts back into its original calendar block in 240ms, and the calendar retains its exact scroll position.

### Implementation for User Story 2

- [X] T007 [US2] Implement reverse collapse animation in `frontend/src/components/day-view/EventDetailModal.vue` using 240ms `cubic-bezier(0.3, 0.0, 0.8, 0.15)` curve with 80ms fast content fade-out
- [X] T008 [US2] Implement ephemeral `history.pushState` and `popstate` event listener in `frontend/src/components/day-view/EventDetailModal.vue` to handle Android back swipes and browser back actions without page teardown
- [X] T009 [US2] Wire close event handling and scroll position preservation in `frontend/src/components/day-view/ScheduleCalendar.vue`

**Checkpoint**: User Story 2 complete and independently verifiable

---

## Phase 5: User Story 3 - Inspecting Course Block Detail View & Shortcut Navigation (Priority: P2)

**Goal**: Display strictly the course color bead, course title, meeting time window, and tactile 3D buttons navigating to `/tasks` and `/notes` with scaffolded code comments for future route filtering.

**Independent Test**: Open a course detail view. Confirm strictly the color dot, course name, time window, and tactile action buttons appear. Tap "Tasks" to verify navigation to `/tasks`.

### Implementation for User Story 3

- [X] T010 [P] [US3] Create `frontend/src/components/day-view/CourseBlockDetail.vue` displaying strictly: 10px circular color dot, `Quicksand 700` course name, time badge, and 3D tactile buttons (`#00A4C8` with `4px solid #007B99` bevel)
- [X] T011 [US3] Mount `CourseBlockDetail.vue` in `frontend/src/components/day-view/EventDetailModal.vue` for course events and implement route navigation to `/tasks` and `/notes` scaffolded with comments for future course query filtering

**Checkpoint**: User Story 3 complete and independently verifiable

---

## Phase 6: User Story 4 - Inspecting Other Calendar Blocks (Tasks and Academic Events) (Priority: P2)

**Goal**: Enable tapping untimed tasks or academic events in the top strip to expand into a detail view displaying strictly the item title and a singular linked note.

**Independent Test**: Tap an untimed task or event in the top strip (`AllDayStrip`). Confirm it expands to show strictly the title and singular linked note without shortcut buttons.

### Implementation for User Story 4

- [X] T012 [P] [US4] Update `frontend/src/components/day-view/AllDayStrip.vue` to capture tapped element `DOMRect` and emit `selectUntimed(item: UntimedDayItem, originRect: DOMRect)`
- [X] T013 [P] [US4] Create `frontend/src/components/day-view/UntimedBlockDetail.vue` rendering strictly: `Quicksand 700` item title and singular linked note badge
- [X] T014 [US4] Mount `UntimedBlockDetail.vue` in `frontend/src/components/day-view/EventDetailModal.vue` for untimed items and wire `AllDayStrip` selection in `frontend/src/components/day-view/ScheduleCalendar.vue`

**Checkpoint**: User Story 4 complete and independently verifiable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, linting, and quality assurance

- [X] T015 [P] Run type check and inner loop linter via `npm run type-check` and `npm run lint:oxlint` in `frontend/`
- [X] T016 [P] Execute Vitest unit test suite with `npx vitest run src/components/day-view/__tests__/` in `frontend/`
- [X] T017 Execute end-to-end validation scenarios documented in `specs/004-course-detail-expansion/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001) - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational (T002, T003)
  - US1 (Phase 3) and US2 (Phase 4) form the core container transform and should be completed sequentially
  - US3 (Phase 5) and US4 (Phase 6) can be implemented in parallel once US1 and US2 are in place
- **Polish (Phase 7)**: Depends on all user stories being implemented

### Parallel Opportunities

- `T001`, `T003`, `T004`, `T010`, `T012`, `T013`, `T015`, `T016` can run independently as parallel tasks
- `CourseBlockDetail.vue` (US3) and `UntimedBlockDetail.vue` (US4) can be developed concurrently

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001) and Phase 2 (T002, T003)
2. Implement User Story 1 (T004, T005, T006)
3. Validate container expansion from course block tap

### Incremental Delivery

1. Foundation + US1: Working Google Calendar mobile expansion animation
2. Add US2: Reverse collapse animation + Android back button handling
3. Add US3: Impeccable 3D tactile buttons and course metadata
4. Add US4: Support untimed tasks and academic event blocks
5. Phase 7: Automated test verification and linting pass
