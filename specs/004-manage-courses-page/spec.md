# Feature Specification: Manage Courses Page

**Feature Branch**: `004-manage-courses-page`

**Created**: 2026-10-17

**Status**: Draft

**Input**: User description: "i want to dedicate a manage courses page where user can view and edit courses and schedules"

## Clarifications

### Session 2026-10-17

- Q: Must course name editing be part of this feature? → A: Yes (Option A). The feature adds a course update operation. The constitution line "Courses provide create and delete endpoints only" needs an amendment.
- Q: Reuse the Create Schedule course drawer to edit course and class times, and keep its color picker? → A: Reuse the drawer (yes). Color picker: hidden during planning, then RESTORED on user request as cosmetic parity with Create Schedule — the app derives course color from the course id and the backend stores no color, so a pick never persists (see research.md R3).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View All Courses and Their Class Times (Priority: P1)

A student opens the Manage Courses page from the menu panel that the hamburger button opens. The page lists every course that the student owns. Each course shows its color, its name, and its weekly class times in day order.

**Why this priority**: The student must see the current data before the student can correct it. This story alone gives a single place to check the full weekly timetable.

**Independent Test**: Sign in with an account that has three courses with different class times. Open the hamburger menu panel and select "Manage courses". Verify that the page shows all three courses with correct names, colors, and class times.

**Acceptance Scenarios**:

1. **Given** a student with courses and class times, **When** the student selects "Manage courses" in the hamburger menu panel, **Then** the Manage Courses page opens and lists every course of that student.
2. **Given** a course with class times on Monday and Thursday, **When** the page shows that course, **Then** the class times appear in weekday order with start and end times.
3. **Given** a course with no class times, **When** the page shows that course, **Then** the course appears with a "No class times" label.
4. **Given** a student with no courses, **When** the page opens, **Then** the page shows an empty state with an action to add a course.
5. **Given** the page is open, **When** the student uses the back action, **Then** the student returns to the calendar.

---

### User Story 2 - Edit, Add, and Remove Class Times (Priority: P1)

A student changes the weekday, start time, or end time of a class time. The student can also add a new class time to an existing course, or remove one class time. The calendar shows the change immediately.

**Why this priority**: Wrong class times are the most frequent correction. Schedules anchor the calendar, so wrong times make the calendar wrong.

**Independent Test**: Open a course on the Manage Courses page. Change one class time from Monday 09:00–10:30 to Tuesday 13:00–14:30 and save. Return to the calendar and verify that the class appears on Tuesday at the new time and not on Monday.

**Acceptance Scenarios**:

1. **Given** an existing class time, **When** the student changes the weekday or times and saves, **Then** the system stores the new values and the calendar shows the class at the new day and time.
2. **Given** a course, **When** the student adds a class time with a weekday, start time, and end time and saves, **Then** the course shows the new class time and the calendar shows the new class.
3. **Given** a class time, **When** the student selects remove and confirms, **Then** the system deletes that class time only and keeps the course and the other class times.
4. **Given** a start time that is equal to or after the end time, **When** the student tries to save, **Then** the system blocks the save and shows a message next to the time fields.
5. **Given** a save that fails, **When** the system receives the error, **Then** the form keeps the values that the student entered and shows an error message.

---

### User Story 3 - Edit Course Details (Priority: P2)

A student changes the name of a course to correct a typo or to match the official course title.

**Why this priority**: Name errors happen less often than time errors, but the name appears on the calendar, on notes, and on tasks.

**Independent Test**: Rename a course on the Manage Courses page. Verify that the new name appears on the calendar, on the notes list, and in the course picker.

**Acceptance Scenarios**:

1. **Given** a course, **When** the student changes the name and saves, **Then** every view that shows the course shows the new name.
2. **Given** an empty name, **When** the student tries to save, **Then** the system blocks the save and shows a message.
3. **Given** a renamed course, **When** the student opens notes and tasks of that course, **Then** all notes, tasks, and events stay linked to the same course.

Scope of this story: In scope. This story adds a course update operation to the system (Clarification Q1, Option A).

---

### User Story 4 - Add and Delete Courses From the Page (Priority: P2)

A student adds a new course from the Manage Courses page. The student can also delete a course that the student no longer takes.

**Why this priority**: The page must be the single place for course management. The page is the single place to add and delete courses and class times.

**Independent Test**: Add a course from the page and verify that it appears in the list. Delete the course, confirm the warning, and verify that the course and its class times leave the list and the calendar.

