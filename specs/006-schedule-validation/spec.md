# Feature Specification: Schedule Creation Validation

**Feature Branch**: `006-schedule-validation`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "Add validation rules in the create schedule view: check for an existing course. Check for a conflicting time block in the start time, the end time, and the day-of-week selection. If two or more time blocks exist, disable a weekday that is already defined. Prohibit the add-another-time button when the day of week is occupied. Take into account the already encoded courses that are not yet stored."

## Clarifications

### Session 2026-10-17

- Q: Should the duplicate-name and overlap checks be enforced only in the frontend, or must the backend also reject an invalid schedule? → A: Client-side only for this spec. The backend keeps its existing start-before-end rule. Backend duplicate-name and overlap enforcement is a separate follow-up.
- Q: When this feature says the system "blocks the save", what action is it blocking — staging the course into the session's encoded set, or persisting the course to the backend? → A: "Save" stages the course into the session's encoded set only. A separate bulk-freeze action persists encoded courses to the backend and is out of scope.
- Q: Should the feature explicitly block the save when the course title is empty or whitespace-only? → A: Yes. An empty or whitespace-only title blocks the save with a clear message.
- Q: When checking for a duplicate course name, should the comparison cover only the current student's courses or every course in the whole system? → A: Only the current student's courses, both stored and encoded.
- Q: If two time blocks in the same save both select the same weekday with overlapping times, should the save be blocked? → A: Yes. Overlapping same-weekday times across blocks of the same course are blocked.
- Q: Which close actions should trigger the "keep editing / discard" dialog? → A: Every user-initiated close (X button, swipe-down dismiss, Escape) when unsaved changes exist. Closes after a successful save MUST NOT show the dialog.
- Q: What counts as "unsaved changes" that should trigger the dialog? → A: A non-empty title, or any selected weekday or time in any block. An untouched form closes without a prompt.
- Q: When the student chooses "Discard", what should happen? → A: Reset the form to a single blank block, clear the pending slot, reset the color, and close.
- Q: If a save left some schedule records failed or pending for retry, should closing the drawer still show the dialog? → A: Yes. Failed or pending records count as unsaved changes and trigger the dialog.
- Q: Should the dialog offer only "Keep editing" and "Discard", or also add a "Save and close" action? → A: Only "Keep editing" and "Discard".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prevent duplicate course entries (Priority: P1)

A student sets up courses during onboarding. The student types a course name. The name matches a course from the existing catalog or a course that the student already encoded in this session. The system blocks the save. The system tells the student that the name already exists.

**Why this priority**: A duplicate name creates two course records for one class. Students lose track of notes, tasks, and events. This rule protects data integrity with the smallest change.

**Independent Test**: Enter a name that matches a known course. Attempt to save. Confirm that the system blocks the save and shows the duplicate-name message. Enter a unique name and confirm that the save proceeds.

**Acceptance Scenarios**:

1. **Given** a course named "CS 101" exists, **When** the student enters "cs 101" and saves, **Then** the system blocks the save and reports that the course already exists.
2. **Given** a course named "CS 101" exists, **When** the student enters "CS 101 " with extra spaces and saves, **Then** the system blocks the save and reports that the course already exists.
3. **Given** no known course is named "Math 201", **When** the student enters "Math 201" and saves, **Then** the system saves the course.

---

### User Story 2 - Prevent overlapping class times (Priority: P2)

A student adds a class time for a course. The class time names a weekday and a time range. The time range overlaps a class time of a known course on the same weekday. The system blocks the save. The system names the clashing course and weekday.

**Why this priority**: A student cannot attend two classes at the same time. Overlap detection stops impossible schedules before they reach the calendar.

**Independent Test**: Add a class time that overlaps a known class on the same weekday. Attempt to save. Confirm that the system blocks the save and names the clash. Add a non-overlapping time and confirm that the save proceeds.

**Acceptance Scenarios**:

