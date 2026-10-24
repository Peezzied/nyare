---

description: "Task list for the Headless Flow Harness feature"
---

# Tasks: Headless Flow Harness

**Input**: Design documents from `/specs/005-headless-flow-harness/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: The flow suites ARE the product of this feature (a headless harness). The `*.flow.spec.ts` files are implementation tasks, not a separate test layer. No other test suite is requested.

**Organization**: Tasks are grouped by user story. All paths are relative to the repository root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Wire a Node-based flow test environment that is separate from the unit suite.

- [x] T001 Create `frontend/vitest.flow.config.ts`: a standalone Vitest config with `test.environment: 'node'`, `test.root` at `frontend/`, `test.include: ['src/__flow__/**/*.flow.spec.ts']`, `test.exclude` that drops `src/**/__tests__/**` unit specs, `test.fileParallelism: false`, `test.maxWorkers: 1`, and `resolve.alias` mapping `@` to `frontend/src`. Do NOT load `@vitejs/plugin-vue` (the suite imports plain TS composables) and do NOT register any setup file that installs the mock adapter.
- [x] T002 Add two scripts to `frontend/package.json`: `"test:flow": "vitest run -c vitest.flow.config.ts --mode flow"` and `"test:flow:ai": "vitest run -c vitest.flow.config.ts --mode flow-ai"`. The AI run is opt-in through the mode flag (the spec gates on `import.meta.env.MODE === 'flow-ai'`); do not add a new dependency for the flag.
- [x] T003 Update TS project references so `npm run type-check` compiles the flow code in a Node context: exclude `src/__flow__/**/*` in `frontend/tsconfig.app.json`, add `"src/__flow__/**/*"` to the `include` of `frontend/tsconfig.vitest.json`, and add `"vitest.flow.config.*"` to the `include` of `frontend/tsconfig.node.json`.

**Checkpoint**: `npm run type-check` passes and `npx vitest run -c vitest.flow.config.ts` finds zero specs without error.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The missing reactive composables and the live-network harness. Every flow suite depends on this phase.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 [P] Implement `frontend/src/composables/useTasks.ts`. Module-level state `tasks: Ref<TaskResponse[]>`, `loading: Ref<boolean>`, `error: Ref<string | null>`, plus a private `loaded` flag. Expose `loadTasks(params?: TaskListParams, force?: boolean)` that calls `tasksApi.list(params)` once per intent (share one in-flight promise like `useCatalog.loadCatalog`). `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask` MUST update local `tasks` from the mutation response and MUST NOT call `list()` again (remove deleted ids locally). Expose `refetchForCourses(courseIds: number[])` that fetches `tasksApi.list({ courseId })` for each id with `Promise.all`, replaces those courses' tasks in the cache, and falls back to `loadTasks(undefined, true)` when `courseIds` is empty. Expose `resetTasks()`. Match the `UseTasks` interface in `data-model.md` §1.1 and `contracts/ui-contract.md` §4.
- [x] T005 [P] Implement `frontend/src/composables/useAcademicEvents.ts` with the same shape: `events`, `loading`, `error`, `loadEvents(params?: AcademicEventListParams, force?: boolean)`, `createEvent`, `updateEvent`, `deleteEvent`, `refetchForCourses(courseIds: number[])`, `resetEvents()`. Trust mutation responses, no redundant list calls, same empty-`courseIds` full-refetch fallback. Match `data-model.md` §1.2 and `contracts/ui-contract.md` §5.
- [x] T006 [P] Implement `frontend/src/composables/usePlannerStatus.ts`: `status: Ref<PlannerStatusResponse | null>`, `pendingCount: ComputedRef<number>` (from `status.value?.dirtyNoteCount ?? 0`), `canProcess: ComputedRef<boolean>` (`pendingCount > 0`), `loading`, `error`, `refresh()` that calls `studyPlannerApi.status()`, and `reset()`. The count MUST come from the backend status call, never from the notes list (FR-015). Match `data-model.md` §1.3 and `contracts/ui-contract.md` §6.
- [x] T007 [P] Implement `frontend/src/composables/useStudyPlan.ts`: a purely derived presentation layer over `useTasks().tasks`. Compute `scheduledByDate: ComputedRef<Map<string, TaskResponse[]>>` (group by `scheduledDate` day key `YYYY-MM-DD`), `laterTasks`, `backlogTasks`, `scheduledCount`, `laterCount`, `backlogCount`. Classify each task with `getPlanCategory()` from `frontend/src/utils/planCategory.ts`. Create no database table and no backend call (Constitution Principle I). Match `data-model.md` §1.4 and `contracts/ui-contract.md` §8.
- [x] T008 Build the live-network harness under `frontend/src/__flow__/harness/`:
  - `cookieJarFetch.ts`: patch `globalThis.fetch` so a relative URL such as `/api/...` resolves against `http://localhost:8080`, capture `JSESSIONID` from `response.headers.getSetCookie()`, and attach it as a `Cookie` request header on later calls to the backend. Keep the original fetch for absolute URLs. No new dependency: a minimal in-memory jar is enough for one `JSESSIONID` (this replaces the `tough-cookie` name in plan.md).
  - `clientSetup.ts`: import `cookieJarFetch` for its side effect, clear the dev interception by setting `import.meta.env.VITE_DEV_USER = ''` and `import.meta.env.VITE_USE_MOCKS = 'false'` (so `authApi.register()` is allowed), export `BACKEND_URL`, export `aiEnabled = import.meta.env.MODE === 'flow-ai'`, and export `assertBackendReachable()` that probes `GET /api/users/me` and throws a clear message naming the failing step and cause when the backend is unreachable (FR-001, SC-005).
  - Every flow spec MUST import `clientSetup` first.
