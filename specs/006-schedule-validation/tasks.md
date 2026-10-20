---
description: "Task list for Schedule Creation Validation"
---

# Tasks: Schedule Creation Validation

**Input**: Design documents from `specs/006-schedule-validation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/schedule-validation.contract.md, quickstart.md

**Tests**: Included. The project constitution (Principle VIII) and quickstart.md require runnable checks for the compare helpers and the close guard.

**Organization**: Tasks are grouped by user story so each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths are included in each task

## Path Conventions

Frontend-only feature. All paths are under `frontend/src/`.

---

## Phase 1: Setup (Shared Types)

**Purpose**: Declare the shared types that every story imports.

- [x] T001 [P] Add compare types `KnownCourse`, `KnownSchedule`, `ScheduleCandidate` in `frontend/src/utils/scheduleValidation.ts`
- [x] T002 [P] Add draft types `DraftCourse`, `DraftSchedule` in `frontend/src/composables/useCourseDrafts.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Time helpers, the session store, and the known-set join. Every user story depends on these.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Implement `timeToMinutes(value: string): number` and `rangesOverlap(aStart, aEnd, bStart, bEnd): boolean` in `frontend/src/utils/scheduleValidation.ts`
- [x] T004 [P] Unit test `timeToMinutes` and `rangesOverlap` in `frontend/src/utils/__tests__/scheduleValidation.spec.ts` (cases: `"09:00"` and `"09:00:00"` both yield `540`; empty and malformed yield `NaN`; adjacent ranges return `false`; same-time start/end yields no match)
- [x] T005 Implement the `useCourseDrafts` store (`draftCourses`, `draftSchedules`, `stageCourse`, `stageSchedule`, `resetDrafts`, `flush`) in `frontend/src/composables/useCourseDrafts.ts`
- [x] T006 [P] Unit test `useCourseDrafts` in `frontend/src/composables/__tests__/useCourseDrafts.spec.ts` (stage adds a course and a schedule; `resetDrafts` clears both; `flush` calls `coursesApi.create` then `schedulesApi.create`)
- [x] T007 Implement `buildKnownSet(courses, schedules, drafts): { courses: KnownCourse[], schedules: KnownSchedule[] }` in `frontend/src/utils/scheduleValidation.ts`
- [x] T008 [P] Unit test `buildKnownSet` in `frontend/src/utils/__tests__/scheduleValidation.spec.ts` (stored courses and drafts both appear; each `KnownSchedule` carries its `courseName`)

**Checkpoint**: Foundation ready. User stories can proceed.

---

## Phase 3: User Story 1 - Prevent duplicate course entries (Priority: P1) — MVP

**Goal**: Block a save when the entered title matches a known course name.

**Independent Test**: Enter a title that matches a stored or encoded course. The save is blocked with a duplicate message. A unique title saves.

### Tests for User Story 1

- [x] T009 [P] [US1] Unit test `findDuplicateName` in `frontend/src/utils/__tests__/scheduleValidation.spec.ts` (exact, different case, and surrounding spaces all match; a different name returns `null`)
- [x] T010 [US1] Add a view test in `frontend/src/views/__tests__/CreateScheduleView.spec.ts` for a duplicate title blocking the save with the duplicate message

### Implementation for User Story 1

- [x] T011 [US1] Implement `findDuplicateName(name, known): KnownCourse | null` in `frontend/src/utils/scheduleValidation.ts`
- [x] T012 [US1] In `frontend/src/views/CreateScheduleView.vue`, stage a valid save into `useCourseDrafts` (`stageCourse` and `stageSchedule`) instead of calling `coursesApi.create` and `schedulesApi.create` directly
- [x] T013 [US1] In `frontend/src/views/CreateScheduleView.vue`, block the save in `submit()` when `findDuplicateName` matches, and show a message that contains the entered name (FR-002, FR-003). Skip the check and let the save proceed when the known set is unavailable (FR-016)
- [x] T014 [US1] In `frontend/src/views/CreateScheduleView.vue`, keep the staged course in the known set so a later check in the same session sees it (FR-015), and ensure a retry does not report a duplicate (FR-017)
- [x] T015 [US1] Update the existing `CreateScheduleView.spec.ts` expectations that assert `coursesApi.create` and `schedulesApi.create` are called, to match the staging path

