# Feature Specification: Task FAB and Task Detail Container Transform

**Feature Branch**: `feat/task-fab-detail-transform`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "add an add task fab in the task view and apply animation to task detail as the notes view. hook all of these to the application layer"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Task from the To-do View (Priority: P1)

A student views the to-do list and wants to record a new task.
The student taps the floating add task button.
The system captures the position of the button.
The container expands from the button into a blank task form.
The student enters a title, picks a course, and saves.
The new task appears in the to-do list without a page reload.

**Why this priority**:
The student cannot create a task by hand today.
This story delivers the core value of the feature.

**Independent Test**:
Tap the add task button, fill in a title and course, and save.
The new task appears in the correct to-do section.
The task persists after the student reloads the application.

**Acceptance Scenarios**:

1. **Given** the to-do view, **When** the student taps the add task button, **Then** a blank task form expands from the button boundary.
2. **Given** a task form with a title and a course, **When** the student saves, **Then** the system stores the task and shows it in the to-do list.
3. **Given** a task form with no title or no course, **When** the student tries to save, **Then** the system blocks the save and shows which field is missing.
4. **Given** a task saved with a date, **When** the list refreshes, **Then** the task appears under Scheduled.
5. **Given** a task saved with a duration and no date, **When** the list refreshes, **Then** the task appears under Later.
6. **Given** a task saved with no date and no duration, **When** the list refreshes, **Then** the task appears under Backlog.

---

### User Story 2 - Expand Task Detail from a Task Row (Priority: P1)

A student taps a task row in the to-do list.
The system captures the position of the row.
The container expands from the row boundary into the task detail.
The detail shows the saved data of that task.

The detail displays:

- Title.
- Complete or incomplete status.
- Course name and course color.
- Scheduled date and duration.
- Full description.
- A link to the source note when the task came from a note.
- The section label Scheduled, Later, or Backlog.

**Why this priority**:
Task detail must feel like the note editor.
Consistent motion keeps the student oriented.

**Independent Test**:
Tap any task row.
The container expands from the row boundary to fill the viewport.
The detail shows the title, course, date, duration, and status of that task.

**Acceptance Scenarios**:

1. **Given** a visible task row, **When** the student taps the row, **Then** the container expands from the row boundary into the task detail.
2. **Given** an open task detail, **When** the detail loads, **Then** it shows the title, status, course name and color, scheduled date, duration, and full description.
3. **Given** a task created from a note, **When** the detail loads, **Then** it shows a link to that note.
4. **Given** a task not created from a note, **When** the detail loads, **Then** no source note link appears.
5. **Given** a task that no longer exists, **When** the student opens its detail, **Then** the system closes the detail and shows the to-do list.

---

### User Story 3 - Dismiss Task Detail Back to Origin (Priority: P1)

A student finishes reading or editing a task.
The student taps back or uses the device back gesture.
The container contracts into the original row or button boundary.
The to-do list keeps its scroll position and filter.

**Why this priority**:
Reversed motion confirms closure and keeps reading context.

**Independent Test**:
Open a task detail, then dismiss it with the back control and with the device back gesture.
The container contracts to the trigger boundary in both cases.

**Acceptance Scenarios**:

1. **Given** a task detail opened from a row, **When** the student dismisses it, **Then** the container contracts into that row boundary.
2. **Given** a task form opened from the add task button, **When** the student dismisses it, **Then** the container contracts into the button boundary.
3. **Given** an open task container, **When** the student uses the device back gesture, **Then** the container closes and the student stays in the to-do view.
4. **Given** a closed task container, **When** the collapse ends, **Then** the to-do list keeps its scroll position and active filter.

---

### User Story 4 - Edit and Delete a Task in Detail (Priority: P2)

A student opens a task detail and changes its title, description, date, or duration.
The student saves the change.
The student may also delete the task.
The to-do list reflects the change when the container closes.

**Why this priority**:
The detail becomes useful for upkeep.
Create and open still work without it.

**Independent Test**:
Open a task, change the title, and save.
The to-do list shows the new title.
Delete the task and confirm the row disappears.

**Acceptance Scenarios**:

1. **Given** an open task detail, **When** the student saves a changed field, **Then** the system stores the change and the list shows it.
2. **Given** an open task detail, **When** the student deletes the task, **Then** the system removes the task and closes the container.
3. **Given** a failed save or delete, **When** the system reports the failure, **Then** the container stays open and shows an error with a retry action.

---

### User Story 5 - Staggered Reveal and Reduced Motion (Priority: P2)

