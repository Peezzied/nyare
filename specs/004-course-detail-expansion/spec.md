# Feature Specification: Course Block Expansion & Detail View

**Feature Branch**: `004-course-detail-expansion`

**Created**: 2026-10-16

**Status**: Draft

**Input**: User description: "when a calendar block, specifically a course block, it should show a page when it is clicked with popup animation like google calendar's. what i want to achieve is the google calendar mobile behavior"

## Clarifications

### Session 2026-10-16

- Q: What information must be displayed in the expanded detail views for course blocks versus other calendar blocks (tasks, academic events)? → A: Course blocks must display ONLY: course color dot beside course name, course name, time window, and shortcut action buttons to tasks and linked notes in list view. Other calendar blocks (tasks, academic events) must display ONLY: title and a singular linked note.
- Q: Where should the shortcut action buttons for tasks and linked notes display their list views when tapped? → A: Navigate to the existing `/tasks` or `/notes` pages. As route query filtering is not yet implemented on these targets, build a lean navigation scaffold with explicit comments for future filter binding.

## User Scenarios & Testing *(mandatory)*

As a student viewing my daily timetable,
I want to tap a course block on the calendar and watch it fluidly expand into a full course detail view,
So that I can immediately inspect the class location, instructor, and schedule without losing my place in the day.

**Why this priority**: Core user touchpoint. This provides immediate access to course details directly from the schedule calendar grid with seamless spatial continuity.

**Independent Test**: On the schedule calendar view, tap an existing course card. The card expands outward from its tapped coordinates into a full-height detail view displaying the course title, time span, and meeting info.

**Acceptance Scenarios**:

1. **Given** the user is viewing the day calendar with scheduled course blocks, **When** the user taps a course block, **Then** the course block expands from its exact on-screen position into a full-height course details view within 350 milliseconds.
2. **Given** a course block is partially scrolled off the top or bottom of the viewport, **When** the user taps the visible portion, **Then** the detail view animates smoothly from that visible bounding area into the full view without jumping.

---

### User Story 2 - Dismissing Detail View Returns to Calendar Grid (Priority: P1)

As a student reviewing a class detail view,
I want to dismiss the view and watch it collapse smoothly back into its exact calendar block,
So that I return to the schedule with my calendar scroll position and selected date intact.

**Why this priority**: Essential companion to P1 for a complete, non-disruptive user journey. Without seamless return, calendar orientation is lost.

**Independent Test**: From an open course detail view, tap the back button or trigger the dismiss gesture. The detail view contracts back to the original course block location on the calendar grid, preserving the calendar scroll position.

**Acceptance Scenarios**:

1. **Given** the course detail view is open, **When** the user taps the back/close button, **Then** the view animates in reverse, contracting back into the dimensions and position of the origin course card.
2. **Given** the user dismisses the course detail view, **When** the view finishes closing, **Then** the day calendar retains the exact scroll offset, active day, and time indicators as before the tap.
3. **Given** the user is on a mobile device with a system back gesture or button, **When** the user triggers the back action while the detail view is open, **Then** the view closes back to the calendar without navigating away from the calendar page.

---

### User Story 3 - Inspecting Course Block Detail View (Priority: P2)

As a student reviewing a class on my schedule,
I want to see strictly the course color dot, course name, time window, and shortcut action buttons to tasks and linked notes,
So that I have focused access to academic work without extraneous data cluttering the view.

**Why this priority**: Directly enforces the concise academic information boundary defined for course blocks.

**Independent Test**: Open a course detail view from the calendar grid. Confirm only the color dot, course title, time range, and shortcut action buttons appear.

**Acceptance Scenarios**:

1. **Given** a course block is clicked, **When** the detail view opens, **Then** the view displays exclusively the course color dot beside the course name, the full course name, the scheduled time window, and shortcut action buttons to tasks and linked notes.
2. **Given** the course detail view is open, **When** the user taps the shortcut action for tasks or linked notes, **Then** the application navigates to the `/tasks` or `/notes` route (scaffolded to pass the course identifier with comments for future route query filtering).

---

### User Story 4 - Inspecting Other Calendar Blocks (Tasks and Academic Events) (Priority: P2)

As a student viewing scheduled tasks or academic events on my calendar,
I want to tap a block and see its title and singular linked note,
So that I can quickly verify what preparation note belongs to that deadline or event.

**Why this priority**: Defines the consistent presentation rules for non-course calendar items.

**Independent Test**: Tap a task or academic event block. Confirm the detail view shows the title and its singular linked note.

**Acceptance Scenarios**:

1. **Given** a scheduled task or academic event block on the calendar, **When** the user taps the block, **Then** the view displays strictly the item's title and its singular linked note reference.

---

### Edge Cases

- **Fast Repeated Tapping**: If the user double-taps or taps another block while an expansion animation is running, the system must ignore subsequent taps until the view transition finishes.
- **Blocks Without Linked Note**: If a task or event has no linked note, the detail view displays only the title without an empty or broken note section.
- **Long Course Titles**: Titles exceeding two lines must wrap cleanly without clipping action buttons or obscuring the time window.
- **Screen Resize or Orientation Change**: If the mobile device rotates or changes dimensions while the detail view is open, the view must adapt to the new full dimensions.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST detect a tap or click on any calendar course block and record the tap origin position on screen.
- **FR-002**: The system MUST transition the tapped block from its initial screen coordinates into a full-height mobile view using continuous spatial expansion.
- **FR-003**: The detail view for a COURSE BLOCK MUST display strictly and only: course color dot beside the course name, course name, time window, and shortcut action buttons navigating to the `/tasks` and `/notes` list views (scaffolded with code comments for upcoming query filters).
- **FR-004**: The system MUST provide an explicit close control that collapses the detail view back into the origin block's coordinates.
- **FR-005**: Closing the detail view MUST restore full interaction to the underlying calendar grid without resetting scroll position or selected date.
- **FR-006**: The system MUST handle device back actions while the detail view is open to dismiss the view rather than navigating to a previous page.
- **FR-007**: The detail view MUST be contained as an in-page overlay so that viewing a course does not trigger a page refresh or route teardown.
- **FR-008**: The detail view for OTHER BLOCKS (task, academic event) MUST display strictly and only: the item title and singular linked note.

---

### Key Entities *(include if feature involves data)*

- **Course Block Detail View**: A modal presentation surface for course blocks displaying exclusively the course color dot, course name, time window, and shortcut buttons to tasks and linked notes.
- **Non-Course Block Detail View**: A modal presentation surface for tasks and academic events displaying exclusively the item title and its singular linked note.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The expansion animation completes in under 350 milliseconds without perceptible visual stutter.
- **SC-002**: 100% of calendar scroll position and day selection are preserved after closing the course detail view.
- **SC-003**: Users can open, view course details, and return to the calendar in under 5 seconds.
- **SC-004**: Zero unintended route navigations occur when opening or closing the course detail view.

---

## Assumptions

- The primary device target is a mobile viewport (baseline width 390px) as defined by project design standards.
- Course data displayed in the detail view is derived from existing calendar event and catalog models.
- The expansion operates as an in-page overlay layer positioned above the calendar timeline.
- Hardware and browser back actions can be intercepted with browser history state to ensure natural mobile back navigation.
