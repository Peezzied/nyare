---
description: "Task list for Calendar Item Details and Week-View Category Markers"
---

# Tasks: Calendar Item Details and Week-View Category Markers

**Input**: Design documents from `/specs/008-calendar-item-details/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Minimal tests are included for the non-trivial builder rules and marker mapping. The spec does not request a full test suite (Ponytail: one runnable check per non-trivial unit).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Frontend-only feature. Paths are relative to `frontend/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Land the detail-view presentation prerequisite and confirm existing reuse points.

- [x] T001 Confirm the calendar detail modal host and its click wiring are present in `frontend/src/components/day-view/EventDetailModal.vue` (ported in commit `d4867df`). Install `@schedule-x/calendar-controls` at `^4.9.1` to match `@schedule-x/calendar`, because `ScheduleCalendar.vue` and `WeekCalendar.vue` import it, and add it to `frontend/package.json`. Change the `lucide-vue-next` import in `EventDetailModal.vue` to `@lucide/vue`. The imports of `CourseBlockDetail.vue` and `UntimedBlockDetail.vue` inside `EventDetailModal.vue` stay unresolved until T006 replaces them.
- [x] T002 Confirm the reuse points that this feature depends on: `frontend/src/utils/courseColors.ts` (`getCourseDotStyle`), `frontend/src/utils/taskUrgency.ts` (`formatDuration`), `frontend/src/utils/scheduleExpander.ts` (`formatTimeRange`), `frontend/src/utils/planCategory.ts` (`getPlanCategory`), and `frontend/src/api/tasks.ts` (`tasksApi.updateStatus`). Record any missing helper before you start Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared view model, its builder, and the one shared detail component. Every user story depends on these.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Create the shared view model types in `frontend/src/types/calendarItemDetail.ts`. Include `CalendarItemKind` = `'class' | 'task' | 'event'`, `CalendarItemCategory` = `'class' | 'event' | 'task'`, `LinkedNoteRef` (`id: string`, `title: string | null`), `CalendarItemDetailView`, and `CalendarItemMarkerState`. Copy the field constraints verbatim from `specs/008-calendar-item-details/data-model.md` (duration applies to task only, note applies to task and event, timeWindow is `string | null`).
- [x] T004 [P] Create the builder in `frontend/src/utils/calendarItemDetail.ts`. Export `buildCalendarItemDetail` for a class (`DayEvent` + kind), a task (`TaskResponse` + cached notes), and an event (`AcademicEventResponse` + cached notes). Enforce FR-017 (event duration is always null), FR-018 (empty `noteId` sets note to null), FR-019 (unknown duration sets duration to null, never fabricate). Build `timeWindow` with `formatTimeRange` for a class, the scheduled date or the `getPlanCategory` label for a task, and the deadline date and time for an event. Build a task duration with `formatDuration`. Also export `buildMarkerState`.
- [x] T005 Create the shared detail component in `frontend/src/components/day-view/CalendarItemDetail.vue`. Accept the `item: CalendarItemDetailView` prop. Render a field only when its value is non-null (FR-022). Emit `open-note` with the `LinkedNoteRef` and `complete-task` with the task id. Keep the note control and the complete control at a minimum 44 by 44 pixel tap target with an accessible name (FR-020). Render all three kinds from this one component (FR-021).
- [x] T006 Wire the modal host `frontend/src/components/day-view/EventDetailModal.vue` to render `CalendarItemDetail.vue` instead of branching on item type. Forward `open-note` and `complete-task`. Keep the existing expand and collapse motion, the `popstate` handling, and the reduced-motion fallback.

**Checkpoint**: The shared component renders a class, a task, and an event from one view model.

---

## Phase 3: User Story 1 - Identify item categories in the week view (Priority: P1) MVP

**Goal**: Each week-view item shows a category marker that tells a class, an event, and a task apart at a glance.

**Independent Test**: Open the week view on a day that holds a class, an event, and a task. Confirm each item shows its own marker and a screen reader announces the category.

### Tests for User Story 1