A student watches the container expand.
The content and controls reveal after the container motion starts.
A user with a reduced motion preference sees an opacity crossfade and no spatial scaling.

**Why this priority**:
The motion must match the notes view and respect accessibility settings.

**Independent Test**:
Open a task container with normal motion, then with reduced motion enabled.
Normal motion shows staggered reveal.
Reduced motion shows a crossfade only.

**Acceptance Scenarios**:

1. **Given** an expanding container, **When** expansion progresses, **Then** content appears before the action controls.
2. **Given** a dismissal, **When** it starts, **Then** content and controls hide before the container contracts.
3. **Given** reduced motion is on, **When** the student opens or dismisses a task container, **Then** the system uses an opacity fade with no spatial scaling.

---

### Edge Cases

- **Fast Successive Taps**: The system ignores taps on the add task button or a task row while a container is open or animating.
- **Scrolled Origin Row**: The container expands from the visible part of a partly visible row.
- **Origin Row Removed**: When the origin row no longer exists at collapse time, the container fades out without spatial contraction.
- **No Courses**: When the student has no courses, the form explains that a course is required and blocks the save.
- **Save Failure**: When the backend rejects or fails a save, the form keeps the entered data and shows an error.
- **Session Expiry**: When the session expires during an action, the system follows the existing sign-in redirect behavior.
- **Direct Link**: When the student opens a task detail address directly, the detail shows without an origin animation.
- **Viewport Resize**: When the viewport resizes while a container is open, the container fills the new viewport.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The to-do view MUST show a floating add task button that stays visible while the list scrolls.
- **FR-002**: The add task button MUST have an accessible name and a minimum touch target of 56 by 56 pixels.
- **FR-003**: System MUST capture the screen boundary of the tapped add task button or task row before it starts the expansion.
- **FR-004**: System MUST expand the task container from the captured boundary to the full viewport with a translucent scrim.
- **FR-005**: System MUST use the same motion timing, stagger, and dismissal behavior as the notes view container.
- **FR-006**: System MUST contract the container into the captured boundary on dismissal.
- **FR-007**: System MUST keep the to-do list scroll position and active filter during and after dismissal.
- **FR-008**: System MUST block background interaction and scrolling while a task container is open.
- **FR-009**: System MUST dismiss the open task container on browser or device back navigation without leaving the to-do view.
- **FR-010**: System MUST use an opacity crossfade instead of spatial motion when the user enables reduced motion.
- **FR-011**: The task form MUST require a title and a course.
- **FR-012**: The task form MUST accept an optional description, scheduled date, and duration.
- **FR-013**: System MUST store a new task through the existing task service and add the saved task to the list from the service response.
- **FR-014**: System MUST load the task data for an opened detail from the existing task service.
- **FR-015**: System MUST store task edits and deletions through the existing task service and update the list from the response without reloading the full list.
- **FR-016**: System MUST derive the Scheduled, Later, or Backlog section of each task from its date and duration.
- **FR-017**: System MUST NOT add time-of-day blocking or priority scores to the form or detail.
- **FR-018**: System MUST show a clear error and keep entered data when a task request fails.
- **FR-019**: System MUST scope all task reads and writes to the signed-in student.

### Key Entities *(include if feature involves data)*

- **Task**: A study to-do linked to one course with a title, optional description, optional scheduled date, optional duration, and a status.
- **Trigger Boundary**: The on-screen rectangle (position, size, corner radius) of the tapped button or row.
- **Task Container**: The overlay surface that moves between the trigger boundary and the full viewport. It shows the task form or the task detail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student creates a task in 30 seconds or less from tap on the button to the task shown in the list.
- **SC-002**: Container expansion completes within 350 milliseconds and collapse within 250 milliseconds.
- **SC-003**: 100 percent of created tasks appear in the correct section on first display.
- **SC-004**: 100 percent of dismissals keep the list scroll position and active filter.
- **SC-005**: Zero unintended page navigations occur when the student uses the back gesture with a task container open.
- **SC-006**: 100 percent of users with reduced motion preferences see a crossfade with no spatial scaling.
- **SC-007**: A failed save never loses the data the student typed.

## Assumptions

- The task service already supports create, read, update, status change, and delete.
- The notes view container transform defines the target motion and the student expects the same feel.
- A task requires a course. The form offers the courses of the signed-in student.
- The existing task detail screen is an empty stub. This feature fills it with task data.
- Day-level granularity applies. The form has no time-of-day field.
- Status toggling in the list stays unchanged.
- Mobile-first layout applies.
