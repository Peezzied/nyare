# Research: Headless Flow Harness & Composable Wiring

**Feature**: `005-headless-flow-harness`
**Date**: 2026-10-18

## 1. Composable Gaps & Design Strategy

Currently, the frontend data layer has composables for:
- `useAuth`: Session tracking, login, logout, dev user handling.
- `useCatalog`: In-memory cached courses and schedules.
- `useNotes`: Read-only notes listing cache.
- `useProcess`: SSE streaming trigger and execution states.

### Missing Composables Required by Spec & Constitution:
1. **`useTasks`**:
   - Manages reactive task cache (`tasks: Ref<TaskResponse[]>`).
   - Mutations: `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`.
   - Invariant: Updates local state from server responses (no redundant list refetching).
   - Invariant: Exposes `fetchTasks(courseId?: number)` to support targeted refetches.
2. **`useAcademicEvents`**:
   - Manages reactive events cache (`events: Ref<AcademicEventResponse[]>`).
   - Mutations: `createEvent`, `updateEvent`, `deleteEvent`.
   - Invariant: Exposes `fetchEvents(courseId?: number)` to support targeted refetches.
3. **`usePlannerStatus`**:
   - Dedicated composable for Duckota button status.
   - Calls `studyPlannerApi.status()`.
   - Derives `pendingCount` and `canProcess` (`computed(() => pendingCount.value > 0)`).
   - Refreshes via `refresh()`.
4. **`useStudyPlan`**:
   - Derived presentation layer over cached tasks from `useTasks`.
   - Constitution Principle I: Virtual study plan (no database table, no backend endpoint).
   - Derives:
     - `scheduledTasks`: Tasks grouped by `scheduledDate` (day-level granularity).
     - `laterTasks`: Tasks with `duration` but no `scheduledDate`.
     - `backlogTasks`: Tasks with neither `duration` nor `scheduledDate`.
     - Computed using `getPlanCategory(task)`.

---

## 2. Headless Test Runner Strategy (Vitest + Node + Cookie Jar)

### Challenge:
- Spring Boot uses session cookies (`JSESSIONID`).
- Node's standard `fetch` in Vitest/Node environment drops `Set-Cookie` headers and does not forward cookies across calls with `credentials: 'include'`.
- Running in JSDOM does not persist cookies across native `fetch` network requests to `http://localhost:8080`.

### Solution:
- Create a test runner config `vitest.flow.config.ts` targeting `environment: 'node'`.
- Provide a lightweight cookie-jar fetch wrapper or interceptor for flow tests:
  - Intercepts requests in the flow harness.
  - Automatically captures `set-cookie` from responses.
  - Attaches `Cookie: JSESSIONID=...` on subsequent requests to `http://localhost:8080`.
  - Points relative URLs (`/api/...`) to `http://localhost:8080` transparently.
- Zero mock handlers: `apiClient` routes directly to the live backend.

---

## 3. Test Fixture Mapping (from FullStudyPlannerEngineIntegrationTest.java)

The flow fixture mirrors `FullStudyPlannerEngineIntegrationTest.java`:
1. **Unique User**: `planner_test_<timestamp>` registered and logged in via `authApi.register()` & `authApi.login()`.
2. **Courses (8 courses)**:
   - "Computer Architecture and Organization" (CS Core Course)
   - "Principles of Programming Languages" (CS Core Course)
   - "GE Elective 1 - Living in the IT Era" (General Education Elective)
   - "Calculus 2" (Mathematics Course)
   - "Readings in Philippine History" (General Education Course)
   - "Mobile Computing" (CS Elective Course)
   - "Object-Oriented Programming" (CS Core Course)
   - "Physical Activities Toward Health & Fitness 3 (PATHFit 3)" (Physical Education)
3. **Schedules (17 slots)**:
   - CompArch, PPL, IT Era, Calc 2, RPH across MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY.
4. **Existing Academic Items**:
   - Task: "Review MIPS instruction encoding" (TODO, scheduled tomorrow).
   - Event: "Mobile Computing Quiz" (in 3 days).
5. **Synthetic Images & Notes**:
   - Slide PNG & Notice PNG generated or read from static test assets, uploaded via `imagesApi.upload()`.
   - OOP Note with Notice image reference.
   - Calc Note with Slide image reference.
6. **Academic Context**:
   - Omitted from client seeding per clarification (backend-internal AI memory).

---

## 4. Verification & Budget Risk Analysis

- **Time constraint**: 8 hours total.
- **AI execution cost & volatility**:
  - Gated behind `RUN_AI=1` or `npm run test:flow -- --ai`.
  - Assertions check structural validity (done event, summary counts, tasks/events matching domain rules, no title mutations) rather than brittle text matching.
