# Feature Specification: Day View Mobile Calendar

**Feature Branch**: `001-day-view`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "Day View of a mobile calendar app: the default view, and the same view with the burger menu open. Course blocks show the course name, time range and room. A line with a dot moves with the current time. The burger icon opens a menu with Edit Schedule, New Schedule, Delete Schedule, and Archive. The top right icon opens Schedule Archive. Bottom nav has three icons."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Daily Class Schedule (Priority: P1)

A student opens the mobile calendar to inspect classes for the selected date. The student sees class blocks positioned along a vertical time axis.

**Why this priority**: Displaying scheduled courses on the calendar grid provides the core value of Nyare.

**Independent Test**: Load the Day View with mock schedule data. Verify that class blocks appear at correct times with course name, time range, and detail.

**Acceptance Scenarios**:

1. **Given** a student selects Thursday, Oct 8, **When** the Day View loads, **Then** the system displays OOP from 8:30 to 10:30 AM with detail "Lab 204".
2. **Given** a student selects Thursday, Oct 8, **When** the Day View loads, **Then** the system displays CALC 2 from 11:30 AM to 1:30 PM with detail "Room 301".
3. **Given** a class starts before 8 AM or ends after 5 PM, **When** the Day View loads, **Then** the system extends the grid range to fit that class.
4. **Given** classes exist on the calendar, **When** the student views each block, **Then** the system assigns course colors from a fixed palette by courseId with green and blue first.

---

### User Story 2 - Track Current Time Indicator (Priority: P2)

A student views the schedule during the school day. The student observes a visual line that indicates the exact current time.

**Why this priority**: Students need immediate orientation to know whether classes are current, past, or upcoming.

**Independent Test**: Load the Day View at a specific time. Verify that a horizontal indicator line with a circle dot aligns with that exact minute.

**Acceptance Scenarios**:

1. **Given** the current time is 1:35 PM, **When** the student views the day timeline, **Then** the system displays a line with a dot at the exact 1:35 PM position.
2. **Given** the system time advances, **When** one minute passes, **Then** the system updates the indicator line position.
3. **Given** the current time is outside the visible grid range, **When** the student views the grid, **Then** the system hides the indicator line.

---

### User Story 3 - Access Schedule Actions via Menu (Priority: P3)

A student taps the menu icon at the top left to manage their schedule.

**Why this priority**: Students must manage their schedule options without cluttering the main grid view.

**Independent Test**: Tap the burger button. Verify that the menu opens with Edit Schedule, New Schedule, Delete Schedule, and Archive options.

**Acceptance Scenarios**:

1. **Given** the Day View is visible, **When** the student taps the burger icon, **Then** the system opens an action menu overlay.
2. **Given** the menu is open, **When** the student inspects the menu items, **Then** the system shows "Edit Schedule", "New Schedule", "Delete Schedule" in red, and "Archive".
3. **Given** the menu is open, **When** the student taps any menu action, **Then** the system emits a component event and closes the menu without backend calls.
4. **Given** the menu is open, **When** the student taps outside the menu, **Then** the system closes the menu.

---

### User Story 4 - Access Schedule Archive and Navigate Views (Priority: P4)

A student inspects the top right header icon and the bottom navigation bar.

**Why this priority**: Students navigate between major app sections and view historical schedules.

**Independent Test**: Verify that the top right icon triggers archive navigation and the bottom navigation highlights the calendar state.

**Acceptance Scenarios**:

1. **Given** the Day View header is visible, **When** the student taps the top right calendar archive icon, **Then** the system emits an archive navigation event.
2. **Given** the bottom navigation bar is visible, **When** the student views the bar, **Then** the system highlights the center calendar icon.

---

### Edge Cases

- How does the system handle an empty schedule for the selected day? The system displays an empty time grid without error.
- What happens when two courses overlap? The system renders both course blocks side by side.
- How does the indicator behave when current time falls outside the visible range? The system hides the time indicator line.
- What happens when a class falls outside 8 AM to 5 PM? The time grid extends earlier or later to fit that class.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a vertical time grid that defaults to 8 AM to 5 PM and extends to fit any class outside that range.
- **FR-002**: System MUST expand weekly schedules into dated class blocks for the selected date.
- **FR-003**: System MUST show the course name, formatted time range, and course detail from the description field inside each course block as-is without parsing.
- **FR-004**: System MUST position the real-time indicator line and dot at the exact current time.
- **FR-005**: System MUST assign course block colors on the frontend from a fixed palette by courseId with green and blue first because the backend has no color field.
- **FR-006**: System MUST render a top header bar with date title, burger icon, and archive icon.
- **FR-007**: System MUST open a menu with "Edit Schedule", "New Schedule", "Delete Schedule", and "Archive" upon tapping the burger icon.
- **FR-008**: System MUST render "Delete Schedule" with red warning text.
- **FR-009**: System MUST treat Edit, New, Delete, and Archive actions as placeholders that emit events only, with no backend calls.
- **FR-010**: System MUST check `frontend/src` for an existing layout, bottom nav, or mascot component, and reuse it instead of rebuilding.
- **FR-011**: System MUST render a bottom navigation bar with three icons, where the calendar icon displays an active state.
- **FR-012**: System MUST display the mascot illustration at the bottom right above the navigation bar.

### Key Entities

- **Course**: Academic subject with id, name, description, and user identifier.
- **Schedule**: Recurring weekly meeting with id, course id, day of week, start time, and end time.
- **DayEvent**: Dated calendar event mapped from Schedule, containing start date-time, end date-time, course title, and detail (from course description).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can identify upcoming classes and detail within 3 seconds of viewing the screen.
- **SC-002**: Schedule items for the selected day render within 500 milliseconds.
- **SC-003**: The current time indicator updates position accurately within 60 seconds.
- **SC-004**: 100% of menu actions emit events without network requests.

## Assumptions

- The target platform is a mobile viewport (375px to 430px width).
- Backend DTOs `CourseResponse` and `ScheduleResponse` provide the authoritative data contract.
- `CourseResponse` has no room field, so the system shows the description field as-is for event detail without parsing.
- The view shows today by default and accepts a selected date, and October 8 is mock data.
- The Weekly Calendar view and course click popup are out of scope for this feature.
- Schedule expansion uses the selected day of the week to calculate concrete calendar dates.