- [x] T009 [P] Create the scenario fixture `frontend/src/__flow__/fixtures/plannerScenario.ts` mirroring `app/src/test/java/group/four/nyare/nyare/ai/FullStudyPlannerEngineIntegrationTest.java`: the `ScenarioFixtureData` shape from `data-model.md` §2, the eight course names and descriptions from `seedCourses`, the seventeen weekly schedule slots from `seedSchedules` (day names in `DayOfWeek` form, times as `HH:mm`), one existing task ("Review MIPS instruction encoding", `TODO`, day offset +1), one existing event ("Mobile Computing Quiz", day offset +3), and three notes (OOP, Mobile Computing, Calculus 2) with their image markdown placeholders. All dates MUST be offsets from today. Do NOT include academic context (backend-internal memory). Also add the two static PNG fixtures to `frontend/src/__flow__/fixtures/assets/`: `notice.png` (text "Important: Submit Lab Report 3 before Friday midnight.") and `slide.png` (text "CS201 Algorithm: Binary Tree Traversal"). Generate these files once and commit them as static assets, do not draw them at run time.

**Checkpoint**: Composables type-check, the harness resolves relative URLs to the backend, and the fixture data is available. User story work can now begin.

---

## Phase 3: User Story 1 - Prove session and catalog flow (Priority: P1) MVP

**Goal**: One command proves that a new user can register, log in, keep the session across calls, create courses and weekly schedules, and read them back through the frontend data layer.

**Independent Test**: Run the flow suite against a running backend. It passes when the session persists across calls and the created catalog reads back unchanged.

### Implementation for User Story 1

- [x] T010 [US1] Create `frontend/src/__flow__/flows/01-session-catalog.flow.spec.ts`. Import `clientSetup` first, then call `assertBackendReachable()` in `beforeAll`. Cover the acceptance scenarios: (1) register a unique username `flow_<Date.now()>_<random>` via `authApi.register()`, log in via `authApi.login()`, and assert `authApi.getCurrentUser()` returns the same user id (FR-003, FR-006); (2) create all eight courses with `coursesApi.create()` and the fixture schedules with `schedulesApi.create()`, then call `useCatalog().loadCatalog()` exactly once and assert both returned lists match the fixture (FR-004, FR-007); (3) call `authApi.logout()` and assert the next protected call rejects with an `ApiError` whose `status` is 401 (FR-012). Assert structure, not exact text.

**Checkpoint**: User Story 1 passes on its own and proves the frontend-to-backend connection.

---

## Phase 4: User Story 2 - Prove the journal and planner flow (Priority: P1)

**Goal**: Journal notes with images become tasks, academic events, and a study plan after the explicit Process step, and the data layer refreshes only the affected data.

**Independent Test**: With AI enabled, run the planner flow once. It passes when the Process stream ends successfully and the resulting tasks and events satisfy the domain rules.

### Implementation for User Story 2

- [x] T011 [US2] Create `frontend/src/__flow__/flows/02-journal-planner.flow.spec.ts` with the non-AI part. Import `clientSetup` first. Register and log in a unique user, seed courses and schedules (reuse the T009 fixture). Upload `notice.png` and `slide.png` with `imagesApi.upload(new File([buffer], name, { type: 'image/png' }))`, create the three notes with `notesApi.create()` where the image notes embed `![...](/api/images/<id>)`, and create the existing task and event. Then assert `usePlannerStatus().pendingCount` is greater than zero and `canProcess` is true before Process (FR-016, US2 scenario 1).
- [x] T012 [US2] Add the AI part to `frontend/src/__flow__/flows/02-journal-planner.flow.spec.ts`, gated with `describe.skipIf(!aiEnabled)` so the default run stays free (FR-009). Build the `useProcess` call with `onDone` wiring `Promise.all([useTasks().refetchForCourses(summary.affectedCourseIds ?? []), useAcademicEvents().refetchForCourses(...), usePlannerStatus().refresh()])` and `onSavedAfterCancel` doing a full reload, exactly as `contracts/ui-contract.md` §7 shows. Assert: the stream ends with a summary that lists `affectedCourseIds` with positive counts (US2 scenario 2, FR-008); `usePlannerStatus().refresh()` then reports zero pending notes (FR-016); every task in `useTasks().tasks` classifies as exactly one of `SCHEDULED`/`LATER`/`BACKLOG` through `getPlanCategory()` (US2 scenario 4); and no pre-existing task title changed and no deadline was invented (US2 scenario 5, FR-010, FR-003). Keep assertions structural (FR-010).

