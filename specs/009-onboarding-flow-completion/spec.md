# Feature Specification: Onboarding Flow Completion

**Feature Branch**: `feat-start-up-improvements`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "remove scheduleview; resolve the edge case where user can lose save course; include a onboarding-complete flag; link the create schedule view when add account is clicked in the select account page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New account reaches the schedule creator (Priority: P1)

A student who taps "Add account" on the account selection page creates a new account and is guided to the create-schedule screen, where they enter their classes. The placeholder "Create a Schedule" screen that currently sits in the onboarding chain no longer exists, so the flow has no dead end.

**Why this priority**: Today the new-account path ends at a placeholder screen whose confirm button does nothing. A new student cannot finish setup, so nothing else in the app has value for them.

**Independent Test**: Create a new account from the account selection page and walk the flow. The student can reach the create-schedule screen, save classes, and arrive at the calendar without meeting a screen that does nothing.

**Acceptance Scenarios**:

1. **Given** a student on the account selection page, **When** they add a new account successfully, **Then** the student passes through the Welcome screen (name entry) and its Continue action leads to the create-schedule screen.
2. **Given** a student at the end of the onboarding steps, **When** they continue, **Then** they land on the create-schedule screen and never on a placeholder screen.
3. **Given** a student on the create-schedule screen during onboarding, **When** they save all courses successfully, **Then** onboarding is marked complete and they land on the calendar home.
4. **Given** the placeholder schedule screen previously reachable at its own address, **When** a student opens that address, **Then** the app does not show a dead-end screen and sends the student to the correct destination for their state.

---

### User Story 2 - Saved courses are never silently lost (Priority: P1)

A student who has entered courses but has not yet pressed "Save all" is warned before leaving the create-schedule screen, and the app never tells them their courses are "saved" when they exist only on the device in the current session.

**Why this priority**: Today the per-course save in the drawer only keeps courses in the current session, yet reports success. A student who presses it, then leaves or reloads, loses their classes without warning. This breaks the Frictionless Capture principle and destroys student trust.

**Independent Test**: Enter a course, press the per-course save, then try to leave the screen. The student receives a warning that the course is not yet saved to their account, and can choose to stay and save everything or to leave and discard.

**Acceptance Scenarios**:

1. **Given** a course kept via the per-course save but not yet saved to the account, **When** the student tries to leave the create-schedule screen, **Then** a confirmation warns that unsaved courses will be lost and offers "Keep editing" and "Discard".
2. **Given** that confirmation, **When** the student chooses "Keep editing", **Then** they remain on the screen with every course still intact.
3. **Given** that confirmation, **When** the student chooses "Discard", **Then** the unsaved courses are dropped and the student leaves.
4. **Given** a course kept via the per-course save, **When** the app confirms the action, **Then** the message states the course is kept for this session and not yet saved to the account, instead of saying it was saved.
5. **Given** every course has been saved to the account through "Save all", **When** the student leaves the screen, **Then** no warning appears.
6. **Given** "Save all" fails partway, **When** the student leaves the screen, **Then** the courses that failed to save still count as unsaved and trigger the warning.

---

### User Story 3 - Onboarding completion is remembered (Priority: P2)

The app records, per account, whether the student has finished onboarding. A student who has finished is never routed back into the setup steps, and a student who has not finished is always routed back into them.

**Why this priority**: Without a completion record, setup screens stay reachable forever, returning students can wander back into the funnel, and the app cannot tell a half-finished new account from an established one.

**Independent Test**: Finish onboarding, close the app, and sign back in. The student lands on the calendar and cannot reach the setup steps. Sign into a different account that has not finished onboarding. That student is taken to the setup steps.

**Acceptance Scenarios**:

1. **Given** a newly created account, **When** the student first signs in, **Then** the account is marked as not onboarded and the student is routed into the setup steps.
2. **Given** a not-onboarded account, **When** the student tries to open the calendar, tasks, or notes, **Then** they are redirected back to the setup steps.
3. **Given** a student who saves all courses on the create-schedule screen during onboarding, **When** the save succeeds, **Then** the account is marked as onboarded.
4. **Given** an onboarded account, **When** the student opens a setup step address, **Then** they are redirected to the calendar home.
5. **Given** a student abandons onboarding halfway and returns later, **When** they sign in again, **Then** they resume at the setup steps because the account is still not onboarded.
6. **Given** an account that existed before this feature, **When** the student signs in, **Then** the account is treated as onboarded and the student goes to the calendar home.

---

### Edge Cases