**Acceptance Scenarios**:

1. **Given** the Manage Courses page, **When** the student selects "Add course", **Then** the existing new-course form opens, and after a save the new course appears in the list.
2. **Given** a course, **When** the student selects delete, **Then** a confirmation dialog states that all notes, tasks, events, and class times of the course will also be deleted.
3. **Given** the confirmation dialog, **When** the student confirms, **Then** the system deletes the course and all of its records, and the list and calendar no longer show it.
4. **Given** the confirmation dialog, **When** the student cancels, **Then** the system keeps the course unchanged.

---

### Edge Cases

- What happens when two class times of the same course overlap on the same weekday? The drawer blocks the save. This matches Create Schedule behavior.
- What happens when a class time overlaps a class time of another course? The drawer blocks the save and names the clashing course. This is the existing Create Schedule behavior.
- What happens when the student removes the last class time of a course? The system keeps the course. The course shows the "No class times" label.
- What happens when the network is slow? The save action shows a busy state and blocks a second submit.
- What happens when the student leaves the page with unsaved edits? The system asks the student to discard or keep the edits.
- What happens when a course was deleted in another session? The save fails with a not-found error. The page removes the course from the list and shows a message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a Manage Courses page that lists all courses of the signed-in student.
- **FR-002**: The hamburger menu panel MUST contain a "Manage courses" item that opens the Manage Courses page.
- **FR-003**: The "Manage courses" item MUST appear in the same panel as "Select Account". The panel MUST close when the item opens the page.
- **FR-004**: The page MUST show, for each course, the course color, the course name, and all weekly class times in weekday order.
- **FR-005**: The page MUST show the same course color that the calendar shows for that course. Color is stored on the course (a palette slug); when unset it derives from the course id. The picker edits the stored color.
- **FR-006**: Students MUST edit a course name and class times in the same course drawer that the Create Schedule view uses. The drawer opens pre-filled with the saved values.
- **FR-007**: Students MUST be able to add a class time to an existing course.
- **FR-008**: Students MUST be able to remove one class time in the drawer. The change applies only after the student saves the drawer. Closing with unsaved edits asks the student to discard or keep them.
- **FR-009**: The system MUST reject a class time where the start time is not before the end time, and MUST show the reason next to the fields.
- **FR-010**: Students MUST be able to add a new course from the page. The same drawer opens blank.
- **FR-011**: Students MUST be able to delete a course after a confirmation step that states the cascade of notes, tasks, events, and class times.
- **FR-012**: Students MUST be able to rename a course. The system MUST keep all notes, tasks, events, and class times linked to the renamed course.
- **FR-013**: After any save, the calendar and all other views MUST show the new data without a full page reload.
- **FR-014**: When a save fails, the system MUST keep the entered values and MUST show an error message.
- **FR-015**: Every interactive control on the page MUST have a touch target of at least 44 by 44 pixels.

### Key Entities

- **Course**: An academic subject that the student takes. Attributes on this page: name, color (stored palette slug; falls back to a derived color when unset). Parent of class times, notes, tasks, events, and context facts.
- **Class Time (Schedule)**: One recurring weekly meeting of a course. Attributes: weekday, start time, end time. Belongs to exactly one course.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can change one class time and see the change on the calendar in under 30 seconds.
- **SC-002**: A student can reach the Manage Courses page from the calendar in 2 taps or fewer (open the hamburger panel, select "Manage courses").
- **SC-003**: A student can see the full weekly timetable of all courses on one page, with no need to open each course.
- **SC-004**: 100% of invalid time ranges are blocked before the system stores them.
- **SC-005**: No course deletion happens without an explicit confirmation from the student.

## Assumptions

- The student is signed in. The page shows only courses of that student.
- Color is stored on the course as a palette slug. Courses without a stored color derive one from the course id, so older data stays valid without a migration.
- The current data does not store a room for a class time. Room editing is out of scope.
- Archive of courses or terms is out of scope. A separate feature will cover archive.
- The page reuses the Create Schedule drawer for add and edit, and the existing confirmation dialog for delete.
- The page follows the mobile-first layout and design system in `frontend/DESIGN.md`.
- The page does not change notes, tasks, events, or planner behavior. Only course and class-time data change.
- Course rename depends on a new course update operation in the backend. The constitution (Frontend Data Flow and Cache Conventions) needs a MINOR amendment to allow course updates.
- The editable course fields are name and description. Course ownership does not change.
