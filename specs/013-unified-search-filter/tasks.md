# Tasks: Unified Search and Filter

**Input**: Design documents from `/specs/013-unified-search-filter/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/list-endpoints.md, quickstart.md

**Tests**: Included — the constitution requires tests for new logic (minimal scope per file).

**Organization**: Backend parameters + client plumbing are shared blocking prerequisites (Phase 2). User story phases are frontend wiring per surface.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Backend: `app/src/main/java/group/four/nyare/nyare/`, tests under `app/src/test/java/group/four/nyare/nyare/`
- Frontend: `frontend/src/`, specs under `__tests__/` siblings

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Port the presentational component this feature builds on

- [x] T001 Copy `SearchBar.vue` from the `pr-45` git object (`git show pr-45:frontend/src/components/SearchBar.vue`) into `frontend/src/components/SearchBar.vue` and add `v-model` support: `modelValue?: string` prop, `update:modelValue` emit bound to the `Input` (`@update:modelValue` or `v-model="..."` on the inner `Input`). Keep the PR's styling unchanged. Verify it renders via `npm run type-check`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend `q`/`from`/`to` params on all three list endpoints, client param types, mock adapter parity, and the shared search composable

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 [P] Add `:q` + `:from`/`:to` clauses to `findAllFiltered` in `app/src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`: `AND (:q IS NULL OR LOWER(t.title) LIKE :q OR LOWER(t.description) LIKE :q)` and `AND (:from IS NULL OR t.scheduledDate >= :from) AND (:to IS NULL OR t.scheduledDate <= :to)`; extend method signature with `String q`, `LocalDate from`, `LocalDate to` and update Javadoc
- [x] T003 [P] Same clauses in `app/src/main/java/group/four/nyare/nyare/repository/NoteRepository.java` on `n.title` + `n.content` and `n.entryDate`
- [x] T004 [P] Same clauses in `app/src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java` on `e.title` + `e.description` and `e.deadline` — `from`/`to` arrive as `LocalDateTime` bounds computed by the service
- [x] T005 [P] Wire `q`/`from`/`to` through `app/src/main/java/group/four/nyare/nyare/service/TaskService.java`, `service/impl/TaskServiceImpl.java`, `controller/TaskController.java`: `@RequestParam(required = false)` params, blank/whitespace `q` normalized to `null`, `q` lowercased and wrapped as `'%'+q+'%'` in the service, `from > to` throws `BadRequestException`
- [x] T006 [P] Same wiring for `NoteService.java`, `NoteServiceImpl.java`, `NoteController.java`
- [x] T007 [P] Same wiring for `AcademicEventService.java`, `AcademicEventServiceImpl.java`, `AcademicEventController.java`; service converts `LocalDate from`→`from.atStartOfDay()`, `to`→`to.plusDays(1).atStartOfDay()` (exclusive) before calling the repository
- [x] T008 Extend backend tests under `app/src/test/java/group/four/nyare/nyare/`: service impl tests for param passthrough + blank-`q` normalization + inverted-range 400; `@WebMvcTest` controller tests for `q`/`from`/`to` binding. Naming: `method_condition_expected`, AssertJ, `// given/when/then`. Run ONE test method at a time
- [x] T009 [P] Add `q?: string`, `from?: string`, `to?: string` (ISO `YYYY-MM-DD`) to `TaskListParams` in `frontend/src/api/tasks.ts`, `NoteListParams` in `frontend/src/api/notes.ts`, `AcademicEventListParams` in `frontend/src/api/academicEvents.ts`
- [x] T010 Mirror the filters in `frontend/src/api/mocks/adapter.ts`: lowercase `includes` on the same fields, inclusive date bounds, `from`>`to` → 400 via existing `badRequest()`; add cases to `frontend/src/api/mocks/__tests__/adapter.spec.ts`
- [x] T011 Create `frontend/src/composables/useServerSearch.ts`: `useServerSearch<T, P>(fetcher: (p: P) => Promise<T[]>, params: ComputedRef<P | null>)` → `{ results: Ref<T[] | null>, pending: Ref<boolean>, error: Ref<string | null> }`; `watchDebounced` (300 ms) on `params`; `null` → `results = null`, inactive; latest-call-wins staleness guard. Add `frontend/src/composables/__tests__/useServerSearch.spec.ts`
- [x] T012 Add a non-cache params passthrough to `frontend/src/composables/useNotes.ts` mirroring `useTasks.loadTasks(params)`: a `params` call filters on the server, returns the list, and never writes the shared refs

**Checkpoint**: `GET /api/tasks?q=x&from=2026-10-01&to=2026-10-31` returns filtered JSON; `useServerSearch` debounce verified by its spec.

---

## Phase 3: User Story 1 - Search tasks and notes by text (Priority: P1) 🎯 MVP

**Goal**: Typing into the search bar on To-do or Notes returns server-matched items; clearing restores the cached list

**Independent Test**: On To-do, type a title fragment → only matches appear → clear → full list returns. Same on Notes.