**Checkpoint**: User Story 1 works on its own. This is the MVP.

---

## Phase 4: User Story 2 - Prevent overlapping class times (Priority: P2)

**Goal**: Block a save when a selected class time overlaps a known class or a sibling block on the same weekday.

**Independent Test**: Add a class time that overlaps a known class on the same weekday. The save is blocked and names the clash. Adjacent times and a different weekday pass.

### Tests for User Story 2

- [x] T016 [P] [US2] Unit test `findClash` in `frontend/src/utils/__tests__/scheduleValidation.spec.ts` (overlap on the same weekday clashes; adjacent times pass; a different weekday passes)
- [x] T017 [US2] Add a view test in `frontend/src/views/__tests__/CreateScheduleView.spec.ts` for a clashing weekday blocking the save and naming the course and weekday

### Implementation for User Story 2

- [x] T018 [US2] Implement `findClash(candidate, known): KnownSchedule | null` in `frontend/src/utils/scheduleValidation.ts`
- [x] T019 [US2] In `frontend/src/views/CreateScheduleView.vue`, block the save in `submit()` when any selected weekday of any block clashes, and name the clashing course and weekday (FR-004, FR-005, FR-006, FR-007)
- [x] T020 [US2] In `frontend/src/views/CreateScheduleView.vue`, include the student's other blocks in the clash set so overlapping same-weekday blocks are blocked (FR-012)

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 5: User Story 4 - Protect unsaved work on close (Priority: P2)

**Goal**: Show a keep-editing or discard dialog on a user-initiated close with unsaved work.

**Independent Test**: Enter a title, close the drawer, confirm the dialog. "Keep editing" keeps the draft. "Discard" resets and closes. An untouched or saved form closes with no dialog.

### Tests for User Story 4

- [x] T021 [P] [US4] Component test `DiscardDraftConfirmDialog` in `frontend/src/components/__tests__/DiscardDraftConfirmDialog.spec.ts` (two actions; `keepEditing` and `discard` emits; Escape emits `keepEditing`)
- [x] T022 [US4] Add view tests in `frontend/src/views/__tests__/CreateScheduleView.spec.ts` for the close guard (unsaved close shows the dialog; "Discard" resets and closes; "Keep editing" keeps the draft; untouched and saved closes show no dialog)

### Implementation for User Story 4

- [x] T023 [P] [US4] Create `frontend/src/components/DiscardDraftConfirmDialog.vue` from the `DeleteScheduleConfirmDialog.vue` pattern (props `open`; emits `update:open`, `keepEditing`, `discard`; destructive "Discard" action; 44px targets)
- [x] T024 [US4] In `frontend/src/views/CreateScheduleView.vue`, add `hasUnsavedChanges` (non-empty title, any selected weekday or time, or a failed or pending record) and intercept every user-initiated close (X button, swipe-down, Escape) (FR-021, FR-022, FR-024)
- [x] T025 [US4] In `frontend/src/views/CreateScheduleView.vue`, wire the dialog: "Discard" resets the form to one blank block, clears `pendingSlot`, resets the color, and closes. "Keep editing" closes the dialog and keeps the drawer open (FR-023, FR-025)

**Checkpoint**: User Stories 1, 2, and 4 all work independently.

---

## Phase 6: User Story 3 - Guide valid weekday selection (Priority: P3)

**Goal**: Mark clashing weekdays unavailable, clear a selection that becomes unavailable, and disable add-another-time when all seven clash.

**Independent Test**: Set a time that clashes on some weekdays. Those weekdays are unavailable and cannot be selected. Occupy all seven and the add action is disabled.

