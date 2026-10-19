# Feature Specification: Backend Offline Detection

**Feature Branch**: `007-backend-offline-detection`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "implement a fully-pledged one that can be plugged and play with the ui. do not create apply offline banner yet"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The app knows when the server is unreachable (Priority: P1)

A student opens Nyare while the server is down. Today the app cannot tell "server unreachable" from "no data" or "not signed in". The app shows empty lists that look like real empty data. After this feature, the app holds one shared, observable connectivity status. Every screen reads this status and tells the truth.

**Why this priority**: Every other behavior depends on this status. Without it, no screen can show an honest state. Misleading empty states can make a student believe their notes and tasks are gone.

**Independent Test**: Start the app with the server stopped. Open the calendar, tasks, and notes screens. The shared status reports "unreachable" after the first failed request. Start the server and trigger any request. The status reports "reachable".

**Acceptance Scenarios**:

1. **Given** the server is stopped, **When** any screen sends a request and the request fails to connect, **Then** the status changes to "unreachable" and records the time of the failure.
2. **Given** the status is "unreachable", **When** any later request succeeds, **Then** the status changes to "reachable" at once.
3. **Given** the server answers with a business error (for example "not found" or "invalid input"), **When** the answer arrives, **Then** the status stays "reachable".
4. **Given** the server answers "not signed in", **When** the answer arrives, **Then** the status stays "reachable" and the existing sign-in recovery runs unchanged.

---

### User Story 2 - Screens show the true reason for a failed load (Priority: P1)

A student opens the tasks or notes screen with the server down. Today a failed course list load stops the task and note loads. The screen then shows "No tasks" or "No notes exist yet", and the Retry button never appears. After this feature, each list reports its own load failure. A failed course list never hides the failure or the result of another list.

**Why this priority**: This is the main user-visible defect in the audit. A false empty state is worse than an error message.

**Independent Test**: Stop the server and open the tasks screen, the notes screen, and the note editor. Each screen has an error state that a screen can read, and none shows a false empty state. Start the server and retry. Each screen shows its data.

**Acceptance Scenarios**:

1. **Given** the server is unreachable, **When** the tasks screen loads, **Then** the task list reports a load failure with the reason "server unreachable" and does not report an empty list.
2. **Given** the server is unreachable, **When** the notes screen loads, **Then** the note list reports a load failure and exposes a retry action.
3. **Given** the course list fails to load but the task list succeeds, **When** the tasks screen loads, **Then** the task list still loads and the screen shows tasks.
4. **Given** a list is in the failed state, **When** the student or the app starts a retry and the server answers, **Then** the failed state clears and the data appears.

---

### User Story 3 - The app recovers without a page reload (Priority: P2)

A student keeps the app open while the server restarts. When the server returns, the app returns to normal use. The student does not reload the page, sign in again, or lose unsaved text.

**Why this priority**: Servers restart often during development and demos. Recovery without a reload prevents data loss in open note editors.

**Independent Test**: Open the app with the server up. Stop the server and wait for the status to show "unreachable". Start the server. Within the recovery window, the status shows "reachable" with no user action. Lists that failed reload on request.

**Acceptance Scenarios**:

1. **Given** the status is "unreachable", **When** the server becomes available, **Then** the app detects this within 10 seconds and sets the status to "reachable".
2. **Given** the status changes from "unreachable" to "reachable", **When** the change occurs, **Then** screens can react to the change and reload failed lists.
3. **Given** the status is "unreachable", **When** the app probes for recovery, **Then** the app sends no more than one probe at a time and no more than one probe every 5 seconds.
4. **Given** the student has unsaved text in the note editor, **When** the status changes in either direction, **Then** the text stays unchanged.

---

### User Story 4 - The session check separates "unreachable" from "signed out" (Priority: P2)

A student opens the app with the server down. The session check cannot answer. Today the app treats this as an unknown session and, in a production build, cancels navigation and shows a blank screen. After this feature, the unknown session state and the unreachable status stay linked. A screen can show that the app waits for the server instead of showing nothing.

**Why this priority**: The blank screen in a production build is the worst failure in the audit. This story provides the data that a later screen change needs to fix it. This feature does not add that screen.

**Independent Test**: Build the app for production and open it with the server stopped. The shared status reports "unreachable". The session state reports "unknown". Start the server and trigger a navigation. The session check completes and the app opens the correct screen.

**Acceptance Scenarios**:

1. **Given** the server is unreachable at app start, **When** the session check fails to connect, **Then** the session state is "unknown" and the connectivity status is "unreachable".
2. **Given** the session state is "unknown", **When** the server becomes reachable, **Then** the next session check runs without a page reload.
3. **Given** the server is unreachable, **When** the app checks the session, **Then** the app does not treat the result as "signed out" and does not clear cached data.
4. **Given** the account recovery screen for a missing developer account, **When** the student retries while the server is unreachable, **Then** the screen can tell "server unreachable" apart from "account missing".

---

### User Story 5 - A screen adopts the status with no new wiring (Priority: P3)

A developer builds or updates a screen. The developer reads the shared status and the per-list failure state from one documented entry point. The developer does not write new connection logic, new error parsing, or new retry timers.

**Why this priority**: The user asked for a solution that plugs into any UI. This story defines that quality. It also keeps the later offline banner a small change.

**Independent Test**: In a test screen, read the status and a list failure state with fewer than 10 lines of code. The screen reacts to a simulated outage and a simulated recovery.

**Acceptance Scenarios**:

1. **Given** a new screen, **When** the developer reads the shared status, **Then** the developer gets the current state, the time of the last failure, and the time of the last success.
2. **Given** a new screen, **When** the developer reads a failed list, **Then** the developer gets a failure kind of "unreachable", "server error", or "rejected", and a message that a person can read.
3. **Given** a simulated outage in a test, **When** the developer forces the status to "unreachable", **Then** all screens that read the status change state.

