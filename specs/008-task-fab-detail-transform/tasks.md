---

description: "Task list for Task FAB and Task Detail Container Transform"
---

# Tasks: Task FAB and Task Detail Container Transform

**Input**: Design documents from `/specs/008-task-fab-detail-transform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contracts.md, quickstart.md

**Tests**: Test tasks ARE included. quickstart.md requires spec files for `taskForm`, `TaskDetailPanel`, `TaskContainerModal`, and `TodoView`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- All paths are relative to the repository root. Frontend only — no backend changes.

## Path Conventions

- Components: `frontend/src/components/tasks/`
- Views: `frontend/src/views/`
- Utils and tests: `frontend/src/utils/`, `frontend/src/**/__tests__/`
- Reused helpers: `useNoteTransition` (`frontend/src/composables/useNoteTransition.ts`), `TapOriginRect`/`AnimationPhase` (`frontend/src/types/notesTransition.ts`), `getPlanCategory` (`frontend/src/utils/planCategory.ts`), `minutesToDuration`/`durationToMinutes` (`frontend/src/utils/duration.ts`), `formatDuration`/`getTaskUrgency` (`frontend/src/utils/taskUrgency.ts`), `getCourseColor` (`frontend/src/utils/courseColors.ts`), `useTasks` (`frontend/src/composables/useTasks.ts`), `useCatalog` (`frontend/src/composables/useCatalog.ts`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new component folder scaffold required by the plan

- [x] T001 Create `frontend/src/components/tasks/` and `frontend/src/components/tasks/__tests__/` directories per plan structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure form-state helpers shared by the create form (US1) and the detail/edit panel (US2, US4)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Implement pure helpers in `frontend/src/utils/taskForm.ts`: define `TaskFormState` (`title` string — required after trim; `courseId` number or null — required; `description` string — empty becomes `null` in the request; `scheduledDate` string — empty becomes `null`, format `YYYY-MM-DD`; `durationMinutes` number or null — null means "Not set"), `fromTask(task: TaskResponse): TaskFormState` (convert `duration` ISO-8601 via `durationToMinutes()`), `toTaskRequest(form: TaskFormState, status: TaskStatus): TaskRequest` (convert `durationMinutes` via `minutesToDuration()`; `status` carries the current status, `TODO` for a new task), `formIsDirty(form, task)` (form differs from the loaded task; a new task is dirty after any input), `formCanSave(form)` (`title` has non-blank text and `courseId` is set), and `formSection(form)` returning `getPlanCategory({ scheduledDate, duration: minutesToDuration(form.durationMinutes) })`
- [x] T003 [P] Write unit tests for the helpers in `frontend/src/utils/__tests__/taskForm.spec.ts`: title trim and required check, `courseId` required, empty `description`/`scheduledDate` → `null`, "Not set" duration → `null`, `durationMinutes` ↔ ISO-8601 roundtrip, `formIsDirty` against a loaded `TaskResponse`, `formSection` tri-state (date → Scheduled, duration only → Later, neither → Backlog)

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Create a Task from the To-do View (Priority: P1) 🎯 MVP

**Goal**: Student taps a floating add task button; a container expands from the button into a blank task form; save creates the task through `useTasks().createTask()` and the new task appears in the list without a reload

**Independent Test**: Tap the add task button, fill in a title and course, and save. The new task appears in the correct to-do section and persists after reload.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T004 [P] [US1] Write `TaskContainerModal` open/expand tests in `frontend/src/components/tasks/__tests__/TaskContainerModal.spec.ts`: renders `task-modal` with `role="dialog"`, `aria-modal="true"`, `aria-label="Task"`; `task-modal-backdrop` scrim present; `task-modal-container` starts at `originRect` geometry via `getOriginStyle`; emits `close` after collapse
- [x] T005 [P] [US1] Write `TaskDetailPanel` create-mode tests in `frontend/src/components/tasks/__tests__/TaskDetailPanel.spec.ts`: `taskId = null` renders a blank form titled "New task"; save blocked when `title` blank or `courseId` unset with a field-level message; with no courses the form explains a course is required and blocks save; successful save calls `createTask` with `toTaskRequest(form, 'TODO')` and emits `close`
- [x] T006 [P] [US1] Write `TodoView` FAB tests in `frontend/src/views/__tests__/TodoView.spec.ts`: `data-testid="tasks-fab"` renders with `aria-label="Add task"`, `Plus` icon, 56×56 px, bottom right; tap captures the FAB rect and opens the modal with `taskId = null`; taps are ignored while the container is open or animating

### Implementation for User Story 1

- [x] T007 [US1] Create the overlay shell `frontend/src/components/tasks/TaskContainerModal.vue` (`<script setup lang="ts">`): props `isOpen: boolean`, `taskId: string | null`, `originRect: TapOriginRect | null`; copy the phase and timer logic from `frontend/src/components/notes/NoteEditorModal.vue` reusing `EXPAND_DURATION_MS` (320 ms), `COLLAPSE_DURATION_MS` (240 ms), `getOriginStyle`, `calculateTargetStyle`, `isReducedMotion` from `useNoteTransition`; render a translucent scrim plus the container animating `top`, `left`, `width`, `height`, `border-radius`, `opacity`; lock body scroll while open; ignore a second open while `isOpen`; emit `close` after the collapse ends
- [x] T008 [US1] Create `frontend/src/components/tasks/TaskDetailPanel.vue` create mode (`<script setup lang="ts">`): props `taskId`, `showContent`, `showControls`, `embedded`; events `close`, `deleted`, `missing`; header bar `h-14` with 3 px bottom border (same chrome as `NoteEditor`) — back/close left (44 px), "New task" title centered (Quicksand 700), save right (44 px, tactile cyan, visible only when dirty); identity zone — `task-title` multi-line field (Quicksand 700, `text-2xl`, accessible name "Task title"), course chip under title opening a `native-select` of `useCatalog().courses`; plan zone — one white `rounded-2xl` card with three 44 px rows: `task-date` date row (`Calendar` icon, `input type="date"`, clear control), `task-duration` duration row (`Clock` icon, `native-select` presets 15 m / 30 m / 45 m / 1 h / 1.5 h / 2 h / 3 h plus "Not set"), `task-section` derived badge `Scheduled`/`Later`/`Backlog` updating live with `aria-label="Plan section: <label>"`; description zone — white card, `task-description` textarea (Inter 400, placeholder "Add details"); save calls `useTasks().createTask(toTaskRequest(form, 'TODO'))`, appends the returned DTO via the existing composable (no `list()` refetch), then emits `close`; on failure keep entered data and show `task-error` with a Retry action; no `import.meta.env.DEV` branches
- [x] T009 [US1] Update `frontend/src/views/TodoView.vue`: add `TaskModalState` (`open`, `taskId: string | null`, `originRect: TapOriginRect | null`, `triggerKind: 'row' | 'fab'`); render the FAB (`bg-primary`, `rounded-2xl`, 56 px, `Plus` icon, `data-testid="tasks-fab"`, `aria-label="Add task"`) bottom right inside the to-do root, staying above the shell navigation bar and clear of `DuckotaButton` at bottom left; on tap capture the rect with `toTapOriginRect(event.currentTarget)` and open `TaskContainerModal` rendered inside the view root with `taskId = null` so the list stays mounted

**Checkpoint**: US1 fully functional — create flow testable end to end

---

## Phase 4: User Story 2 — Expand Task Detail from a Task Row (Priority: P1)

**Goal**: Student taps a task row; the container expands from the row boundary into a detail showing the saved task data (title, status, course name and color, date, duration, description, source-note link, section label)

**Independent Test**: Tap any task row. The container expands from the row boundary to fill the viewport and shows the title, course, date, duration, and status of that task.

### Tests for User Story 2

- [x] T010 [P] [US2] Extend `frontend/src/components/tasks/__tests__/TaskDetailPanel.spec.ts` for view mode: detail loads the task and shows title, `Mark task as completed` checkbox status, course chip with `getCourseColor` colors, date, duration via `formatDuration`, full description, and live section badge; `task-source-note` row (`FileText` icon, "From a note", links to `/notes/:id`) renders only when `noteId` is set; a 404 emits `missing`
- [x] T011 [P] [US2] Extend `frontend/src/views/__tests__/TodoView.spec.ts` for row tap: tapping a visible row captures its rect via `toTapOriginRect(event.currentTarget)` and opens the modal with that `taskId`; a partly visible row expands from its visible part

### Implementation for User Story 2

- [x] T012 [US2] Add row-tap handling in `frontend/src/views/TodoView.vue`: each task row captures its boundary and opens `TaskContainerModal` with `taskId` and `triggerKind = 'row'` (no status-toggle conflict — keep the existing checkbox toggle behavior unchanged)
- [x] T013 [US2] Implement view mode in `frontend/src/components/tasks/TaskDetailPanel.vue`: resolve the task from the `useTasks()` `tasks` cache by ID, fall back to `tasksApi.get(id)` on a cache miss (direct link), emit `missing` on 404; render identity zone with the 44 px `Checkbox` ("Mark task as completed"), title, and course chip; date row icon colored by `getTaskUrgency`; source zone row only when `noteId` exists; title "Task" in the header for view mode
- [x] T014 [US2] Wire the status checkbox in `frontend/src/components/tasks/TaskDetailPanel.vue` to `useTasks().updateTaskStatus(id, status)` with optimistic update and rollback, matching the list behavior
- [x] T015 [US2] Update `frontend/src/views/TaskDetailView.vue`: render `TaskDetailPanel` with `embedded = false` and no origin animation; on `missing` replace the route with `/tasks` (replacing the current empty stub that redirects to `/`)

**Checkpoint**: US1 and US2 both work independently — create and open detail

---

## Phase 5: User Story 3 — Dismiss Task Detail Back to Origin (Priority: P1)

**Goal**: Back control or device back gesture contracts the container into the original row or button boundary; the to-do list keeps scroll position and active filter

**Independent Test**: Open a task detail, then dismiss it with the back control and with the device back gesture. The container contracts to the trigger boundary in both cases.

### Tests for User Story 3

- [x] T016 [P] [US3] Extend `frontend/src/components/tasks/__tests__/TaskContainerModal.spec.ts`: close on Escape, scrim tap, and `popstate`; one history entry pushed on open (`{ nyareTaskModal: true }`); collapse animates back to `originRect`; `close` emitted only after the collapse ends
- [x] T017 [P] [US3] Extend `frontend/src/views/__tests__/TodoView.spec.ts`: after a full open → dismiss cycle the list keeps its scroll position and `activeFilter`

### Implementation for User Story 3

- [x] T018 [US3] Implement dismissal in `frontend/src/components/tasks/TaskContainerModal.vue` following `NoteEditorModal`: push a history entry `{ nyareTaskModal: true }` on open, handle `popstate` to close without leaving the to-do view, close on Escape and scrim tap, contract the container into the captured boundary with `COLLAPSE_DURATION_MS` (240 ms)
- [x] T019 [US3] Verify in `frontend/src/views/TodoView.vue` that the list is not remounted or refiltered across open/dismiss (modal lives inside the view root; scroll container and `activeFilter` state are untouched by modal state)

**Checkpoint**: Open/dismiss cycle complete for both FAB and row origins

---

## Phase 6: User Story 4 — Edit and Delete a Task in Detail (Priority: P2)

**Goal**: Student edits title, description, date, or duration in the open detail and saves; student may delete the task after confirmation; the list reflects changes when the container closes

**Independent Test**: Open a task, change the title, and save — the list shows the new title. Delete the task and confirm — the row disappears.

### Tests for User Story 4

- [x] T020 [P] [US4] Extend `frontend/src/components/tasks/__tests__/TaskDetailPanel.spec.ts`: save sends the complete `TaskRequest` (including current `status`, since `PUT /api/tasks/{id}` replaces) via `updateTask`; list shows the returned DTO without a `list()` refetch; save button visible only when `formIsDirty`; delete opens a `DialogShell` confirmation and on confirm calls `deleteTask(id)` then emits `deleted`; a failed save or delete keeps the entered data, shows `task-error` with Retry, and leaves the container open

### Implementation for User Story 4

- [x] T021 [US4] Implement edit-save in `frontend/src/components/tasks/TaskDetailPanel.vue`: track `formIsDirty` against the loaded task; save calls `useTasks().updateTask(id, toTaskRequest(form, task.status))` and replaces the DTO in `tasks` from the response
- [x] T022 [US4] Implement delete in `frontend/src/components/tasks/TaskDetailPanel.vue`: danger-zone red tactile `task-delete` button (view mode only) opens a confirmation dialog built on `DialogShell` (Duckota peek per DESIGN 8.3); confirmed delete calls `useTasks().deleteTask(id)`, removes the ID from `tasks`, emits `deleted`
- [x] T023 [US4] Handle the deleted-origin collapse in `frontend/src/components/tasks/TaskContainerModal.vue`: on `deleted`, close with the reduced-motion fade for that close only (the origin row no longer exists)
- [x] T024 [US4] Add failure handling in `frontend/src/components/tasks/TaskDetailPanel.vue`: on save or delete failure keep the form data, show `task-error` with a Retry action, and keep the container open; a protected `401` flows through the existing unauthorized handler

**Checkpoint**: Full create/read/update/delete loop works in the detail panel

---

## Phase 7: User Story 5 — Staggered Reveal and Reduced Motion (Priority: P2)

**Goal**: Content reveals after the container motion starts (content before controls); reduced-motion users see an opacity crossfade with no spatial scaling

**Independent Test**: Open a task container with normal motion, then with reduced motion enabled. Normal motion shows the staggered reveal; reduced motion shows a crossfade only.

### Tests for User Story 5

- [x] T025 [P] [US5] Extend `frontend/src/components/tasks/__tests__/TaskContainerModal.spec.ts`: header/identity/plan zones appear at `showContent` (`CONTENT_DELAY_MS` = 100 ms); save, delete, and the description card appear at `showControls` (`CONTROLS_DELAY_MS` = 180 ms); on dismissal content and controls hide before contraction; with reduced motion the container uses `REDUCED_MOTION_DURATION_MS` (150 ms) opacity fade and no spatial scaling

### Implementation for User Story 5

- [x] T026 [US5] Wire the phased reveal in `frontend/src/components/tasks/TaskContainerModal.vue`: drive `showContent` and `showControls` timers (100 ms / 180 ms) matching `NoteEditorModal`, pass them to `TaskDetailPanel`, and hide content/controls before the collapse starts
- [x] T027 [US5] Implement the reduced-motion path and resize behavior in `frontend/src/components/tasks/TaskContainerModal.vue`: when `isReducedMotion()` is true use an opacity crossfade only; on viewport resize while open the container fills the new viewport

**Checkpoint**: Motion matches the notes view in both normal and reduced-motion modes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup across all stories

- [x] T028 Run `npm run lint:oxlint` and `npm run type-check` in `frontend/`; fix all findings
- [x] T029 Run the four targeted spec files from quickstart.md (`npx vitest run` on `taskForm`, `TaskDetailPanel`, `TaskContainerModal`, `TodoView` specs) and confirm all pass
- [ ] T030 Walk quickstart.md manual scenarios 1–9 in `npm run dev` at a 390 px viewport and record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–7)**: All depend on Foundational completion
  - US1 must land before US2/US3 (they reuse `TaskContainerModal` and `TaskDetailPanel` it introduces)
  - US3, US4, US5 refine the same modal/panel files — run sequentially after US1+US2 to avoid same-file conflicts
- **Polish (Phase 8)**: Depends on all desired stories being complete

### User Story Dependencies

- **US1 (P1)**: After Foundational — introduces `TaskContainerModal` + `TaskDetailPanel` create mode + FAB
- **US2 (P1)**: Depends on US1's modal/panel skeleton (same files)
- **US3 (P1)**: Depends on US1's modal skeleton (same file `TaskContainerModal.vue`)
- **US4 (P2)**: Depends on US2's view-mode panel (same file `TaskDetailPanel.vue`)
- **US5 (P2)**: Depends on US1/US3 modal timing logic (same file `TaskContainerModal.vue`)

> Because US2–US5 extend the same two component files, stories are sequential despite being independently testable.

### Within Each User Story

- Tests (included) MUST be written and FAIL before implementation
- Pure helpers before components
- Modal shell before panel content before view wiring
- Story complete before moving to next priority

### Parallel Opportunities

- T002 and T003 (different files) in Phase 2
- T004, T005, T006 (three different spec files) in Phase 3
- T010, T011 in Phase 4; T016, T017 in Phase 5
- All test-extension tasks are parallelizable with each other but not with the implementation they cover

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "TaskContainerModal open/expand tests in frontend/src/components/tasks/__tests__/TaskContainerModal.spec.ts"
Task: "TaskDetailPanel create-mode tests in frontend/src/components/tasks/__tests__/TaskDetailPanel.spec.ts"
Task: "TodoView FAB tests in frontend/src/views/__tests__/TodoView.spec.ts"

# Then implement sequentially (same-file deps):
Task: "TaskContainerModal.vue overlay shell" → Task: "TaskDetailPanel.vue create mode" → Task: "TodoView FAB + modal state"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (`taskForm.ts` helpers)
3. Complete Phase 3: User Story 1 (FAB → expand → create → save)
4. **STOP and VALIDATE**: create a task end to end per quickstart scenario 1–3
5. Demo if ready

### Incremental Delivery

1. Setup + Foundational → helpers proven by `taskForm.spec.ts`
2. US1 → create flow works (MVP!)
3. US2 → detail opens from rows; direct link `/tasks/:id` works
4. US3 → dismiss/back-gesture contraction verified
5. US4 → edit/delete loop complete
6. US5 → motion parity with notes view incl. reduced motion
7. Each story adds value without breaking previous stories

### Sequential Component Strategy

Because US2–US5 all refine `TaskContainerModal.vue` / `TaskDetailPanel.vue`, a single implementer (or one at a time) walks the story phases in order; test tasks within a phase remain parallelizable.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing
- Commit after each task or logical group (only when the user requests commits — repo rule)
- Stop at any checkpoint to validate the story independently
- Constitution guardrails for every component task: no time-of-day fields, no priority scores, no `import.meta.env.DEV` in views, mutation responses update local state (no `list()` refetch), empty date/duration stay `null` (never invented)
