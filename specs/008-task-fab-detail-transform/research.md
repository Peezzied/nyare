# Research: Task FAB and Task Detail Container Transform

No `NEEDS CLARIFICATION` item remains. Each decision below resolves a design question.

## 1. Where does the overlay live?

- **Decision**: Render `TaskContainerModal` inside `TodoView`, like `NoteEditorModal` inside `NotesView`.
- **Rationale**: The list stays mounted. The scroll position and active filter survive (FR-007). A route change would unmount the list.
- **Alternatives**: Router-level transition on `/tasks/:id` (loses list state, hard to contract to the row). View Transition API (no cross-browser support for this geometry on the target devices, and no existing pattern).

## 2. How does the motion match the notes view?

- **Decision**: Reuse `toTapOriginRect`, `getOriginStyle`, `calculateTargetStyle`, timing constants, and types from `useNoteTransition` and `types/notesTransition`. Copy the phase and timer logic into `TaskContainerModal`.
- **Rationale**: Identical timing (320 ms, 240 ms, 100 ms, 180 ms, 150 ms reduced) is a requirement (FR-005). Copy keeps shipped notes code untouched.
- **Alternatives**: Extract a shared shell component (cleaner, but touches `NoteEditorModal` and its tests). Deferred, see Complexity Tracking in the plan.

## 3. Back gesture handling

- **Decision**: Push a history entry `{ nyareTaskModal: true }` on open. A `popstate` event closes the overlay without leaving the view. Same pattern as `NoteEditorModal`.
- **Rationale**: Meets FR-009 with a known, tested pattern.
- **Alternatives**: Query param in the route (adds history semantics and test cost, no benefit).

## 4. Form fields and controls

- **Decision**: Title (text), course (native select), description (textarea), scheduled date (`input type="date"`), duration (native select of presets plus "Not set").
- **Rationale**: Native controls give mobile pickers, accessibility, and no new dependency. Presets avoid free-form ISO input. `minutesToDuration` already converts minutes to ISO-8601.
- **Alternatives**: Custom calendar popover (exists in `ui/calendar`, but heavier on a 390 px sheet). Free-text duration (error prone).

## 5. Edit semantics

- **Decision**: Send the complete `TaskRequest` on save, because `PUT /api/tasks/{id}` replaces the task. Include the current `status`.
- **Rationale**: A partial body could clear fields on the server.
- **Alternatives**: `PATCH` for each field (no such endpoint except status).

## 6. Uncertainty

- **Decision**: An empty date sends `null`. A "Not set" duration sends `null`. The form never fills defaults.
- **Rationale**: Constitution III. The tri-state section then shows Later or Backlog honestly.

## 7. Delete confirmation

- **Decision**: Confirm with a dialog built on `DialogShell`, red tactile button, per DESIGN 8.3.
- **Rationale**: Delete is destructive and has no undo.
- **Alternatives**: Swipe to delete or undo toast (new patterns, larger scope).

## 8. Origin row removed on collapse

- **Decision**: After delete, close with the reduced motion fade for that close only.
- **Rationale**: The row no longer exists, so contraction to its rectangle looks broken (spec edge case).

## 9. Direct link to `/tasks/:id`

- **Decision**: Keep the route. `TaskDetailView` renders the same `TaskDetailPanel` full screen with no origin animation. A 404 redirects to `/tasks`.
- **Rationale**: Spec edge case. The route already exists and the current redirect target `/` is replaced with the list.