### Tests for User Story 3

- [x] T026 [P] [US3] Unit test `unavailableDaysFor` in `frontend/src/utils/__tests__/scheduleValidation.spec.ts` (a known clash marks that weekday; a sibling block marks its weekday; an empty time yields `[]`)
- [x] T027 [P] [US3] Extend `frontend/src/components/__tests__/TimeBlockCard.spec.ts` for the `unavailableDays` prop (a listed weekday is disabled and emits no `toggleDay`)
- [x] T028 [US3] Add view tests in `frontend/src/views/__tests__/CreateScheduleView.spec.ts` for weekday marking, selection clearing on a time change, and the disabled add-another-time action

### Implementation for User Story 3

- [x] T029 [US3] Implement `unavailableDaysFor(block, known, siblings): DayOfWeek[]` in `frontend/src/utils/scheduleValidation.ts`
- [x] T030 [US3] Add the `unavailableDays: DayOfWeek[]` prop to `frontend/src/components/TimeBlockCard.vue` and disable those weekday toggle items (FR-009, FR-010)
- [x] T031 [US3] In `frontend/src/views/CreateScheduleView.vue`, recompute unavailable weekdays when a block time changes and clear a selected weekday that became unavailable (FR-011)
- [x] T032 [US3] In `frontend/src/views/CreateScheduleView.vue`, disable the add-another-time button only when all seven weekdays are unavailable for the current block time (FR-013, FR-014)

**Checkpoint**: All four user stories work independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup that spans stories.

- [x] T033 [P] Run `npm run lint:oxlint` and `npm run type-check` in `frontend/` and fix all errors
- [x] T034 Run the `quickstart.md` manual mobile checks end to end
- [x] T035 [P] Confirm FR-018 and FR-019: no hourly control, no priority value, and no backend edit in this feature
- [x] T036 Remove any dead code and unused imports the edits in `frontend/src/views/CreateScheduleView.vue` create

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Stories (Phase 3-6)**: All depend on Foundational. US1 and US4 are independent. US2 and US3 share the time helpers but use different functions.
- **Polish (Phase 7)**: Depends on all stories.

### User Story Dependencies

- **US1 (P1)**: Needs `buildKnownSet`, `findDuplicateName`, `useCourseDrafts`.
- **US2 (P2)**: Needs `findClash` and the sibling-block set. Independent of US1.
- **US4 (P2)**: Needs the dialog and `hasUnsavedChanges`. Independent of all other stories.
- **US3 (P3)**: Needs `unavailableDaysFor`. Reuses the conflict data from US2 but its pure function stands alone.

### Within Each User Story

- Tests then implementation.
- Pure helpers before the view wiring.

### Parallel Opportunities

- T001 and T002 run in parallel.
- T003, T004, T006, T008 run in parallel.
- T009, T021, T026, T027 run in parallel.
- T023 (dialog) can start any time after Setup.
- US1 and US4 can proceed in parallel after Foundational.

---

## Parallel Example: User Story 1

```text
Task: "T009 Unit test findDuplicateName in frontend/src/utils/__tests__/scheduleValidation.spec.ts"
Task: "T011 Implement findDuplicateName in frontend/src/utils/scheduleValidation.ts"
```

## Parallel Example: Across Stories (after Foundational)

```text
Developer A: Phase 3 (US1 duplicate name)
Developer B: Phase 5 (US4 close guard)
Developer C: Phase 4 (US2 overlap)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and VALIDATE: a duplicate title blocks the save, a unique title stages.
5. Demo.

### Incremental Delivery

1. Setup + Foundational.
2. US1 test independently.
3. US2 test independently.
4. US4 test independently.
5. US3 test independently.

---

## Notes

- [P] tasks use different files and have no dependencies.
- Keep the compare helpers pure and unit tested.
- The bulk-freeze feature is out of scope. `flush` is the handoff point.
- Verify tests fail before implementing.
