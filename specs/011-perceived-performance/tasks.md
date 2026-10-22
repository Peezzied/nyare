# Tasks: Perceived Performance

**Input**: Design documents from `/specs/011-perceived-performance/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-loading-contract.md, quickstart.md

**Tests**: Not requested by the spec — no new test tasks. Verification = targeted existing-suite runs + lint/type-check + prod-build quickstart.

**Organization**: Tasks grouped by user story (US1 P1, US2 P2, US3 P2). Each story is an independently shippable increment. No new dependencies; all paths under `frontend/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallel-safe — different file, no dependency on an incomplete task
- **[Story]**: US1 = instant return visits · US2 = prompt first visits · US3 = instant imagery

---

## Phase 1: Setup

**Purpose**: Prove a green baseline before touching code (constitution VIII — verify before and after)

- [x] T001 Run `npm run lint:oxlint`, `npm run type-check`, and `npx vitest run` in `frontend/`; record baseline results so regressions are attributable

---

## Phase 2: Foundational

**Purpose**: Blocking prerequisites — none. Every edit is per-file against existing structures; the composable caches the feature relies on already exist (`useCatalog`, `useTasks`, `useNotes`, `useAcademicEvents`, `usePlannerStatus`, `useArchive`, `createCache`).

**Checkpoint**: Baseline green → story work may begin in any order.

---

## Phase 3: User Story 1 - Instant Return to a Section (Priority: P1) 🎯 MVP

**Goal**: Revisiting Tasks/Calendar/Notes within a session shows last-loaded content immediately — no refetch, no rebuild, no Schedule-X re-init.

**Independent Test**: Visit each of the three tabs once, switch between them; DevTools Network shows zero `/api/*` requests on return and the calendar does not re-layout (quickstart Scenario 1).

- [x] T002 [P] [US1] Add `defineOptions({ name: 'TodoView' })` in `frontend/src/views/TodoView.vue` `<script setup>` (required for `<KeepAlive include>` name matching)
- [x] T003 [P] [US1] Add `defineOptions({ name: 'CalendarView' })` in `frontend/src/views/CalendarView.vue` `<script setup>`
- [x] T004 [P] [US1] Add `defineOptions({ name: 'NotesView' })` in `frontend/src/views/NotesView.vue` `<script setup>`
- [x] T005 [US1] In `frontend/src/components/AppShell.vue`, replace the bare `<RouterView />` (line 227) with `<RouterView v-slot="{ Component }"><KeepAlive :include="['TodoView','CalendarView','NotesView']"><component :is="Component" /></KeepAlive></RouterView>` — keep param routes (`archive/:courseId`, etc.) uncached to avoid stale param instances (depends on T002–T004)
- [x] T006 [US1] In `frontend/src/views/NotesView.vue` `onMounted` (lines 91–94): change `await loadNotes(true)` to `await loadNotes()` and drop the now-redundant `await catalog.loadCatalog()` ordering (fire both via `Promise.all([catalog.loadCatalog(), loadNotes()])`); also remove `@saved="loadNotes(true)"` on `NoteEditorModal` (line 157) — `saveNote` already upserts the list
- [x] T007 [US1] Verify session-reset safety of kept-alive views: confirm `resetAllCaches()` in `frontend/src/composables/createCache.ts` covers every cache the three views read, and that after `clearSessionUser()`/account switch the reactivated views re-derive from cleared refs (read-only check; fix only if a leak exists)

**Checkpoint**: Tab switching is instant with zero network on return; login/switch-account still resets state.

---

## Phase 4: User Story 2 - Prompt First Visit to a Section (Priority: P2)

**Goal**: First visit to any screen becomes usable promptly — concurrent data fan-outs and heavy capabilities deferred until needed.

**Independent Test**: Fresh session on `vite preview`; each surface usable <2s; Network waterfall shows one overlapping request stage per screen; start screen fetches no schedule-x/preact/temporal/tiptap resources (quickstart Scenarios 2–3).

- [x] T008 [P] [US2] In `frontend/src/router/index.ts`, delete the static `import CreateScheduleView` (line 9) and change the route component to `() => import('@/views/CreateScheduleView.vue')` (line 32)
- [x] T009 [P] [US2] In `frontend/src/components/notes/NoteEditorModal.vue`, replace `import NoteEditor from '@/views/NoteEditor.vue'` (line 7) with `const NoteEditor = defineAsyncComponent(() => import('@/views/NoteEditor.vue'))` (add `defineAsyncComponent` to the `vue` import at line 6)
- [x] T010 [P] [US2] In `frontend/src/views/CalendarView.vue` `loadData` (lines 45–55): collapse to one fan-out `await Promise.all([catalog.loadCatalog(), loadTasks(), loadEvents(), loadNotes()])` inside the try/catch so a notes failure cannot block or hide the calendar (preserve `loadError` semantics)
- [x] T011 [P] [US2] In `frontend/src/views/TodoView.vue` `loadData` (lines 213–224): replace the two serial awaits with `await Promise.all([catalog.loadCatalog(), loadTasks()])`
- [x] T012 [P] [US2] In `frontend/src/views/NoteEditor.vue` `onMounted` (lines 725–755): run `loadCatalog()` and `loadNote(activeNoteId.value)` concurrently via `Promise.all`, then run `checkArchivedCourse()` (it needs `selectedCourseId` populated); new-note path fires `loadCatalog()` + prefill logic, then `checkArchivedCourse()`
- [x] T013 [P] [US2] In `frontend/src/components/tasks/TaskDetailPanel.vue` `resolveTask` (lines 166–191): run `getTask(props.taskId)` and `loadCatalog()` concurrently via `Promise.all`; only then evaluate `archive.loadArchive()` when the course is absent; keep `onMounted` (lines 248–251) unchanged
- [x] T014 [P] [US2] In `frontend/src/views/ArchivedCourseView.vue` `load` (around lines 173–175): run `archive.loadArchive()` and `archive.loadCourseContent(courseId)` concurrently via `Promise.all`
- [x] T015 [P] [US2] In `frontend/index.html`, convert the Google Fonts `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?...">` (line ~12) to the preload-swap pattern: `<link rel="preload" as="style" href="...">` + `<link rel="stylesheet" href="..." media="print" onload="this.media='all'">` + `<noscript>` fallback with the plain stylesheet link — keeps `display=swap`, removes render-blocking