- [ ] T007 [P] [US1] Add a marker mapping test in `frontend/src/components/day-view/__tests__/CategoryMarker.spec.ts`. Assert `class` renders no indicator, `event` renders the flag indicator, an open `task` renders the empty completion box, and a completed `task` renders the checked box (FR-001 through FR-005).

### Implementation for User Story 1

- [ ] T008 [P] [US1] Create `frontend/src/components/day-view/CategoryMarker.vue`. Accept `category: CalendarItemCategory` and optional `completed: boolean`. Render the tri-block form: no indicator for a class, a flag or alarm icon for an event, a completion box for a task (checked when completed). Set `aria-hidden="true"` on the icon and expose the category name for the parent item label (FR-002, FR-003, FR-004, FR-005).
- [ ] T009 [US1] Add the class marker and the detail-open tap to `frontend/src/components/day-view/WeekPill.vue`. Use `CategoryMarker` with `category="class"`. Emit the class `DayEvent` and its `DOMRect` on tap (FR-002, FR-006).
- [ ] T010 [US1] Add the task and event markers to `frontend/src/components/day-view/WeekHeaderRow.vue` chips. Use `CategoryMarker` with the item `category` and the `completed` flag. Extend the chip accessible name to include the category. Emit the item and its `DOMRect` on tap (FR-003, FR-004, FR-005).

**Checkpoint**: All week-view items show the correct marker. User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Inspect and complete a task from the calendar (Priority: P1)

**Goal**: A task tap opens the detail view with the linked note, the complete control, the time window, and the duration.

**Independent Test**: Tap a task that has a linked note and a duration. Confirm every field appears. Tap the note link, confirm the note opens. Return and mark the task complete.

### Tests for User Story 2

- [x] T011 [P] [US2] Add a builder test in `frontend/src/utils/__tests__/calendarItemDetail.spec.ts`. Assert a task with no `noteId` sets note to null (FR-018), a task with no duration sets duration to null (FR-019), a task with no `scheduledDate` puts the plan-category label in `timeWindow`, and an event sets duration to null (FR-017).

### Implementation for User Story 2

- [ ] T012 [US2] Wire the task tap to open the detail view. In `frontend/src/components/day-view/DayViewContainer.vue`, build the task view model with `buildCalendarItemDetail` and open the modal. The tap sources `frontend/src/components/day-view/ScheduleCalendar.vue` and `frontend/src/components/day-view/WeekCalendar.vue` forward the tapped untimed item upward (FR-006, FR-008, FR-012, FR-013).
- [ ] T013 [US2] Handle the `open-note` event in `frontend/src/components/day-view/DayViewContainer.vue`. Navigate with `router.push({ name: 'note-edit', params: { id: note.id } })` (FR-009).
- [ ] T014 [US2] Handle the `complete-task` event in `frontend/src/components/day-view/DayViewContainer.vue`. Call `tasksApi.updateStatus(taskId, 'COMPLETED')`, then update the cached task ref from the saved DTO. Do not call `list()` again. On failure, keep the prior state and surface the API error (FR-010, FR-011).

**Checkpoint**: A student completes a task and reaches its note from the calendar. User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Inspect an academic event from the calendar (Priority: P2)

**Goal**: An academic event tap opens the detail view with the linked note and the time window, and no duration.

**Independent Test**: Tap an academic event that has a linked note. Confirm the note link and the time window appear, confirm no duration appears, and confirm the note opens.

### Implementation for User Story 3

- [ ] T015 [US3] Wire the event tap to open the detail view. In `frontend/src/components/day-view/DayViewContainer.vue`, build the event view model with `buildCalendarItemDetail` and open the modal. The tap sources `frontend/src/components/day-view/ScheduleCalendar.vue` and `frontend/src/components/day-view/WeekCalendar.vue` forward the tapped untimed item upward (FR-007, FR-014, FR-016). Confirm no duration field renders (FR-017).

**Checkpoint**: Events show the note link and the time window with no duration. User Stories 1, 2, and 3 work independently.

---

## Phase 6: User Story 4 - Preview every detail state from one shared component (Priority: P3)

**Goal**: One shared component renders all three item types, and mock data covers every state, including the hide states.

