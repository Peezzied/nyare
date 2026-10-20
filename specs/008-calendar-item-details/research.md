# Research: Calendar Item Details and Week-View Category Markers

**Feature**: Calendar Item Details and Week-View Category Markers
**Branch**: `008-calendar-item-details`
**Date**: 2026-10-18
**Status**: Completed

---

## Decision 1: One shared detail component with a discriminated view model

### Decision
Replace `CourseBlockDetail.vue` and `UntimedBlockDetail.vue` with one `CalendarItemDetail.vue`. The component receives a single discriminated view model with `kind: 'class' | 'task' | 'event'`. Fields that do not apply to a kind stay null. The component renders a field only when its value exists.

### Rationale
- The three item types share most markup: a color dot, a title, a time-window badge, a linked-note card, and a control row. Two components duplicate that markup.
- One component with one view model gives one place to enforce FR-018 through FR-020 (hide a missing field, keep the tap target).
- The spec requires one shared component (FR-021). Fewer files match Ponytail rule 6 (change the fewest files).

### Alternatives Considered
1. **Keep two components and add a third for tasks.** Rejected: three near-identical files and three places to fix a hide-state bug.
2. **Use slots per item type.** Rejected: slots move the branching to the caller. The caller then needs the same logic in the day view and the week view.
3. **One component with `v-if` branches per type.** Chosen shape: the branches live inside the shared component, not at every call site.

---

## Decision 2: Mock and preview strategy for full state coverage

### Decision
Add `src/api/mocks/calendarItemDetailFixtures.ts`. It exports one array of view models that covers every state in FR-023 and FR-024. Add `CalendarItemDetail.story.vue` with one variant per state. Extend the existing task and event fixtures in `src/api/mocks/fixtures.ts` with block-note ids so the offline mock adapter shows linked notes.

### Rationale
- The spec requires mock data that exercises every state, including the hide states. One fixture array with one entry per state is the shortest reviewable proof.
- Histoire is already configured and runs with `npm run story`. A story previews the states without a backend.
- The mock adapter already derives `planCategory` and serves tasks, events, and notes. Extending its fixtures keeps the offline run useful.
- Mock data stays in `api/mocks/`. Views and components stay pure (Constitution Principle X).

### Alternatives Considered
1. **Inline the mock data inside the story.** Rejected: the offline adapter could not reuse it.
2. **A new preview module per item type.** Rejected: three files where one array suffices.

---

## Decision 3: Mark-complete through the existing status endpoint

### Decision
The complete control calls `tasksApi.updateStatus(taskId, 'COMPLETED')`. On success, the parent updates its cached task `ref` from the saved DTO. The parent does not call `list()` again. On failure, the parent keeps the prior state and shows the existing API error.

### Rationale
- `PATCH /api/tasks/{id}/status` already exists and returns the saved DTO.
- The backend roundtrip conventions require the client to trust the mutation response and update local state. A refetch after mark-complete is forbidden.
- A day-level task has no time-blocking. The status change is the only write.

### Alternatives Considered
1. **Refetch the task list after mark-complete.** Rejected: extra roundtrip and a lost scroll position.
2. **Optimistic flip before the response.** Rejected: a failed write would show a wrong state. The saved DTO is the source of truth.

---

## Decision 4: Linked-note navigation through Vue Router

### Decision
A task or an event carries its source note id in `noteId`. The linked-note control emits the note id. The calendar parent calls `router.push({ name: 'note-edit', params: { id } })`. The control hides when `noteId` is null or empty.

### Rationale
- The route `note-edit` (`/notes/:id`) already exists and opens `NoteEditor.vue`.
- A task or an event links to exactly one source note through `noteId`. Constitution Principle II holds: one course, one parent.
- Navigation by route name keeps the existing note editor behavior, including the direct-URL path.

### Alternatives Considered
1. **Open the note inside the same detail modal.** Rejected: extra in-modal editor logic and no back-stack.
2. **Look up the note title by fetching the note.** Rejected: the detail view would add a roundtrip per open. The note title is already available in the cached notes list when present. Otherwise the control shows a generic note label.

---

## Decision 5: Week-view category marker rendering

### Decision
Add one small `CategoryMarker.vue`. It takes the category and the completed flag. It renders the tri-block form from `DESIGN.md` section 6: a flag or alarm for an event, a completion check for a task, and no indicator for a class. Each marker exposes an `aria-label` that names the category. `WeekPill.vue` and `WeekHeaderRow.vue` reuse it.

### Rationale
- The week view shows class pills (`WeekPill.vue`) and untimed chips (`WeekHeaderRow.vue`). Both need the same marker. One component prevents duplicate marker markup.
- The design system already defines the tri-block distinctions. Icons come from `@lucide/vue`, which is installed.
- An accessible label per marker satisfies FR-005 and `PRODUCT.md` ("Meaningful accessibility labels for tri-state task badges and calendar markers").

### Alternatives Considered
1. **Inline markers in both files.** Rejected: duplicate markup and two places to fix.
2. **A text chip that names the category.** Rejected: it crowds the narrow week columns and fights the 2-chip density rule.

---

## Decision 6: Time-window and duration formatting reuse

### Decision
Build the `timeWindow` string in `utils/calendarItemDetail.ts`. A class uses `formatTimeRange` over the schedule start and end. A task uses its scheduled date, or the plan category when the task has no date. An event uses its deadline date and time. Build the duration string for a task with `formatDuration` from `utils/taskUrgency.ts`. Set the duration to null for a class and an event.

### Rationale
- `formatTimeRange`, `formatDuration`, and `getPlanCategory` already exist. Ponytail rule 2: reuse a helper that already lives here.
- One builder keeps the day view, the week view, and the story in agreement.
- Events carry no duration. The builder always sets an event duration to null. The component then hides the duration field (FR-017, FR-019).

### Alternatives Considered
1. **Format inside the component.** Rejected: the week view and the story would reformat the same values.
2. **Add a duration to academic events.** Rejected: the spec states an event has no duration.
