# Feature Specification: Swipeable Day Calendar with Untimed Top Section

**Feature Branch**: `002-swipeable-day-calendar`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "calendar looks good, now this time make it like swipeable like in google calendar. The day view can be swiped left or right to show the next day or past day. And there could be something on top but below the day date considering this is also a task/event instead of just schedules, so if there's no specific time on the task/event then it will stay on top like yeah on google calendar day view"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Swipe to Navigate Previous and Next Days (Priority: P1)

A student views their day calendar on a mobile device and navigates between days by swiping left or right across the screen. Swiping left moves forward to the next day. Swiping right moves backward to the past day. The header date and calendar contents update to reflect the newly selected day.

**Why this priority**: Fast horizontal day navigation represents the primary user interaction pattern for daily planning on touch devices, matching expected mobile calendar gestures.

**Independent Test**: Load the day view on a touch or pointer-enabled screen. Swipe left across the calendar view. Verify that the displayed date advances by one day and displays the corresponding day's schedule and tasks. Swipe right and verify that it returns to the previous day.

**Acceptance Scenarios**:

1. **Given** the calendar displays Wednesday, Oct 14, **When** the user swipes horizontally from right to left across the day view threshold, **Then** the calendar transitions to Thursday, Oct 15 and displays events for Thursday.
2. **Given** the calendar displays Wednesday, Oct 14, **When** the user swipes horizontally from left to right across the day view threshold, **Then** the calendar transitions to Tuesday, Oct 13 and displays events for Tuesday.
3. **Given** the user starts a horizontal swipe but releases before crossing the activation threshold, **When** the gesture cancels, **Then** the view snaps back to the current day without changing the selected date.
4. **Given** the user scrolls vertically down the time grid, **When** the user gestures predominantly vertically, **Then** the vertical scroll functions normally without triggering horizontal day transitions.

---

### User Story 2 - View Untimed Tasks and Events in Top All-Day Section (Priority: P2)

A student has academic tasks or events scheduled for a specific date that lack a specific hour-and-minute time window. The student sees these items neatly organized in a dedicated horizontal bar or section placed directly below the date header and above the scrollable hourly schedule grid, identical to Google Calendar's all-day / untimed section.

**Why this priority**: Nyare operates on day-level granularity for study plan tasks and course events that have deadlines or scheduled dates without specific hourly time blocks. These items need prominent visibility without colliding with timed class blocks.

**Independent Test**: Provide tasks and events scheduled for the active date with and without specific start/end times. Verify that untimed items render inside the top untimed section while timed items render on the vertical time axis grid.

**Acceptance Scenarios**:

1. **Given** a task or academic event is scheduled for the selected date without a specific time-of-day, **When** the day view displays, **Then** the item appears inside the top untimed section below the date header.
2. **Given** the user swipes to a different day, **When** the new day loads, **Then** the untimed section updates to show only tasks and events associated with that new day.
3. **Given** the top untimed section contains items, **When** the user scrolls through the hourly time grid below, **Then** the top untimed section remains anchored below the date header (or scrolls smoothly above the time grid) so it remains accessible.
4. **Given** a day has no untimed tasks or events, **When** the user views the day, **Then** the top section collapses or displays an unobtrusive empty state without consuming unnecessary screen space.

---

### User Story 3 - Expand Multiple Untimed Items (Priority: P3)

A student has several untimed tasks and academic events on the same day. The top section presents them clearly with compact badges or pills, showing an expandable count or vertical expansion when more items exist than fit the initial compact view.

**Why this priority**: High-workload days may accumulate multiple tasks and event deadlines; the untimed section must remain organized without occupying the entire mobile screen.

**Independent Test**: Load a day containing four untimed items. Verify that the user can see them cleanly or expand the section to inspect all untimed items for that date.

**Acceptance Scenarios**:

1. **Given** multiple untimed items exist for the date, **When** the student inspects the untimed section, **Then** each item displays its title and course association with clear visual distinctions (e.g., task vs. academic event).
2. **Given** the untimed item list exceeds the default compact height, **When** the user taps an expand toggle, **Then** the section expands to reveal all items for the day.

---

### Edge Cases

- **Swipe conflict with vertical scroll**: What happens when the user swipes diagonally? The gesture detector must distinguish between vertical scrolling (browsing hours) and horizontal swiping (navigating days), honoring vertical scrolling when vertical displacement exceeds horizontal displacement.
- **Rapid consecutive swipes**: How does the system handle rapid left/right swipes? The transition must cleanly update the target date sequentially without skipping days or getting locked in mid-animation state.
- **Empty day state**: What happens when the user swipes to a day with no scheduled classes, tasks, or events? The view shows the empty hourly grid and empty untimed top section without throwing errors or breaking swipe navigation.
- **Long item titles in top section**: How do long task or event titles display in the compact untimed bar? Titles must truncate with an ellipsis or wrap within bounded pill chips to avoid horizontal viewport overflow.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide horizontal swipe gesture detection on the Day View enabling users to navigate between consecutive days.
- **FR-002**: System MUST transition forward by one calendar day when the user performs a leftward swipe exceeding the threshold distance.
- **FR-003**: System MUST transition backward by one calendar day when the user performs a rightward swipe exceeding the threshold distance.
- **FR-004**: System MUST update the date title in the header immediately upon completing a day swipe transition.
- **FR-005**: System MUST provide a dedicated untimed items container positioned below the date header and above the scrollable hourly schedule grid.
- **FR-006**: System MUST place tasks and academic events scheduled for the active date that lack specific start and end times into the top untimed container.
- **FR-007**: System MUST render untimed tasks and events with course context indicators and status indicators distinct from hourly class blocks.
- **FR-008**: System MUST update the contents of the untimed container dynamically when the active date changes via swipe navigation.
- **FR-009**: System MUST prevent horizontal swipe gestures from blocking native vertical scrolling inside the hourly calendar grid.
- **FR-010**: System MUST limit the default vertical height of the untimed top container to preserve primary visibility for the hourly grid view.

### Key Entities *(include if feature involves data)*

- **DayCalendarView**: The presentation model for a single day, encapsulating the active calendar date, the collection of timed events positioned on the hourly grid, and the collection of untimed tasks/events positioned in the top section.
- **UntimedDayItem**: An item representing either a scheduled `Task` (with `scheduledDate` matching the day, without time-of-day) or an `AcademicEvent` (deadline on that date, without specific class time), including title, course label, category type (task vs event), and completion status.
- **SwipeGestureState**: Presentation state tracking touch/pointer start coordinates, displacement offset, direction axis lock (horizontal vs vertical), and threshold trigger status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can swipe left or right to switch between consecutive days in under 300 milliseconds of gesture completion.
- **SC-002**: 100% of untimed tasks and events scheduled for the active date render exclusively in the top section and never appear misplaced as 0:00 midnight blocks on the hourly grid.
- **SC-003**: Gesture disambiguation allows users to scroll through 24-hour vertical grid lines without accidental day switching on 98% of vertical scroll attempts.
- **SC-004**: The untimed top section consumes no more than 25% of the mobile viewport height in its default state, reserving at least 75% for the hourly schedule timeline.

## Assumptions

- Touch and pointer swipe gestures are calibrated for mobile screens (viewport width 360px - 430px) with responsive compatibility on desktop mouse drag.
- Study plan tasks have day-level granularity (date only, no specific hour); academic events provide date or deadline dates. Any task or event without a specific start/end hour belongs in the top untimed section.
- Timed course class blocks (schedules) continue to render on the vertical time axis grid based on their `startTime` and `endTime`.
- Swiping moves strictly by one calendar day increment per gesture.
