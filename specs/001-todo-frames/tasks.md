# Tasks: To-do Screen, Burger Panel, and Item Modal

**Input**: Design documents from `specs/001-todo-frames/` (spec.md, plan.md)

**Prerequisites**: plan.md (approved), spec.md (approved)

**Tests**: No new unit tests. Verification uses type-check, lint:oxlint, and `npx vitest run src/api` to verify existing tests.

**Organization**: Tasks are grouped by user story for independent implementation and verification.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup (Dependencies & Primitives)

**Purpose**: Install required dependencies and setup UI primitives

- [x] T001 Install `lucide-vue-next` and `reka-ui` in `frontend/package.json`
- [x] T002 Add Checkbox, Dialog, and Popover primitives in `frontend/src/components/ui/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared mock data and shell headers needed across stories

- [x] T003 Update `frontend/src/api/mocks/fixtures.ts` with display-only time map and corrected course spellings while keeping `TaskResponse` unchanged
- [x] T004 Create fixed header component in `frontend/src/components/TodoHeader.vue` with 44px menu button, centered title, divider, and empty 44px circle
- [x] T005 [P] Create fixed bottom navigation component in `frontend/src/components/BottomNav.vue` with 3 tab routes (To-Do active, Calendar stub, Notes stub)

**Checkpoint**: Shared data and layout shell ready for user stories.

---

## Phase 3: User Story 1 - Review and Complete Tasks in To-do View (Priority: P1) 🎯 MVP

**Goal**: Render chronological task list with date columns, course palette text color, dot dividers, and completion checkboxes.

**Independent Test**: Load `/` at 390px viewport, scroll task list, and toggle task checkboxes.

- [x] T006 [US1] Create `frontend/src/views/TodoView.vue` with flat date-sorted list, left date column, course palette color, display time, dot divider, and Checkbox toggle
- [x] T007 [US1] Configure routes in `frontend/src/router/index.ts` for `/` (TodoView), `/calendar` (stub), and `/notes` (stub)
- [x] T008 [US1] Update `frontend/src/App.vue` to wrap active router view in mobile baseline 390px shell

**Checkpoint**: User Story 1 fully functional and testable independently.

---

## Phase 4: User Story 2 - Access Quick Navigation Menu via Burger Panel (Priority: P2)

**Goal**: Tapping the hamburger button opens an empty rounded popover anchored top-left under the button without scrim.

**Independent Test**: Tap hamburger icon button to open popover, tap outside or press Escape to close.

- [ ] T009 [US2] Create empty popover component in `frontend/src/components/TodoBurgerPanel.vue` anchored top-left without background scrim
- [ ] T010 [US2] Integrate `TodoBurgerPanel.vue` into `frontend/src/components/TodoHeader.vue` with outside-click and Escape dismissal

**Checkpoint**: User Stories 1 and 2 work independently.

---

## Phase 5: User Story 3 - Inspect Task Item Details via Centered Modal (Priority: P3)

**Goal**: Tapping a task row opens an empty centered dialog (~60% height, ~45px margins) over dimmed scrim with SR-only title.

**Independent Test**: Tap any task row in `TodoView.vue` to open modal over dimmed scrim, tap outside or press Escape to dismiss.

- [ ] T011 [US3] Create `frontend/src/components/TodoItemModal.vue` centered dialog with scrim (`rgba(0,0,0,0.4)`), rounded-2xl, border, task prop, and SR-only title
- [ ] T012 [US3] Wire row click in `frontend/src/views/TodoView.vue` to open `TodoItemModal.vue` with selected task and handle dismissals

**Checkpoint**: All 3 user stories functional and testable.

---

## Phase 6: Verification & Polish

**Purpose**: Verification gates per user constraints

- [ ] T013 Run `npm run lint:oxlint` in `frontend/` to verify code quality
- [ ] T014 Run `npm run type-check` in `frontend/` to confirm zero TypeScript errors
- [ ] T015 Run `npx vitest run src/api` in `frontend/` to verify existing tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion; blocks all user stories.
- **Phase 3 (User Story 1)**: Depends on Phase 2; delivers standalone MVP.
- **Phase 4 (User Story 2)**: Depends on Phase 2 and integrates with `TodoHeader.vue`.
- **Phase 5 (User Story 3)**: Depends on Phase 2 and integrates with `TodoView.vue`.
- **Phase 6 (Verification)**: Runs after story implementations.

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2.
- **US2 (P2)**: Independent after Phase 2.
- **US3 (P3)**: Depends on `TodoView.vue` from US1 for row click trigger.

---

## Implementation Strategy

1. Complete Setup (T001-T002) and Foundational (T003-T005).
2. Deliver MVP: User Story 1 (T006-T008). Verify To-do list rendering and toggle.
3. Deliver User Story 2 (T009-T010). Verify burger popover behavior.
4. Deliver User Story 3 (T011-T012). Verify task modal behavior.
5. Execute Verification: lint, type-check, and `npx vitest run src/api`.
