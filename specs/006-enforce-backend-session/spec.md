# Feature Specification: Enforce Backend Session

**Feature Branch**: `006-enforce-backend-session`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "Make the backend enforce a session. Return 401 on unauthenticated course, task and note calls. This is a security fix and a larger change, outside the harness scope. Note that it would also break any frontend or test code that relies on the public behavior. make sure to reconcile the breaking changes with the frontend"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reject anonymous data access (Priority: P1)

A visitor with no login session sends a request for courses, tasks, or notes. The system refuses the request with an "unauthenticated" answer and returns no data.

**Why this priority**: Today an anonymous visitor can read and change any user's data. This is the security defect.

**Independent Test**: Send each course, task, and note request with no session. Each request fails with HTTP 401 and returns no user data.

**Acceptance Scenarios**:

1. **Given** no session exists, **When** a visitor lists, reads, creates, changes, or deletes a course, **Then** the system answers 401 and changes nothing.
2. **Given** no session exists, **When** a visitor lists, reads, creates, changes, or deletes a task, **Then** the system answers 401 and changes nothing.
3. **Given** no session exists, **When** a visitor lists, reads, creates, changes, or deletes a note, **Then** the system answers 401 and changes nothing.
4. **Given** a session expired or ended by logout, **When** the user sends any of these requests, **Then** the system answers 401.

---

### User Story 2 - Keep signed-in users working (Priority: P1)

A signed-in user keeps full access to their own courses, tasks, and notes. The user never sees data from another user.

**Why this priority**: The fix must not break the product for valid users.

**Independent Test**: Log in, then run the full course, task, and note flow. All requests succeed and return only that user's data.

**Acceptance Scenarios**:

1. **Given** a valid session, **When** the user lists courses, tasks, or notes, **Then** the system returns only records the user owns.
2. **Given** a valid session, **When** the user asks for a record owned by another user, **Then** the system answers "not found".
3. **Given** a valid session, **When** the user creates a record, **Then** the system links the record to the session user and ignores any user identifier in the request.

---

### User Story 3 - Frontend handles loss of session (Priority: P2)

When the backend answers 401 during use, the app sends the user to the account screen instead of showing a broken page. After login, the app works as before.

**Why this priority**: Without this, the frontend shows silent failures after the change.

**Independent Test**: Start the app, end the session on the backend, and trigger a data load. The app shows the login flow and recovers after login.

**Acceptance Scenarios**:

1. **Given** the user has no session, **When** the app opens, **Then** the app asks for login before it requests course, task, or note data.
2. **Given** the session ends while the app is open, **When** a data request returns 401, **Then** the app clears local session state and shows the account screen.
3. **Given** the dev auto-login setting is on, **When** the app starts without a session, **Then** it logs in the dev user first and loads data after.

---

### User Story 4 - Test suites match the new contract (Priority: P2)

Backend tests, frontend unit tests, mocks, and the headless flow suite use the new rule. Tests that relied on anonymous access either log in first or expect 401.

**Why this priority**: The change breaks existing tests. The team needs a green suite to trust the fix.

**Independent Test**: Run the backend controller tests, frontend unit tests, and flow suite. All pass and at least one test per area proves the 401 answer.

**Acceptance Scenarios**:

1. **Given** the updated suites, **When** a test sends a protected request with no session, **Then** the test expects 401.
2. **Given** the updated suites, **When** a test needs data, **Then** the test logs in first.

---

### Edge Cases

- A course, task, or note request carries a `userId` parameter for another user. The system ignores or rejects the parameter. The session decides ownership.
- A session exists but its user was deleted. The system answers 401 and ends the session.
- The planner status and process calls run without a session. The system answers 401 as well.
- A browser blocks the session cookie. The app shows the login screen and no data.
- Login, logout, register, and current-user calls stay reachable without a session.
- The 401 answer uses the same error format as other errors and holds no stack trace.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST answer HTTP 401 to every course request that has no valid session.
- **FR-002**: The system MUST answer HTTP 401 to every task request that has no valid session.
- **FR-003**: The system MUST answer HTTP 401 to every note request that has no valid session.
- **FR-004**: The system MUST answer HTTP 401 to schedule, academic event, and planner requests that have no valid session.
- **FR-005**: The system MUST keep login, logout, register, and current-user requests reachable without a session.
- **FR-006**: The system MUST scope every protected read and write to the session user.
- **FR-007**: The system MUST ignore client-supplied user identifiers on protected requests, or reject them when they differ from the session user.
- **FR-008**: The system MUST answer 401 in the same structured error format as other errors.
- **FR-009**: The frontend MUST request no protected data until a session exists.
- **FR-010**: The frontend MUST clear session state and show the account screen when any protected request returns 401.
- **FR-011**: The frontend MUST keep dev auto-login working when enabled.
- **FR-012**: The team MUST update backend tests, frontend tests, API mocks, and the headless flow suite to match the new rule.
- **FR-013**: The team MUST list each breaking change and its frontend fix in the feature notes.

### Key Entities

- **Session**: A server-side login state that links a browser to one user.
- **User**: The owner of courses, tasks, notes, schedules, and events.
- **Protected resource**: Any course, task, note, schedule, event, or planner request that needs a session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected requests without a session return 401 and no user data.
- **SC-002**: A signed-in user completes the full course, task, and note flow with zero new errors.
- **SC-003**: 0 records from another user appear in any response during cross-user tests.
- **SC-004**: When the session ends, the user sees the account screen within one failed request.
- **SC-005**: 100% of backend, frontend, and flow tests pass after the update.

## Assumptions

- The existing cookie-based login session stays as the session mechanism.
- No new login method, role, or permission level is in scope.
- Schedules, academic events, and planner calls follow the same rule as courses, tasks, and notes.
- Users own their records, and one record has exactly one owner.
- The headless flow suite already logs in, and only its anonymous-access checks need change.
- Existing data without an owner is out of scope.
