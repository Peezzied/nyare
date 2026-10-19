---

description: "Task list for the create schedule week calendar preview"
---

# Tasks: Create Schedule Week Calendar Preview

**Input**: Design documents from `specs/007-schedule-week-preview/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/week-preview.contract.md, quickstart.md

**Tests**: The feature spec does not request TDD. This plan includes one focused unit test task for the non-trivial tap and derivation math (the project requires a check for non-trivial logic).

**Organization**: Tasks are grouped by user story. Each story is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All paths are relative to `frontend/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the reused tokens and prepare the test location

- [x] T001 [P] Confirm the reused exports and their import paths: `HOUR_HEIGHT` in `src/constants/calendar.ts`, `WEEKDAYS` and `TimeBlockDraft` in `src/components/TimeBlockCard.vue`, `COURSE_PALETTE_24` in `src/constants/palette.ts`, `formatTime12h` in `src/utils/scheduleExpander.ts`. Confirm no new npm dependency is needed.
- [x] T002 [P] Create the test directory `src/utils/__tests__/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure helpers that every user story needs

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add the `PreviewBlock` and `PendingSlot` interfaces to `src/utils/weekPreview.ts`. Copy the field names and types from `specs/007-schedule-week-preview/data-model.md` verbatim. `PreviewBlock.id` is `` `${block.id}-${day}` ``, `PreviewBlock.title` is the trimmed name, `PreviewBlock.color` is `CoursePaletteColor.solid`, `PreviewBlock.blockId` is the source `TimeBlockDraft.id`.
- [x] T004 Implement `derivePreviewBlocks(blocks, name, color)` in `src/utils/weekPreview.ts`. Emit one `PreviewBlock` per (time block, selected weekday). Skip a block with no selected weekday, an empty start time, an empty end time, or a start time that is not before the end time. Set `title` to `name.trim()` (blank name yields `''`). Set `color` to `color.solid`.
- [x] T005 Implement `slotFromOffset(offsetX, offsetY, gridWidth)` in `src/utils/weekPreview.ts`. Compute `dayIndex = floor(offsetX / (gridWidth / 7))` and read the weekday from `WEEKDAYS`. Compute `startHour = floor(offsetY / HOUR_HEIGHT)` snapped down and clamped to 23. Return `{ day, startTime: 'HH:00', endTime: 'HH+1:00' }`, or `null` when either offset is outside the grid.
- [x] T006 Write unit tests for both helpers in `src/utils/__tests__/weekPreview.spec.ts`. Cover the `derivePreviewBlocks` cases (two days, no weekday, invalid time, blank name, trimmed name, color) and the `slotFromOffset` cases (column and hour mapping, clamp at hour 23, out-of-bounds returns `null`) from `specs/007-schedule-week-preview/quickstart.md`. Run `npx vitest run src/utils/__tests__/weekPreview.spec.ts` and confirm it passes.

**Checkpoint**: The helpers pass. User story work can begin.

---

## Phase 3: User Story 1 - See the course on a week calendar while building it (Priority: P1) MVP

**Goal**: Show a live week grid in the create schedule form. Each class time draws a block. A tap on empty space adds a one-hour class time and opens the form sheet prefilled. A tap on a block opens the form to edit it.

**Independent Test**: Open the form. Enter a name. Select Monday and set 09:00 to 10:00. Confirm one block on Monday from 09:00 to 10:00. Change the end time and confirm the block resizes. Tap an empty slot and confirm the outline covers one hour and the sheet opens prefilled.

### Implementation for User Story 1

- [x] T007 [US1] Create `src/components/WeekPreview.vue`. Render a weekday header row from `WEEKDAYS` and a 24-hour axis with rows at `HOUR_HEIGHT` (import from `src/constants/calendar.ts`). The grid scrolls vertically and never scrolls horizontally. Props: `blocks: PreviewBlock[]`, `pendingSlot: PendingSlot | null`, `selectedColor: string`. Emits: `selectSlot(slot: PendingSlot)`, `selectBlock(blockId: string)`.
- [x] T008 [US1] Render each `PreviewBlock` in `WeekPreview.vue` as an absolutely positioned element. Place the block by `day` (column) and by `startTime` and `endTime` (vertical offset and height from `HOUR_HEIGHT`). Fill the block with `PreviewBlock.color`. Emit `selectBlock(block.blockId)` on tap. Keep each block a minimum 44px touch target.
- [x] T009 [US1] Handle an empty-space tap in `WeekPreview.vue`. Read the pointer offset inside the grid, call `slotFromOffset(offsetX, offsetY, gridWidth)`, and emit `selectSlot(slot)` when the result is not `null`. Render the one-hour `pendingSlot` outline when `pendingSlot` is set.
- [x] T010 [US1] Mount `WeekPreview` in `src/views/CreateScheduleView.vue`. Replace the blank root background div (`bg-[#F6F7EE]` at line 341). Pass `blocks="derivePreviewBlocks(blocks, courseName, selectedColor)"`, `:pending-slot`, and `:selected-color="selectedColor.solid"`. Keep the existing `Drawer` and its `partial`/`full` stages.
- [x] T011 [US1] Handle `selectSlot` in `src/views/CreateScheduleView.vue`. Add a prefilled `TimeBlockDraft` with `selectedDays: [slot.day]`, `startTime: slot.startTime`, and `endTime: slot.endTime`. Call `syncScheduleDrafts(block)`. Set `pendingSlot`. Set the sheet stage to `partial`. Keep the current form values.
- [x] T012 [US1] Handle `selectBlock` in `src/views/CreateScheduleView.vue`. Focus and scroll to the time block whose `id` equals the payload. Open the sheet. Start no new class time.
- [x] T013 [US1] Clear `pendingSlot` and discard the pending unsaved draft when the student closes the sheet without a save. Hook the existing `onOpenChange` and `goBack` handlers. Keep the existing `submit` save flow unchanged.

**Checkpoint**: User Story 1 works on its own. The preview updates on form changes and both taps work.

---

## Phase 4: User Story 2 - Read the course name on the block (Priority: P2)

**Goal**: Each block shows the course name only.

**Independent Test**: Enter "CS 101" and set a class time. Confirm the block shows "CS 101" and no other text.

### Implementation for User Story 2

- [x] T014 [US2] In `src/components/WeekPreview.vue`, show `PreviewBlock.title` only inside the block. Clip a long name with `truncate` inside the block bounds. Show no room and no description. Render no text when `title` is `''`.

**Checkpoint**: User Stories 1 and 2 both work.

---

## Phase 5: User Story 3 - Read weekday names only in the header (Priority: P3)

**Goal**: The header row shows the seven weekday names only.

**Independent Test**: Open the form and read the header row. Confirm the seven weekday names and no date numbers.

### Implementation for User Story 3

- [x] T015 [US3] In `src/components/WeekPreview.vue`, render the header from `WEEKDAYS` labels only. Show no date number and no real-date emphasis.

**Checkpoint**: All three user stories work independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verification across all stories

- [x] T016 [P] Run `npx oxlint src/ --fix` and `npm run type-check` in `frontend/`. Fix all reported errors.
- [x] T017 Run the `specs/007-schedule-week-preview/quickstart.md` manual check at a 390px viewport. Confirm no horizontal scroll, 44px touch targets, and reduced-motion safety.
- [x] T018 [P] Confirm the preview stores no data (FR-013) and a block tap starts no new class time (FR-021). Confirm a save from the sheet uses the existing create schedule flow (FR-022).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup. Blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational. Run in priority order P1 to P2 to P3.
- **Polish (Phase 6)**: Depends on all target stories.

### User Story Dependencies

- **US1 (P1)**: Needs T003 to T006. Independent.
- **US2 (P2)**: Needs US1 (`WeekPreview.vue`). Small addition to the same file.
- **US3 (P3)**: Needs US1 (`WeekPreview.vue`). Small addition to the same file.

### Within User Story 1

- T007 before T008, T009.
- T010 before T011, T012, T013 (the mount precedes the handlers).

### Parallel Opportunities

- T001 and T002 run in parallel.
- T003 blocks T004 and T005 (same file). T004 and T005 run in sequence.
- T006 follows T004 and T005.
- After Phase 2, T007 starts US1. T008 and T009 are independent additions to `WeekPreview.vue`, but share the file, so run in sequence.
- T016 and T018 are read and check tasks. They can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (T003 to T006). Run the helper tests.
3. Complete Phase 3: User Story 1.
4. **STOP and VALIDATE**: Open the form, enter a class time, confirm the block, and confirm both taps.
5. Ship the MVP.

### Incremental Delivery

1. Setup and Foundational give the tested helpers.
2. US1 gives the live preview and both taps.
3. US2 confirms the name-only block.
4. US3 confirms the weekday-only header.
5. Polish runs the lint, type check, and manual check.

---

## Notes

- [P] means a different file with no incomplete dependency.
- [US#] maps a task to its user story.
- Reuse existing code. Do not install a new dependency. Do not reuse the schedule-x `WeekCalendar`.
- Mark any deliberate simplification with a `ponytail:` comment.