---

### Edge Cases

- A request fails in the middle of a streamed response (the Process run). The app marks the status "unreachable" and the Process run reports a failure, not a cancel.
- The student cancels a request on purpose. The app does not count a cancel as an outage.
- The server answers with a server error (500 class). The app must tell this apart from "unreachable". A dev proxy returns the same 500 class answer when the server is down, so the app uses the answer body and the proxy signal to decide.
- Many requests fail at the same time. The app sets the status once and sends one recovery probe, not one probe per request.
- The device loses its network. The app reports "unreachable" and recovers when the network returns.
- The mock data mode is on. The status stays "reachable" and the app never shows an outage.
- A request is slow but not failed. The app does not report "unreachable" before the request timeout ends.
- The student signs out or switches account during an outage. The status resets with the other cached state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST keep one shared connectivity status with the values "reachable" and "unreachable". It MUST expose the time of the last failure and the time of the last success.
- **FR-002**: The system MUST set the status to "unreachable" when a request to the server fails to connect or the server cannot be reached through the dev proxy.
- **FR-003**: The system MUST set the status to "reachable" when any request receives a valid answer from the server, including business errors and "not signed in" answers.
- **FR-004**: The system MUST classify each failed request as one of three kinds: "unreachable", "server error", or "rejected". Each kind MUST carry a message that a person can read.
- **FR-005**: The system MUST NOT count a deliberate cancel as a failure and MUST NOT change the status for a cancel.
- **FR-006**: The system MUST keep the existing "not signed in" recovery unchanged. A connection failure MUST NOT trigger it.
- **FR-007**: The system MUST probe for recovery while the status is "unreachable". It MUST send at most one probe at a time and at most one probe every 5 seconds.
- **FR-008**: The system MUST detect recovery within 10 seconds after the server becomes available, without a page reload.
- **FR-009**: The system MUST let any screen subscribe to status changes and to the change from "unreachable" to "reachable".
- **FR-010**: Each data list (courses, schedules, tasks, notes, academic events, planner status) MUST report its own load failure and failure kind. A failed list MUST NOT stop another list from loading.
- **FR-011**: A list in the failed state MUST NOT report an empty result. A screen MUST be able to tell "failed" apart from "empty".
- **FR-012**: Each list MUST offer a retry action that clears the failed state when the load succeeds.
- **FR-013**: The session check MUST report "unknown" when the server is unreachable and MUST NOT report "signed out". The system MUST keep cached data during "unknown".
- **FR-014**: The session check MUST run again after recovery without a page reload.
- **FR-015**: The system MUST NOT discard unsaved user input when the status changes.
- **FR-016**: The status MUST stay "reachable" in the mock data mode.
- **FR-017**: The system MUST reset the status and the failed states when the student signs out or changes account.
- **FR-018**: The system MUST expose the status and the failure states through one documented entry point. A screen MUST NOT need extra connection logic to use it.
- **FR-019**: The system MUST provide a way to force the status in tests so that screens can be tested for outage and recovery.
- **FR-020**: This feature MUST NOT add an offline banner, a connection indicator, or any new visible screen element. A later feature adds them.
- **FR-021**: The system MUST keep the existing roundtrip rules. The recovery probe MUST use a request that does not need a signed-in session and MUST NOT fetch lists.

### Key Entities

- **Connectivity Status**: The shared state of the link to the server. It holds the state (reachable or unreachable), the time of the last failure, the time of the last success, and the count of failed requests since the last success.
- **Load Failure**: The failed state of one data list. It holds the failure kind, the readable message, and the retry action.
- **Failure Kind**: One of "unreachable" (no answer), "server error" (the server answered with a fault), or "rejected" (the server answered with a business error).
- **Session State**: The result of the session check. It holds "signed in", "signed out", or "unknown".
- **Recovery Probe**: A light request that the system sends while the server is unreachable to detect its return.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the server stopped, 0 screens show an empty state for data that failed to load. Each such screen exposes a failed state.
- **SC-002**: After the server restarts, the app detects recovery within 10 seconds in 100% of test runs, with no page reload.
- **SC-003**: A failed course list does not stop the tasks list, the notes list, or the events list from loading in 100% of test runs.
- **SC-004**: The system never sends more than 1 recovery probe in any 5-second window, even when 20 requests fail at the same time.
- **SC-005**: A developer connects a new screen to the status and the failure state with fewer than 10 lines of code and no new timers.
- **SC-006**: Unsaved note text survives an outage and a recovery in 100% of test runs.
- **SC-007**: 0 new visible elements appear in any screen after this feature, compared with the state before it.
- **SC-008**: All existing automated tests keep passing with no change to their expected results.

## Assumptions

- The audit of the "mock data off, server down" case, done on 2026-10-18, is the basis of this feature. It lists the false empty states, the blank screen in a production build, and the wrong retry text on the missing developer account screen.
- The offline banner, any connection indicator, and the production blank screen replacement are out of scope. They need visible UI and follow in a later feature that reads the status from this feature.
- The status is global for the whole app. It is not per list and not per screen.
- A failed connection is the only event that sets "unreachable". A server fault answer proves the server is reachable, so it sets "reachable".
- The recovery probe uses a public path that needs no session. The backend already keeps the user list path open for this purpose.
- A request timeout exists or is added at a value that a student accepts. The default is 15 seconds. Slow requests are not outages before this time ends.
- The student uses one browser tab. Sharing the status between tabs is out of scope.
- The mock data mode stays a development tool and never reports an outage.
- The feature reuses the existing shared list caches and the existing session check. It does not add a state library.
- Requests that send a streamed response (the Process run) report a connection failure through the same classification.