**Checkpoint**: Cold navigation shows single-stage waterfalls; entry bundle excludes schedule-x and tiptap.

---

## Phase 5: User Story 3 - Instant Mascot and Note Imagery (Priority: P2)

**Goal**: Bundled artwork is present at its surface's first paint; note-attached images never shift layout.

**Independent Test**: Fresh session — first open of any mascot dialog shows art immediately (zero pop-ins); notes grid reserves image space so late thumbnails never move cards (quickstart Scenario 4).

- [x] T016 [P] [US3] In `frontend/src/components/ui/DialogShell.vue`, after the `duckotaFeedback` import (line 4), add `new Image().src = duckotaFeedback` so the 112 KB PNG starts fetching when the component sets up (all consumers mount it eagerly)
- [x] T017 [P] [US3] In `frontend/src/components/DiscardDraftConfirmDialog.vue`, apply the same `new Image().src = duckotaFeedback` warm after its import (line 3)
- [x] T018 [P] [US3] In `frontend/src/components/NoteCard.vue`, ensure the note preview image renders inside reserved space (the existing `max-h-*` container is not enough — give the image a fixed height or `aspect-ratio` wrapper) so a late `/api/images` response never shifts the masonry grid
- [x] T019 [P] [US3] In `frontend/src/components/PictureNoteCard.vue`, apply the same reserved-space treatment to the note image
- [x] T020 [US3] In `frontend/src/components/editor/TiptapEditor.vue`, check how embedded `<img>` nodes are rendered (image extension); if they lack fixed dimensions, constrain them (CSS `aspect-ratio`/min-height on the image node) so editor content does not jump when images resolve — skip if already dimensioned

**Checkpoint**: Every mascot dialog opens with art present; image cards hold their box while loading.

---

## Phase 6: Polish & Cross-Cutting

- [x] T021 [P] Run `npm run lint:oxlint` and `npm run type-check` in `frontend/`; fix any regressions introduced
- [x] T022 Run targeted Vitest on touched files: `npx vitest run src/views/__tests__/NotesView.spec.ts src/views/__tests__/NoteEditor.spec.ts` plus specs for any other modified component
- [x] T023 Run `npx vitest run` full suite — SC-005 regression gate (identical behavior, all flows pass)
- [x] T024 Execute `quickstart.md` Scenarios 1–6 against `npm run build && npm run preview` with the backend on :8080; record timings against SC-001 (<0.5s revisit), SC-002 (<2s first visit), SC-003 (zero pop-ins), SC-004 (no heavy resources on start screen)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Start immediately — produces the regression baseline
- **Foundational (Phase 2)**: Nothing to build — baseline from Phase 1 is the only gate
- **US1 / US2 / US3**: Independent of each other; all start after Phase 1. File overlap exists only inside each phase's own tasks (T005 needs T002–T004)
- **Polish (Phase 6)**: After all desired stories complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — largest perceived win, recommended first
- **US2 (P2)**: Independent — touches `CalendarView`/`TodoView`/`NotesView` files also touched by US1, so if run in parallel coordinate the same-file edits (different lines, safe to merge)
- **US3 (P2)**: Independent — no file overlap with US1/US2

### Within Each Story

- US1: names (T002–T004) → KeepAlive (T005) → cache-respecting mount (T006) → reset audit (T007)
- US2: all tasks independent per file — any order
- US3: all tasks independent per file — any order

### Parallel Opportunities

- T002, T003, T004 (three files) — parallel
- T008–T015 (eight files) — parallel, except none share a file
- T016–T019 (four files) — parallel
- T021–T024 — sequential by nature (verify → fix → validate)

### Parallel Example: User Story 2

```bash
# All single-file edits can land concurrently:
Task: "Lazy CreateScheduleView in frontend/src/router/index.ts"
Task: "defineAsyncComponent NoteEditor in frontend/src/components/notes/NoteEditorModal.vue"
Task: "Promise.all loadData in frontend/src/views/CalendarView.vue"
Task: "Promise.all loadData in frontend/src/views/TodoView.vue"
Task: "Parallel onMounted in frontend/src/views/NoteEditor.vue"
Task: "Flatten resolveTask in frontend/src/components/tasks/TaskDetailPanel.vue"
Task: "Parallel archive load in frontend/src/views/ArchivedCourseView.vue"
Task: "Preload-swap fonts in frontend/index.html"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 baseline
2. T002–T007 — KeepAlive + cache-respecting mounts
3. Validate Scenario 1 on `vite preview` → warm navigation instant → ship or continue

### Incremental Delivery

1. Baseline → US1 (instant tabs) → US2 (fast first visits) → US3 (instant imagery) → Polish validation
2. Each story lands independently; none blocks the others

---

## Notes

- [P] = single-file, independent edits; all file paths verified against `frontend/src/`
- Every task traces to a spec FR: US1→FR-001/006/007/009, US2→FR-002/003/004/008, US3→FR-005/010
- KeepAlive gotcha honored: `include` matches `defineOptions` names; param routes excluded (skill: vue-best-practices/component-keep-alive, vue-router/param-change-no-lifecycle)
- No commits without explicit user request (git-safety rule)
