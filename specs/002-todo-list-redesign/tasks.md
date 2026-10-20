# Implementation Tasks: Revise To-do List Screen and Task Detail Placeholder

**Feature**: Revise To-do List Screen and Task Detail Placeholder  
**Branch**: `002-todo-list-redesign`  
**Spec**: [spec.md](file:///D:/IdeaProjects/nyare/specs/002-todo-list-redesign/spec.md) | **Plan**: [plan.md](file:///D:/IdeaProjects/nyare/specs/002-todo-list-redesign/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Set up fixture helpers and urgency calculation utilities without altering existing shared interfaces.

- [X] T001 [P] Create date diff and urgency token mapping in `src/utils/taskUrgency.ts`
- [X] T002 [P] Add dummy mock tasks with due dates, offsets, and duration variants in `src/api/mocks/fixtures.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI primitives and routing prerequisites needed across user stories.

- [X] T003 Register `/tasks/:id` route mapping to `TaskDetailView.vue` in `src/router/index.ts`
- [X] T004 Create `src/views/TaskDetailView.vue` with 44px back button, centered title, empty body, bottom nav, and redirect to `/` for invalid task ID

---

## Phase 3: User Story 1 - Categorized Task List with Filtering and Accordions (Priority: P1) 🎯 MVP

**Goal**: Filter tasks via segmented pills (All, Scheduled, Later, Backlog) and display collapsible category sections in "All" view with Scheduled open and Later/Backlog closed by default.

**Independent Test**: Load `/`, verify "All" view renders with "Scheduled" expanded and "Later"/"Backlog" collapsed. Clicking section headers rotates chevron and toggles accordion. Clicking "Later" pill renders only Later tasks in a flat list without headers.

### Implementation for User Story 1

- [X] T005 [US1] Implement segmented category filter pills in `src/views/TodoView.vue`
- [X] T006 [US1] Implement collapsible category accordions for Scheduled, Later, and Backlog in `src/views/TodoView.vue`
- [X] T007 [US1] Implement flat filtered view when a specific category pill is selected in `src/views/TodoView.vue`

---

## Phase 4: User Story 2 - Rich Task Row Presentation and Due Urgency (Priority: P2)

**Goal**: Display course name in assigned color, title, formatted duration text ("30m", "1hr", "1.5hr"), and color-coded calendar icon reflecting urgency (red for <=0 days with "TODAY", yellow for 1-2 days, green for >=3 days, muted for none).

**Independent Test**: Inspect tasks with different due date offsets to ensure calendar icon tokens (red `#D50000`, yellow `#F6BF26`, green `#0B8043`, neutral muted) and date labels (`TODAY` or `mm/dd`) display accurately.

### Implementation for User Story 2

- [X] T008 [US2] Implement duration string formatting in `src/utils/taskUrgency.ts`
- [X] T009 [US2] Implement row layout with course name, title, display time, duration text, and color-coded calendar urgency icon in `src/views/TodoView.vue`

---

## Phase 5: User Story 3 - Task Status Toggle and Completed State (Priority: P3)

**Goal**: Checkbox toggles task completion status without row navigation; completed tasks remain in section with strikethrough styling and reduced opacity.

**Independent Test**: Click task checkbox: status flips between TODO and COMPLETED, title applies strikethrough, row shows reduced opacity, and router does not navigate.

### Implementation for User Story 3

- [X] T010 [US3] Connect checkbox toggle handler with optimistic update and isolate click events from row navigation in `src/views/TodoView.vue`
- [X] T011 [US3] Apply strikethrough styling and reduced row opacity for completed tasks in `src/views/TodoView.vue`

---

## Phase 6: User Story 4 - Task Detail Navigation and Dedicated Placeholder (Priority: P4)

**Goal**: Clicking a task row navigates to `/tasks/:id`. Remove obsolete `TodoItemModal.vue`.

**Independent Test**: Click any task row outside the checkbox to navigate to `/tasks/:id`. Click back button to return to `/`. Direct navigation to `/tasks/invalid-id` redirects to `/`.

### Implementation for User Story 4

- [X] T012 [US4] Bind task row click to navigate to `/tasks/:id` in `src/views/TodoView.vue`
- [X] T013 [US4] Delete obsolete `src/components/TodoItemModal.vue` and clean up its imports and refs in `src/views/TodoView.vue`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification and quality gates.

- [X] T014 Run linter checks using `npm run lint:oxlint`
- [X] T015 Run type checks using `npm run type-check`
- [ ] T016 Run unit test suite using `npm run test:unit`
- [ ] T017 Validate complete workflow against `quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1).
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2).
- **User Story 2 (Phase 4)**: Depends on User Story 1.
- **User Story 3 (Phase 5)**: Depends on User Story 2.
- **User Story 4 (Phase 6)**: Depends on User Story 3.
- **Polish (Phase 7)**: Depends on all user stories being completed.

### Parallel Opportunities
- T001 and T002 in Setup can run in parallel.
- Polish tasks T014, T015, T016 can run independently.

---

## Implementation Strategy

### MVP First (User Story 1)
1. Complete Setup (T001, T002) and Foundational (T003, T004).
2. Implement User Story 1 (T005, T006, T007) for categorized filtering and accordions.
3. Validate MVP in browser.

### Incremental Delivery
1. Add Story 2: Urgency icons, durations, and course styling.
2. Add Story 3: Checkbox completion and strikethrough styling.
3. Add Story 4: Row navigation to `/tasks/:id` and removal of `TodoItemModal.vue`.
4. Run Polish & verification scripts.