**Checkpoint**: User Stories 1 and 2 both pass. The complete product pipeline is proven headlessly.

---

## Phase 5: User Story 3 - Prove failure and cancel behavior (Priority: P2)

**Goal**: Expired sessions, missing records, and a cancelled Process run behave predictably.

**Independent Test**: Run the failure scenarios. Each passes when the data layer exposes the expected error state or recovery flag.

### Implementation for User Story 3

- [x] T013 [US3] Create `frontend/src/__flow__/flows/03-failures-cancel.flow.spec.ts`. Import `clientSetup` first. Cover: (1) after `authApi.logout()` and `useAuth().clearSessionUser()`, `ensureSession()` resolves to `null` without throwing (US3 scenario 1); (2) a missing record read, such as `tasksApi.get('00000000-0000-0000-0000-000000000000')`, rejects with an `ApiError` with `status` 404 (FR-012); (3) with AI enabled (`describe.skipIf(!aiEnabled)`), start `useProcess().start()` against seeded pending notes, call `cancel()` immediately, and assert `cancelled` becomes true and that a status recheck runs, setting `savedAfterCancel` when the run committed anyway (US3 scenario 2, FR-012). Restore auth state between cases so module-level session state does not leak.

**Checkpoint**: Failure and cancel behavior are proven and the UI can rely on them.

---

## Phase 6: User Story 4 - Publish the UI contract (Priority: P2)

**Goal**: A short document lists, for each data-layer module, the values and actions a view may use.

**Independent Test**: A reviewer matches each documented value and action to a flow step that exercised it.

### Implementation for User Story 4

- [x] T014 [US4] Update `specs/005-headless-flow-harness/contracts/ui-contract.md` so every documented module, value, and action matches the implemented composables and has a covering flow step. Confirm the modules are `useAuth`, `useCatalog`, `useNotes`, `useTasks`, `useAcademicEvents`, `usePlannerStatus`, `useProcess`, and `useStudyPlan`, correct any signature drift against `data-model.md`, and add the flow-step reference (spec file name plus scenario number) for each (FR-013, SC-002).

**Checkpoint**: The contract is a verified plug-and-play guide for the UI.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification and documentation that spans the stories.

- [x] T015 [P] Run `npm run lint:oxlint` in `frontend/` and fix the reported problems. Then run `npm run type-check` and fix every type error in the new composables, harness, fixture, and specs.
- [x] T016 Run the non-AI suite `npm run test:flow` against a running backend and confirm it passes in under 2 minutes. Then run the opt-in AI suite `npm run test:flow:ai` once and confirm it completes in under 10 minutes (SC-001, SC-003). Fix any failures and confirm two consecutive `npm run test:flow` runs pass on the same throwaway database with no manual cleanup (SC-004).
- [x] T017 [P] Update `specs/005-headless-flow-harness/quickstart.md` to match the shipped scripts and modes: state the manual backend start with the throwaway database profile, the `npm run test:flow` and `npm run test:flow:ai` commands, the backend reachability check, and the note that the developer deletes the throwaway database file by hand. Confirm every failure message names the failing step and cause (SC-005).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies, can start immediately.
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational. US1 and US2 are P1 and may run in parallel once Phase 2 is complete. US3 and US4 are P2.
- **Polish (Phase 7)**: Depends on all target user stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependency on other stories.
- **US2 (P1)**: Starts after Phase 2. Reuses the US1 seeding pattern but stays independently testable.
- **US3 (P2)**: Starts after Phase 2. Reuses the harness and fixture; independently testable.
- **US4 (P2)**: Needs the implemented composables from Phase 2 and the flow specs from US1-US3 to cite covering steps.

### Within Each User Story

- Harness and composables before flow specs.
- Non-AI assertions before AI-gated assertions in the same file (T011 before T012).

### Parallel Opportunities

- T004, T005, T006, T007 (four new composable files) and T009 (fixture) can run in parallel after T001-T003.
- T010 (US1) and T011 (US2) are different files and can run in parallel.
- T015 and T017 are different files and can run in parallel.

---

## Parallel Example: Foundational Composables

```text
Task: "Implement frontend/src/composables/useTasks.ts"
Task: "Implement frontend/src/composables/useAcademicEvents.ts"
Task: "Implement frontend/src/composables/usePlannerStatus.ts"
Task: "Implement frontend/src/composables/useStudyPlan.ts"
Task: "Create frontend/src/__flow__/fixtures/plannerScenario.ts and asset PNGs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories).
3. Complete Phase 3: User Story 1 (T010).
4. STOP and VALIDATE: run `npm run test:flow` for the session and catalog spec alone.

### Incremental Delivery

1. Setup + Foundational comes first.
2. US1 proves the connection (MVP).
3. US2 proves the product pipeline in AI mode.
4. US3 proves failure and cancel behavior.
5. US4 publishes the UI contract.
6. Polish verifies the whole harness.
