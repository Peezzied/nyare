# Implementation Plan: Task FAB and Task Detail Container Transform

**Branch**: `008-task-fab-detail-transform` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-task-fab-detail-transform/spec.md`

## Summary

Add a floating add task button to the to-do view.
Open a task form or task detail in an overlay that expands from the tapped button or row.
The overlay copies the notes view motion (320 ms expand, 240 ms collapse, staggered reveal, reduced motion fade).
The panel inside the overlay reads and writes tasks through `useTasks()`.
The design of the task detail follows Impeccable in Operate mode on the existing Nyare design system.

## Technical Context

**Language/Version**: TypeScript 5, Vue 3 (`<script setup lang="ts">`), Vite

**Primary Dependencies**: Tailwind 4, `@lucide/vue`, existing `src/components/ui` (checkbox, dialog, native-select). No new dependency.

**Storage**: N/A on the frontend. Backend `/api/tasks` stores tasks (SQLite).

**Testing**: Vitest + Vue Test Utils (jsdom). Specs in `src/**/__tests__/*.spec.ts`.

**Target Platform**: Mobile-first web, 390 px baseline.

**Project Type**: Web application. This feature changes `frontend/` only.

**Performance Goals**: Expand 350 ms or less. Collapse 250 ms or less. Animate `top`, `left`, `width`, `height`, `border-radius`, and `opacity` like the notes view.

**Constraints**: Day-level dates only. No time-blocking. No priority score. No `import.meta.env.DEV` in views. Reuse the mutation response (no `list()` refetch after a mutation).

**Scale/Scope**: 1 new view section (FAB), 2 new components, 1 changed view, 1 changed route view. No backend change.

## Constitution Check

*GATE: Passed before Phase 0. Passed again after Phase 1.*

| Principle | Result |
|---|---|
| I. Virtual study plan, tri-state | Pass. The section label comes from `getPlanCategory()`. No new table. |
| II. Course anchor | Pass. The form requires a course. |
| III. Grounded uncertainty | Pass. Empty date and empty duration stay empty. The form never invents values. |
| IV. Non-destructive planning | Pass. This feature edits tasks for the student only. The planner rules stay unchanged. |
| V/VI. Layer isolation, error strategy | Pass. No backend change. |
| VII. Ponytail minimalism | Pass with 1 noted duplication. See Complexity Tracking. |
| X. Pure views | Pass. Views hold no dev branches. |
| IX. Frontend-backend alignment | Pass. `TaskRequest` fields match the backend DTO. |

## Design Direction (Impeccable)

Mode: **Operate**. The student completes a task. Scanability and consistency outrank expression.
Visual authority: `frontend/DESIGN.md` (parchment, ocean cyan, 16 px cards, 12 px controls, Quicksand and Inter). No new visual world.

**Structural thesis**: The detail reads as one calm sheet with three zones: identity, plan, and notes. The student sees the answer to "what is this and when do I do it" without scrolling.

**Layout at 390 px** (top to bottom):

1. **Header bar** (`h-14`, 3 px bottom border, same chrome as `NoteEditor`): Back or Close on the left (44 px). Title "Task" or "New task" in the center (Quicksand 700). Save on the right (44 px, tactile cyan, visible only when the form has changes or is new).
2. **Identity zone**: A 44 px completion checkbox sits left of the title. The title is a multi-line field (Quicksand 700, `text-2xl`). The course chip sits under the title (course badge colors from the 24 color palette). In edit mode the chip opens a native select of courses.
3. **Plan zone** (one white `rounded-2xl` card, 3 rows with 44 px minimum height):
   - Date row: `Calendar` icon colored by urgency, date input, clear control.
   - Duration row: `Clock` icon, native select with presets (15 m, 30 m, 45 m, 1 h, 1.5 h, 2 h, 3 h) and "Not set".
   - Section row: derived badge Scheduled, Later, or Backlog. The badge updates live as the student edits date and duration. It has an `aria-label` such as "Plan section: Later".
4. **Description zone**: A white card with an Inter 400 text area. Placeholder "Add details".
5. **Source zone** (only when `noteId` exists): A row with the `FileText` icon and the text "From a note". The row links to `/notes/:id`.
6. **Danger zone** (view mode only): A red tactile "Delete task" button at the bottom. It opens a confirmation dialog (existing dialog pattern, Duckota peeks per DESIGN 8.3).

**Reveal stagger**: Header, identity, and plan zones appear at `showContent` (100 ms). Save, delete, and the description card appear at `showControls` (180 ms).

**Floating add task button**: Same look as the notes FAB (`bg-primary`, `rounded-2xl`, 56 px, `Plus` icon). It sits bottom right inside the to-do root and stays above the shell navigation bar. `DuckotaButton` occupies bottom left, so no overlap.

**Anti-goals**: No priority color. No time-of-day field. No hourly slot UI. No decorative gradients. No new fonts.

**Reuse**: `useNoteTransition` helpers (`toTapOriginRect`, `getOriginStyle`, `calculateTargetStyle`, timing constants). `AnimationPhase` and `TapOriginRect` types. `getCourseColor`, `getPlanCategory`, `formatDuration`, `minutesToDuration`, `getTaskUrgency`. `useTasks`, `useCatalog`. `Checkbox`, `DialogShell`, `native-select`.

## Project Structure

### Documentation (this feature)

```text
specs/008-task-fab-detail-transform/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contracts.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
frontend/src/
├── components/tasks/
│   ├── TaskContainerModal.vue      # NEW overlay shell: transform, history, scrim, focus
│   ├── TaskDetailPanel.vue         # NEW form and detail content (create and view/edit)
│   └── __tests__/
│       ├── TaskContainerModal.spec.ts
│       └── TaskDetailPanel.spec.ts
├── views/
│   ├── TodoView.vue                # CHANGED: FAB, modal state, row tap opens modal
│   ├── TaskDetailView.vue          # CHANGED: direct link renders TaskDetailPanel without origin animation
│   └── __tests__/TodoView.spec.ts  # NEW
└── utils/
    └── taskForm.ts                 # NEW pure helpers: form <-> TaskRequest, validation (with spec)
```

**Structure Decision**: Frontend only. Tasks components live in a new `components/tasks/` folder, parallel to `components/notes/`. The `/tasks/:id` route stays for direct links and reuses the same panel.

## Application Layer Wiring

| User action | Call | State update |
|---|---|---|
| Open to-do view | `catalog.loadCatalog()` then `loadTasks()` (existing) | Cached lists |
| Save new task | `useTasks().createTask(request)` | Append saved DTO to `tasks` (exists in composable) |
| Open detail | Read `tasks` cache by ID. Fall back to `tasksApi.get(id)` on a cache miss (direct link). 404 closes the overlay. | None |
| Save edit | `useTasks().updateTask(id, request)` with the full `TaskRequest` (PUT replaces) | Replace DTO in `tasks` |
| Toggle status in detail | `useTasks().updateTaskStatus(id, status)` with optimistic update and rollback, same as the list | Replace DTO in `tasks` |
| Delete | `useTasks().deleteTask(id)` | Remove ID from `tasks` |
| Course list for the form | `useCatalog().courses` (cached) | None |

A protected `401` flows through the existing unauthorized handler. No new API function is needed.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `TaskContainerModal` repeats the phase and timer logic of `NoteEditorModal` (about 150 lines) | Notes already ship and have tests. A refactor of the shell touches shipped behavior. | Extract a shared shell now: it changes `NoteEditorModal` and its tests. Plan a later refactor with `safe-refactor`. Both modals share helpers from `useNoteTransition`. |