- A student adds an account, reaches create-schedule, and closes the app before saving. On return the account is not onboarded, so they resume setup. No half-finished account reaches the calendar.
- A student marks onboarding complete, then deletes every course. The account stays onboarded. The student can still create courses later from the course manager.
- The save step succeeds for some courses and fails for others. Onboarding is not marked complete until every staged course is saved, and the student sees which courses still need attention.
- The completion record cannot be saved because the backend is unreachable. The student stays in setup, sees an error, and can retry. The app does not claim success.
- A student on a shared device switches accounts mid-setup. Each account keeps its own completion state, and unsaved courses of one account are never shown or saved under another.
- A student who skips the setup steps by typing the calendar address directly while not onboarded is redirected back to the setup steps.
- The student opens the removed placeholder address from a stale bookmark. They are redirected according to their onboarding state, not shown an error page.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST remove the placeholder "Create a Schedule" screen and its address from the onboarding flow, and no other screen may link to it.
- **FR-002**: The onboarding flow MUST lead from account creation to the create-schedule screen with no dead-end screens between.
- **FR-003**: Adding an account on the account selection page MUST send the student to the Welcome screen, and the Welcome screen's Continue action MUST lead to the create-schedule screen.
- **FR-004**: The system MUST store an onboarding-complete state for each account, defaulting to not complete when an account is created.
- **FR-005**: The system MUST mark an account onboarded only after every course the student staged during onboarding has been saved to the account.
- **FR-006**: The system MUST treat accounts that existed before this feature as onboarded.
- **FR-007**: The system MUST redirect a signed-in student with a not-onboarded account from the calendar, tasks, and notes screens to the onboarding steps.
- **FR-008**: The system MUST redirect a signed-in student with an onboarded account from the onboarding step addresses to the calendar home.
- **FR-009**: The onboarding-complete state MUST persist across sessions, devices, and app restarts for the same account.
- **FR-010**: The create-schedule screen MUST warn the student before they leave while any course exists only in the current session and is not saved to the account.
- **FR-011**: The leave warning MUST offer "Keep editing", which preserves every course, and "Discard", which drops the unsaved courses and leaves.
- **FR-012**: The per-course save action MUST NOT report that a course is "saved" while the course exists only in the current session. Its confirmation MUST say the course is kept for this session and not yet saved to the account.
- **FR-013**: The system MUST count courses whose save to the account failed as unsaved for the leave warning.
- **FR-014**: The "Save all" action MUST remain the only action that writes courses to the account.
- **FR-015**: After a successful "Save all" during onboarding, the system MUST send the student to the calendar home.
- **FR-016**: If the completion state cannot be recorded, the system MUST keep the student in onboarding, show a clear error, and allow retry.
- **FR-017**: Each account MUST keep its own onboarding state and its own unsaved courses, and switching accounts MUST NOT mix them.

### Key Entities *(include if feature involves data)*

- **Account (student)**: A student's sign-in identity. Gains an onboarding-complete state that starts as not complete for new accounts and complete for pre-existing accounts.
- **Course (staged)**: A course the student has entered but not yet saved to the account. Exists only in the current session until "Save all" succeeds. Counts toward the leave warning while unsaved.
- **Course (saved)**: A course stored on the account. Linked to exactly one account and survives sessions.
- **Onboarding step**: A screen in the setup chain (start, account selection, welcome, create schedule). Reachable only while the account is not onboarded.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new accounts that complete setup arrive at the calendar home with at least one saved course, with zero dead-end screens in the flow.
- **SC-002**: A student can go from tapping "Add account" to seeing their first saved class on the calendar in under 3 minutes.
- **SC-003**: 0 reported cases of a student losing entered courses without receiving a warning.
- **SC-004**: 100% of attempts by an onboarded student to open an onboarding step end at the calendar home.
- **SC-005**: 100% of attempts by a not-onboarded student to open the calendar, tasks, or notes end at the onboarding steps.
- **SC-006**: 100% of confirmations for session-only courses state that the course is not yet saved to the account.

## Assumptions

- Users are students on a mobile-first web app with a working connection to the backend during setup.
- The onboarding-complete state is stored on the backend, per account, so it survives reloads and applies across devices.
- Accounts that already exist when this feature ships have already used the app, so they are treated as onboarded rather than forced through setup.
- Completing onboarding requires saving at least one course with a class time. A student cannot finish onboarding with zero courses.
- The leave warning covers any exit from the create-schedule screen, including back, close, and the system back gesture. It does not cover a forced browser close, which can only show the browser's standard prompt.
- The per-course save action stays, but only keeps a course for the current session. "Save all" remains the single write to the account, consistent with the current behavior.
- The student's entered name on the Welcome screen is out of scope. It stays unsaved until a separate feature adds a place to store it.
- The removed placeholder screen has no other behavior that needs migrating.
- Dev-environment account behavior (auto sign-in, blocked account creation) stays in the service boundary and is not changed by this feature.
