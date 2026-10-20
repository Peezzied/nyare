# Feature Specification: Headless Flow Harness

**Feature Branch**: `005-headless-flow-harness`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Connect the frontend data layer to the live backend and prove the complete user flow headlessly, with no UI, so that building the UI later is plug and play. Reuse the backend integration-test scenario (courses, schedules, notes, images, task, event) as the fixture. Run the AI planner against the real backend."

## Clarifications

### Session 2026-10-18

- Q: Should this feature's scope include a pending-notes status for the Duckota button? → A: Yes. Add a planner-status module and a flow step that checks pending notes before and after Process.
- Q: Which database should the backend use while the flow suite runs? → A: A separate throwaway database file, kept apart from the real development database.
- Q: Who starts and stops the backend for the flow suite? → A: The developer starts it manually with the throwaway database profile. The suite checks that it is reachable and fails fast if not.
- Q: How does the suite handle academic context, which has no create call? → A: Academic context is backend-internal AI memory of the user. The suite never seeds it. The planner builds it during Process.
- Q: How does the throwaway database get cleared between runs? → A: It persists across backend restarts. The suite relies on unique users and never deletes data. The developer deletes the file by hand when needed.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prove session and catalog flow (Priority: P1)

A developer runs one command and sees proof that a new user can register, log in, keep the session across calls, create courses and weekly schedules, and read them back through the frontend data layer.

**Why this priority**: Every other flow depends on a working session. This story proves the frontend and backend connect.

**Independent Test**: Run the flow suite against a running backend. It passes when the session persists across calls and the created catalog reads back unchanged.

**Acceptance Scenarios**:

1. **Given** a fresh unique username, **When** the flow registers and logs in, **Then** the current-user call returns that user.
2. **Given** a logged-in user, **When** the flow creates the scenario courses and schedules, **Then** a single catalog load returns all of them.
3. **Given** no session, **When** a protected call runs, **Then** it fails with an unauthorized error that the data layer reports in a typed form.

---

### User Story 2 - Prove the journal and planner flow (Priority: P1)

A developer proves that journal notes (with images) become tasks, academic events, and a study plan after the explicit Process step, and that the data layer refreshes only the affected data.

**Why this priority**: This is the core product value. It must work before any UI exists.

**Independent Test**: With AI enabled, run the planner flow once. It passes when the Process stream ends successfully and the resulting tasks and events satisfy the domain rules.

**Acceptance Scenarios**:

1. **Given** the scenario user with unprocessed notes, **When** the planner status loads, **Then** it reports a pending count above zero and the user may start Process.
2. **Given** the scenario user with notes and images, **When** Process runs, **Then** the stream ends with a summary that lists affected courses.
3. **Given** a completed Process run, **When** the planner status reloads, **Then** it reports zero pending notes.
4. **Given** a completed Process run, **When** tasks and events reload for the affected courses, **Then** every task is exactly one of scheduled, later, or backlog.
5. **Given** a completed Process run, **When** results are checked, **Then** no existing task title changed and no deadline was invented.

---

### User Story 3 - Prove failure and cancel behavior (Priority: P2)

A developer proves that expired sessions, missing records, and a cancelled Process run behave predictably so the UI can rely on them.

**Why this priority**: The UI needs stable error and cancel behavior to show correct states.

**Independent Test**: Run the failure scenarios. Each passes when the data layer exposes the expected error state or recovery flag.

**Acceptance Scenarios**:

1. **Given** a logged-out user, **When** a session check runs, **Then** the data layer reports no user without throwing.
2. **Given** a running Process, **When** the developer cancels it, **Then** the data layer reports cancelled and rechecks status. A run that saved anyway sets the saved-after-cancel flag.

---

### User Story 4 - Publish the UI contract (Priority: P2)

A developer gets a short document that lists, for each data-layer module, the values and actions a view may use.

**Why this priority**: It turns the passing flows into a plug-and-play guide for the UI.

**Independent Test**: A reviewer matches each documented value and action to a flow step that exercised it.

**Acceptance Scenarios**:

1. **Given** the finished suite, **When** the contract document is read, **Then** each listed module has a covering flow step.

---

### Edge Cases

- The backend is not running: the suite fails fast with a clear message.
- The AI key is missing or the AI call fails: the planner flow reports a clear failure and the other flows still pass.
- A previous run left data behind: the unique username per run prevents clashes. The developer deletes the throwaway database file by hand when a clean slate is needed.
- The Process stream sends no progress for a long time: the run keeps waiting and does not time out early.
- A fixture date falls on a weekend or past the planning horizon: dates use offsets from today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The suite MUST run against the real backend with no mocked responses. The developer starts the backend. The suite MUST check that the backend is reachable and fail fast with a clear message when it is not.
- **FR-002**: The suite MUST keep the session cookie across calls as a browser does.
- **FR-003**: The suite MUST create a unique user for each run.
- **FR-004**: The fixture MUST mirror the backend integration scenario: eight courses, the weekly schedule, the existing task, the event, and the notes with images. Dates MUST use offsets from today. The fixture MUST NOT seed academic context, because it is backend-internal memory that the planner builds.
- **FR-005**: The suite MUST seed data only through the same calls the UI will use.
- **FR-006**: The suite MUST cover register, login, session check, and logout.
- **FR-007**: The suite MUST cover create and read of courses, schedules, notes, tasks, and events.
- **FR-008**: The suite MUST cover Process end to end, including progress events, the final summary, and the targeted refetch of tasks and events.
- **FR-009**: The planner flow MUST be opt-in because each run costs AI usage.
- **FR-010**: The suite MUST assert structure and domain rules for AI output, not exact text.
- **FR-011**: The data layer MUST offer reactive state for tasks, academic events, the derived study plan, and the planner status (pending note count and eligibility to process), because none exists yet.
- **FR-015**: The planner status MUST come from the backend status call. The UI MUST NOT derive eligibility from the notes list.
- **FR-016**: The suite MUST check that pending notes appear before Process and clear after Process.
- **FR-012**: The suite MUST cover unauthorized, not-found, and cancelled-Process behavior.
- **FR-013**: The suite MUST publish a contract document for the UI.
- **FR-014**: The suite MUST run against a separate throwaway database and MUST NOT read or change the real development database. The suite MUST NOT delete data. Each run MUST use its own unique user so earlier data does not affect results.

### Key Entities

- **Test User**: A unique account that owns all scenario data for one run.
- **Scenario Fixture**: The courses, schedules, notes, images, task, and event that mirror the backend integration scenario.
- **Flow Step**: One verified action with its expected result.
- **Planner Status**: The backend answer that lists pending notes and their dates. The Duckota button reads it to enable Process.
- **UI Contract**: The per-module list of values and actions that views may use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the backend already running, a developer runs the non-AI flows with one command and gets a pass or fail result in under 2 minutes.
- **SC-002**: 100% of the data-layer modules that the UI will use have at least one covering flow step.
- **SC-003**: The planner flow completes with one AI run and finishes in under 10 minutes.
- **SC-004**: Two consecutive runs on the same throwaway database both pass with no manual cleanup between them.
- **SC-005**: Every failure message names the failing step and the cause.
- **SC-006**: The whole work finishes within 8 hours.

## Assumptions

- The backend and its database run locally with the default AI provider and a valid key.
- The existing frontend data layer is the unit under test. Only tasks, events, study plan, and planner status need new reactive state.
- A browser run is out of scope. A single browser smoke test may follow once views exist.
- Academic context is backend-internal AI memory. The suite does not seed or read it.
- Fixture images are stored as static files, not generated at run time.
- The planner flow runs once per session of work and only on request.