- [x] T013 [P] [US1] Mount `SearchBar` above the filter pills in `frontend/src/views/TodoView.vue`: `query` ref + `searchParams` computed (`null` when `query.trim()` empty, else `{ q: query.trim() }`) + `useServerSearch(tasksApi.list, searchParams)`; while `results !== null` render a flat `TaskRow` list (with empty state) in place of the tabs/sections
- [x] T014 [P] [US1] Mount `SearchBar` below the header in `frontend/src/views/NotesView.vue` with the same wiring via the new `useNotes` params passthrough; remove the dead topbar search icon (`h(HeaderIconButton, ..., topbar-search)` block and the `Search`/`HeaderIconButton` imports if unused)
- [x] T015 [P] [US1] Update `frontend/src/views/__tests__/TodoView.spec.ts` and `frontend/src/views/__tests__/NotesView.spec.ts`: cover search → results render → clear restores list; remove any `topbar-search` assertions

**Checkpoint**: US1 fully functional — live-debounced search on both views, caches untouched.

---

## Phase 4: User Story 2 - Filter lists by course and date range (Priority: P2)

**Goal**: A filter button beside the search bar opens a bottom sheet with course, date range, and (tasks) status filters; applying narrows the list server-side

**Independent Test**: Open sheet on To-do, pick course + range, apply → matching subset; active dot shows; clear restores.

- [x] T016 [US2] Create `frontend/src/components/FilterSheet.vue` on the `ui/drawer` pattern (`TaskQuickActionsSheet.vue` shape): `NativeSelect` course picker fed from `useCatalog`, two `<input type="date">` for from/to, `ToggleGroup` status (Todo/Completed/Any) gated by a `showStatus` prop, Apply + Clear actions; `v-model:open`, emits `apply`/`clear` with a `ListFilters` object
- [x] T017 [P] [US2] Extend `frontend/src/components/SearchBar.vue` with a `filtersActive: boolean` prop and a `filter` emit: trailing `SlidersHorizontal` icon-button (44 px target, `aria-label="Filter"`) with a visible active dot
- [x] T018 [P] [US2] Wire `FilterSheet` in `frontend/src/views/TodoView.vue`: `filters` ref folded into `searchParams` (q + courseId + from/to + status); search params non-null while filters active; pills remain visible but only drive the unfiltered list
- [x] T019 [P] [US2] Wire `FilterSheet` in `frontend/src/views/NotesView.vue`: course + entry-date range into `searchParams` (`showStatus` off)

**Checkpoint**: US2 functional on both views; filters combine with text search in one server call.

---

## Phase 5: User Story 3 - Search and filter deadlines (Priority: P2)

**Goal**: Deadlines mode in the calendar gets the same search bar + filter; day/week modes unchanged

**Independent Test**: Calendar → deadlines mode → type an event fragment → only matching events in sections; apply deadline-range filter → sections narrow.

- [x] T020 [US3] In `frontend/src/views/CalendarView.vue`: mount `SearchBar` + `FilterSheet` (no status) above `DeadlinesView` when `viewMode === 'deadlines'`; build `searchParams` (q + courseId + deadline range), drive `useServerSearch(academicEventsApi.list, params)`, and feed `deriveDeadlineSections` from `results ?? events` so the cached list stays intact

**Checkpoint**: US3 functional; day/week modes untouched.

---

## Phase 6: Polish & Cross-Cutting

- [x] T021 Run verification: `cd frontend && npm run type-check && npm run lint:oxlint` plus targeted `npx vitest run` for touched specs; backend `./gradlew compileJava` + the new test methods
- [x] T022 Impeccable pass: read `.agents/skills/impeccable/reference/craft-floor.md`, then screenshot-check all three surfaces at 390 px (search bar, active dot, sheet, results, empty states)
- [x] T023 Amend the constitution line "The backend exposes no date range query parameters" in `.specify/memory/constitution.md` to reflect the new `from`/`to` params (PATCH wording change)
- [ ] T024 Run the four quickstart scenarios in `specs/013-unified-search-filter/quickstart.md` against the running app

---

## Dependencies

```text
T001 (SearchBar) ──→ Phase 2 (backend + plumbing) ──→ US1 ──→ US2 ──→ US3 ──→ Polish
                                                    │
T005/T006/T007 block T008 (tests need impl signatures)
T016 blocks T018/T019 (sheet must exist to mount)
US3 needs FilterSheet (T016) — do after US2 or in parallel after T016
```

## Parallel Execution Examples

- **Phase 2**: T002/T003/T004 (three repos) and T005/T006/T007 (three entity stacks) run fully in parallel; T009/T010/T011/T012 are independent frontend files.
- **US1**: T013, T014, T015 are three disjoint file sets.
- **US2**: T016+T017 first, then T018+T019 in parallel.

## Implementation Strategy

1. **MVP**: T001 → Phase 2 → US1 (T013–T015). Live search on tasks + notes ships first.
2. **Increment 2**: US2 adds the filter sheet to both views.
3. **Increment 3**: US3 extends the same wiring to deadlines mode.
4. Each story lands independently testable; the backend ships all params up front so later phases are frontend-only.