**Independent Test**: Open the component preview. Confirm the shared component renders a class, a task, and an event, and that the mock data includes no-note, no-duration, completed, and no-scheduled-date states.

### Implementation for User Story 4

- [ ] T016 [P] [US4] Create `frontend/src/api/mocks/calendarItemDetailFixtures.ts`. Export `CALENDAR_ITEM_DETAIL_FIXTURES`. Cover every state in FR-023: a class, a task with a note, a task without a note, a task with a duration, a task without a duration, a scheduled task, a task with no scheduled date, an open task, a completed task, an event with a note, and an event without a note. Also cover the FR-024 marker states: a class item, an event item, an open task item, a completed task item, and a day with more items than the visible limit.
- [ ] T017 [P] [US4] Create `frontend/src/components/day-view/CalendarItemDetail.story.vue` with one variant per fixture. Do not include test code in the story.
- [ ] T018 [US4] Extend `frontend/src/api/mocks/fixtures.ts` so at least one task and one event carry a `noteId` that resolves to a mock note, and add the over-limit day for FR-024.
- [ ] T019 [US4] Remove the per-type detail components. Delete `frontend/src/components/day-view/CourseBlockDetail.vue` and `frontend/src/components/day-view/UntimedBlockDetail.vue` if they are present on this branch after `CalendarItemDetail.vue` replaces them (FR-021).

**Checkpoint**: All four user stories are functional. One component and complete mock data exist.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification across all stories.

- [ ] T020 [P] Run `npx prettier --check` on only the files this feature creates or changes, `npx oxlint src` (without `--fix`), and `npm run type-check` in `frontend/`. Fix all errors.
- [ ] T021 Run `npm run story` and walk every scenario in `specs/008-calendar-item-details/quickstart.md`. Confirm the hide states, the failure state, and the a11y labels.
- [ ] T022 [P] Verify SC-004 and SC-005: every detailed view shows a time window, every known task duration shows, no event shows a duration, and no fabricated duration or deadline appears.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies. Start immediately.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational. US1 is independent. US2 and US3 reuse the shared component from Foundational.
- **Polish (Phase 7)**: Depends on all desired user stories.

### User Story Dependencies

- **User Story 1 (P1)**: After Foundational. No dependency on other stories.
- **User Story 2 (P1)**: After Foundational. Uses the shared component. Independent of US1.
- **User Story 3 (P2)**: After Foundational. Uses the shared component. Independent of US1 and US2.
- **User Story 4 (P3)**: After Foundational. The mock data and story depend on the view model and the shared component. The removal (T019) depends on T005 and T006.

### Within Each User Story

- Tests before implementation.
- Types before builder.
- Builder before the consuming component.
- Shared component before the host wiring.
- Core wiring before the note and complete handlers.

### Parallel Opportunities

- T003 and T004 run in parallel (different files).
- T007 and T008 run in parallel (test file and component file).
- T016 and T017 run in parallel (fixture file and story file).
- T020 and T022 run in parallel (lint and criteria review).
- US1, US2, and US3 can proceed in parallel once Foundational completes.

---

## Parallel Example: User Story 1

```bash
# Launch the marker test and the marker component together:
Task: "Add the marker mapping test in frontend/src/components/day-view/__tests__/CategoryMarker.spec.ts"
Task: "Create frontend/src/components/day-view/CategoryMarker.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. STOP and VALIDATE: open the week view and confirm each item shows its marker.
5. Demo if ready.

### Incremental Delivery

1. Setup + Foundational → the shared component and view model are ready.
2. User Story 1 → markers → validate → demo.
3. User Story 2 → task detail and mark-complete → validate → demo.
4. User Story 3 → event detail → validate → demo.
5. User Story 4 → mock data and story → validate → demo.
6. Polish → lint, type-check, and quickstart.

---

## Notes

- `[P]` tasks touch different files and have no dependencies.
- `[Story]` labels map each task to its user story.
- Tests cover only the non-trivial logic: the builder null rules and the marker mapping.
- Do not refetch the full task list after mark-complete.
- Do not fabricate a duration or a deadline.
- Keep views and components pure. Mock data stays in `frontend/src/api/mocks/`.
