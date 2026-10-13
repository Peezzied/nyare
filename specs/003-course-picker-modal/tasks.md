# Tasks: Course Picker Modal in Note Editor

**Branch**: `003-course-picker-modal` | **Feature**: Course Picker Modal in Note Editor

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Utility functions for course schedule aggregation and shorthand formatting

- [x] T001 [P] Create course schedule formatting utility `formatCourseSchedule` mapping `ScheduleResponse[]` to deduplicated, sorted shorthand day strings (e.g. `Mo, We, Th`, with fallback `No set schedule`) in frontend/src/utils/scheduleFormat.ts
- [x] T002 [P] Create comprehensive unit test suite for `formatCourseSchedule` verifying day ordering, deduplication, multiple schedules, and empty fallbacks in frontend/src/utils/__tests__/scheduleFormat.spec.ts

---

## Phase 2: Foundational (Component Foundation)

**Purpose**: Verify and prepare shadcn-vue `Dialog` primitives for modal integration

- [x] T003 Verify and export shadcn-vue dialog components in frontend/src/components/ui/dialog/index.ts and confirm clean oxlint/type-check compliance

---

## Phase 3: User Story 1 - Select Course via Modal Dialog (Priority: P1) 🎯 MVP

**Goal**: Deliver the `CoursePickerDialog.vue` component and wire it to replace the native `<select>` dropdown in `NoteEditor.vue` so students can select courses through a focused modal dialog.

**Independent Test**: Open NoteEditor, tap the Course selector trigger pill, verify the modal opens with overlay scrim, tap a course item, and verify the course trigger updates with the course name and palette color while the modal closes.

### Tests for User Story 1

- [x] T004 [P] [US1] Create unit test suite for `CoursePickerDialog.vue` verifying modal open/close states, option rendering with dot and schedule string, selection event emission, and keyboard/escape dismiss in frontend/src/components/editor/__tests__/CoursePickerDialog.spec.ts

### Implementation for User Story 1

- [x] T005 [US1] Implement `CoursePickerDialog.vue` using shadcn `Dialog` primitives, displaying circular color dots, course titles, and schedule strings with 48px touch targets in frontend/src/components/editor/CoursePickerDialog.vue
- [x] T006 [US1] Replace native `<select>` dropdown in `NoteEditor.vue` with a tactile course trigger pill that opens `CoursePickerDialog`, binding `selectedCourseId` and marking `isDirty` on change in frontend/src/views/NoteEditor.vue

---

## Phase 4: User Story 2 - Course Option Layout and Visual Hierarchy (Priority: P2)

**Goal**: Style the course picker dialog to strictly match `DESIGN.md` and reference mockups, including scrollable container, active course indicator, and responsive mobile padding.

**Independent Test**: On a 375px mobile viewport, inspect modal container radii (`rounded-2xl`), parchment surface (`bg-[#FDFEF7]`), active item highlight, and smooth vertical scrolling for catalogs exceeding viewport height.

### Implementation for User Story 2

- [x] T007 [US2] Apply `DESIGN.md` styling to `CoursePickerDialog.vue` including rounded-2xl parchment surface, cyan accents, active course indicator, and vertical scrolling for long course lists in frontend/src/components/editor/CoursePickerDialog.vue
- [x] T008 [P] [US2] Create or update Histoire preview story for `CoursePickerDialog` demonstrating single course, multi-course, and long course catalog variants in frontend/src/components/editor/CoursePickerDialog.story.vue

---

## Phase 5: User Story 3 - Graceful Handling of Empty Course Catalog (Priority: P3)

**Goal**: Present an informative, friendly empty state inside the modal dialog when no courses exist in the catalog.

**Independent Test**: Mount `CoursePickerDialog` with an empty `courses` array and verify an encouraging message directs the student to create courses.

### Implementation for User Story 3

- [x] T009 [US3] Add empty catalog state to `CoursePickerDialog.vue` with friendly guidance and clean dismiss behavior in frontend/src/components/editor/CoursePickerDialog.vue
- [x] T010 [P] [US3] Add unit test case verifying empty state display when `courses` is empty in frontend/src/components/editor/__tests__/CoursePickerDialog.spec.ts

---

## Phase 6: User Story 4 - Strict Save Validation for Course and Date (Priority: P1)

**Goal**: Enforce that both Course (`selectedCourseId`) and Entry Date (`entryDate`) must be non-null and valid before the Save action is enabled in `NoteEditor.vue`.

**Independent Test**: Load `NoteEditor` with text content; verify Save is disabled when Course is null; verify Save is disabled when Date is empty; verify Save is enabled only when Course, Date, and Content are all present.

### Tests for User Story 4

- [x] T011 [P] [US4] Update NoteEditor unit test suite in frontend/src/views/__tests__/NoteEditor.spec.ts to verify Save button is disabled when Course is missing or Date is missing, and enabled when both are valid

### Implementation for User Story 4

- [x] T012 [US4] Update `isSaveDisabled` computed property in `NoteEditor.vue` to strictly require `selectedCourseId !== null`, non-empty `entryDate`, and non-empty `contentMarkdown` before enabling save in frontend/src/views/NoteEditor.vue

---

## Phase 7: Polish & Verification

**Purpose**: Quality gates, linting, type-checking, and end-to-end regression validation

- [x] T013 Run unit test suite `npm run test:unit` and verify all tests pass across `scheduleFormat`, `CoursePickerDialog`, and `NoteEditor`
- [x] T014 Run `npm run type-check` and `npx oxlint src/ --fix` to verify zero TypeScript errors and zero lint violations