1. **Given** a known course meets Monday 09:00-10:00, **When** the student adds Monday 09:30-10:30 and saves, **Then** the system blocks the save and reports the Monday clash.
2. **Given** a known course meets Monday 09:00-10:00, **When** the student adds Monday 10:00-11:00 and saves, **Then** the system saves the course (adjacent times do not clash).
3. **Given** a known course meets Monday 09:00-10:00, **When** the student adds Monday 14:00-15:00 and saves, **Then** the system saves the course.
4. **Given** a known course meets Monday 09:00-10:00, **When** the student adds Tuesday 09:30-10:30 and saves, **Then** the system saves the course (a different weekday does not clash).

---

### User Story 3 - Guide valid weekday selection (Priority: P3)

A student picks a time range for a class block. The system marks each weekday that clashes with a known class at that time. The student cannot select a marked weekday. When every weekday clashes, the system disables the add-another-time action.

**Why this priority**: Clear guidance prevents the student from building an invalid block. The student sees the clash before the save step. This rule improves the experience but does not guard data on its own.

**Independent Test**: Set a time range that clashes on some weekdays. Confirm that those weekdays appear unavailable and cannot be selected. Occupy all seven weekdays and confirm that the add action is disabled.

**Acceptance Scenarios**:

1. **Given** a known course meets Monday 09:00-10:00, **When** the student sets the block time to 09:30-10:30, **Then** Monday appears unavailable and cannot be selected.
2. **Given** the student selects Monday and then changes the block time to clash with a Monday class, **When** the time changes, **Then** the system clears the Monday selection and marks Monday unavailable.
3. **Given** every weekday has a known class that clashes with the block time, **When** the student views the add-another-time action, **Then** the action is disabled.
4. **Given** at least one weekday does not clash, **When** the student views the add-another-time action, **Then** the action is enabled.

---

### User Story 4 - Protect unsaved work on close (Priority: P2)

A student fills in a course title and one or more class times. The student closes the create-schedule drawer. The system shows a dialog that asks the student to keep editing or discard. "Keep editing" returns to the form with the draft intact. "Discard" clears the draft and closes the drawer.

**Why this priority**: A close without a prompt loses the student's work. This rule prevents accidental data loss with a small, isolated change.

**Independent Test**: Enter a title, close the drawer, confirm the dialog appears, choose "Keep editing", confirm the drawer stays open with the title. Close again, choose "Discard", confirm the drawer closes and the form is blank.

**Acceptance Scenarios**:

1. **Given** the student entered a title or any weekday or time, **When** the student closes the drawer, **Then** the system shows a dialog with "Keep editing" and "Discard".
2. **Given** the dialog is shown, **When** the student chooses "Keep editing", **Then** the dialog closes and the drawer stays open with the draft unchanged.
3. **Given** the dialog is shown, **When** the student chooses "Discard", **Then** the form resets to a single blank block and the drawer closes.
4. **Given** the form is untouched, **When** the student closes the drawer, **Then** the drawer closes with no dialog.
5. **Given** a save completed successfully, **When** the drawer closes, **Then** no dialog appears.
6. **Given** a save left failed or pending records, **When** the student closes the drawer, **Then** the dialog appears.

---

### Edge Cases

