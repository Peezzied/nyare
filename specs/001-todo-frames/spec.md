# Feature Specification: To-do Screen, Burger Panel, and Item Modal

**Feature Branch**: `001-todo-frames`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "To-do screen + burger panel + item modal (3 frames). Mobile-first, 390px baseline."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review and Complete Tasks in To-do View (Priority: P1)

A student opens the application to check upcoming schoolwork. The student views a chronological list of academic tasks on a mobile screen. The student identifies the course, due date, task name, and time for each item. The student checks off completed tasks with instant visual confirmation.

**Why this priority**: The task list is the primary workspace for academic execution. It provides immediate daily value.

**Independent Test**: The user scrolls the list, views task metadata, and toggles task completion checkboxes.

**Acceptance Scenarios**:

1. **Given** existing scheduled tasks, **When** the student opens the To-do page, **Then** the system displays a scrollable list sorted by date ascending with fixed header and bottom navigation.
2. **Given** an incomplete task row, **When** the student taps the checkbox, **Then** the checkbox toggles to the completed state with distinct visual styling.
3. **Given** a course linked to a task, **When** the row renders, **Then** the course label displays its assigned course palette text color.

---

### User Story 2 - Access Quick Navigation Menu via Burger Panel (Priority: P2)

A student taps the hamburger button in the top header. The system opens an empty white popover panel directly below the button. The student closes the panel by tapping outside or pressing the Escape key.

**Why this priority**: Establishes the header navigation anchor for upcoming application features without blocking current view work.

**Independent Test**: Tap the hamburger icon button to open the popover, tap outside to dismiss, and verify that no background scrim darkens the page.

**Acceptance Scenarios**:

1. **Given** the To-do view header, **When** the student taps the hamburger button, **Then** the system opens a white rounded panel anchored top-left under the button without a background scrim.
2. **Given** an open burger panel, **When** the student taps outside the panel or presses Escape, **Then** the system closes the panel.

---

### User Story 3 - Inspect Task Item Details via Centered Modal (Priority: P3)

A student taps on any task row in the list to inspect item details. The system dims the background and presents a centered dialog with rounded corners. The student dismisses the dialog by tapping outside or pressing Escape.

**Why this priority**: Prepares the task inspection and editing container for subsequent task workflows.

**Independent Test**: Tap any task row in the list to open the centered modal over a dimmed backdrop scrim, then dismiss it.

**Acceptance Scenarios**:

1. **Given** a visible task in the list, **When** the student taps the task row, **Then** the system displays a centered modal dialog occupying approximately 60% of viewport height with approximately 45px horizontal margins over a dimmed scrim.
2. **Given** an open task modal, **When** the student taps the backdrop or presses Escape, **Then** the modal closes and restores focus.

---

### Edge Cases

- **Zero Tasks Available**: When no tasks exist, the system displays an empty scroll region without breaking fixed header or bottom navigation layout.
- **Long Course or Task Names**: Text wraps or truncates gracefully without pushing the checkbox out of view or clipping row borders.
- **Rapid Checkbox Taps**: Repeated toggling preserves accurate local completion status without inconsistent UI states.
- **Varying Screen Heights**: The fixed header and bottom navigation remain pinned while the middle task list scrolls smoothly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a fixed top header containing a 44px tap target hamburger button on the left, a centered "To-do" title in Quicksand 700, a lower divider, and an empty 44px circular placeholder on the right.
- **FR-002**: System MUST display a fixed 64px bottom navigation bar with three tabs: To-Do (ClipboardList icon, active), Calendar (Calendar icon, inactive stub), and Notes (PenSquare icon, inactive stub).
- **FR-003**: System MUST render a flat list of tasks sorted by scheduled date in ascending order without filter controls.
- **FR-004**: Each task row MUST display a centered left date column (weekday, day number, month), middle content with course name colored by course palette, task title in semibold main text, time label in muted text, and a right-aligned checkbox.
- **FR-005**: System MUST render a 1px primary color divider line between rows featuring a solid dot at its left start edge.
- **FR-006**: Checking a task checkbox MUST toggle the task completion status with distinct visual feedback.
- **FR-007**: Tapping the hamburger button MUST open an empty white rounded panel anchored top-left under the button without a background scrim.
- **FR-008**: The burger panel MUST close when the user taps outside or presses the Escape key.
- **FR-009**: Tapping a task row MUST open an empty centered modal occupying approximately 60% viewport height with approximately 45px side margins over a semi-transparent scrim (`rgba(0, 0, 0, 0.4)`).
- **FR-010**: The task modal MUST accept the selected task item as a component property and provide a screen-reader-only title.
- **FR-011**: The task modal MUST close when the user taps outside the dialog or presses the Escape key.

### Key Entities

- **Task**: Represents an academic work item with attributes for unique identifier, course linkage, title, scheduled date, and completion status.
- **Course**: Represents an enrolled academic class with attributes for identifier and name used to compute palette styling.

### Dependencies

- **shadcn-vue**: UI primitives for Checkbox, Dialog, and Popover.
- **lucide-vue-next**: Icon set for Menu, ClipboardList, Calendar, and PenSquare.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view and scroll all scheduled tasks in a 390px baseline mobile viewport without horizontal overflow.
- **SC-002**: Tapping a task checkbox updates the visual completion indicator within 100 milliseconds.
- **SC-003**: Opening and closing the burger popover or item modal requires exactly one user action.
- **SC-004**: 100% of interactive controls provide at least a 44px by 44px tap target boundary.

## Assumptions

- `TaskResponse` and backend types do not change; mock fixtures add a display-only `time` string ("3:00 PM", "11:59 PM", "5:30 PM", "7:30 AM") to match `todo-main.png`, while real time source is to be decided later.
- `TaskResponse` contains `title`; course names come from linked `CourseResponse` records.
- Fixture text corrects spelling to "Object-Oriented Programming" and "Computer Architecture and Organization".
- Calendar and Notes bottom navigation tabs link to placeholder routes with empty stubs.
- Task completion toggles update local state and sync with the mock tasks adapter when available.
- Header right circle remains an empty 44px placeholder for future mascot art.
- Burger panel and item modal contain no internal form fields or menu items in this slice.