- A class time that ends exactly when another class begins does not clash.
- Two time blocks may share a weekday when their time ranges do not overlap.
- A weekday selected in one block may also hold a class in another block when times do not overlap.
- The system must compare times that use different formats, such as "09:00" and "09:00:00".
- An empty start time or an empty end time does not mark a weekday unavailable.
- The system must compare course names without regard to letter case or surrounding spaces.
- When known-course data cannot load, the system skips local clash and duplicate checks and lets the save proceed.
- A partial save keeps the failed records for retry. The system must not report a false duplicate or clash on retry.
- An empty course title or a title with only spaces blocks the save.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST collect the set of known courses from two sources: the stored catalog and the courses encoded in the current setup session.
- **FR-002**: The system MUST block the save when the entered course name matches a known course name owned by the current student, after trimming spaces and ignoring letter case.
- **FR-003**: The system MUST report a clear duplicate-name message that includes the entered name.
- **FR-004**: The system MUST detect a clash when a class time overlaps a known class time on the same weekday.
- **FR-005**: The system MUST treat two time ranges as overlapping when one starts before the other ends and ends after the other starts.
- **FR-006**: The system MUST NOT treat adjacent time ranges as overlapping, where one end time equals the other start time.
- **FR-007**: The system MUST block the save when any selected weekday of any block clashes, and MUST name the clashing course and weekday.
- **FR-008**: The system MUST compare times that use "HH:MM" and "HH:MM:SS" formats.
- **FR-009**: The system MUST mark a weekday unavailable inside a block when a known class clashes with the block time on that weekday.
- **FR-010**: The system MUST prevent selection of an unavailable weekday.
- **FR-011**: The system MUST clear an already-selected weekday and mark it unavailable when a later time change causes a clash on that weekday.
- **FR-012**: The system MUST allow the same weekday in two or more blocks when the block times do not overlap, and MUST block the save when the block times overlap on that weekday.
- **FR-013**: The system MUST disable the add-another-time action when all seven weekdays clash at the current block time.
- **FR-014**: The system MUST keep the add-another-time action enabled when at least one weekday does not clash.
- **FR-015**: The system MUST register each saved course and its class times as a known course for later checks in the same session.
- **FR-016**: The system MUST skip the duplicate-name and clash checks when known-course data is unavailable, and MUST let the save proceed.
- **FR-017**: The system MUST NOT report a duplicate name or a clash on a retry of a partially saved course.
- **FR-018**: The system MUST keep day-level granularity and MUST NOT introduce hourly time-blocking or priority values.
- **FR-019**: The system MUST enforce all duplicate-name and overlap checks in the client application only. The backend MUST keep only its existing start-time-before-end-time rule. Backend enforcement is out of scope for this feature.
- **FR-020**: The system MUST block the save when the course title is empty or contains only spaces, and MUST report a clear message.
- **FR-021**: The system MUST show a "keep editing / discard" confirmation dialog on every user-initiated close of the create-schedule drawer when unsaved changes exist, and MUST NOT show it after a successful save.
- **FR-022**: The system MUST treat the form as having unsaved changes when the title is non-empty, or when any block has a selected weekday or a time. An untouched form MUST close without a prompt.
- **FR-023**: When the student chooses "Discard", the system MUST reset the form to a single blank block, clear the pending slot, reset the color, and close the drawer.
- **FR-024**: The system MUST treat a failed or pending schedule record as an unsaved change that triggers the close-confirmation dialog.
- **FR-025**: The close-confirmation dialog MUST offer exactly two actions: "Keep editing" (dismiss the dialog and keep the drawer open) and "Discard" (reset the form and close the drawer).

### Key Entities *(include if feature involves data)*

- **Course**: An academic class container. Key attribute: name. A course owns zero or more class times.
- **Class time**: A recurring weekly meeting. Key attributes: weekday, start time, end time, owning course.
- **Encoded course**: A course that the student set up during onboarding but that is not yet stored permanently. It behaves like a known course for all checks. **Save** stages a course into this set. **Freeze** persists the set to the backend and is out of scope for this feature.
- **Known course set**: The union of stored courses and encoded courses, with their class times.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of save attempts with a duplicate course name are blocked with a clear message.
- **SC-002**: 100% of overlapping same-weekday class times across known courses are detected before a save completes.
- **SC-003**: 0 valid schedules are blocked by false positives, including adjacent times and non-overlapping times on a shared weekday.
- **SC-004**: A student can see every unavailable weekday for a chosen time before the save step.
- **SC-005**: A student can complete a valid course setup without a reload or a manual refresh after a clash or a duplicate error.
- **SC-006**: 100% of user-initiated closes with unsaved changes show the close-confirmation dialog, and 0 untouched or already-saved closes show a dialog.

## Assumptions

- Students set up several courses during onboarding before final storage.
- Encoded courses exist only within the setup session, because no stored record exists yet.
- Known stored courses and class times are available during setup.
- The existing system enforces only that a start time is before its end time. This feature adds all overlap and duplicate checks.
- The feature uses day-level granularity, per the project constitution. It excludes hourly time-blocking and priority values.
- The existing catalog loads once per setup session. New encoded courses join the known course set for the rest of the session.
- The checks run in the client only. Backend enforcement of duplicates and overlaps is out of scope.
- Persisting encoded courses in bulk is a separate action and is out of scope for this feature.
