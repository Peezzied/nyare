# Feature Specification: Calendar Item Details and Week-View Category Markers

**Feature Branch**: `008-calendar-item-details`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "apply week-view category marker from what we talked. apply in the detailed view (the presentation that shows when user clicked on a calendar item in the calendar view) the following: given a task calendar view item, show the linked note that is clickable with navigation to that note + a button to mark as complete the task + time window + duration. given an event, show linked note as well with navigation + time window + duration"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identify item categories in the week view (Priority: P1)

A student opens the week view and sees class meetings, academic events, and academic tasks side by side. Each item shows a small category marker so the student knows the item type before opening it.

**Why this priority**: The week view mixes three item types. Without a marker the student cannot tell a rigid event from a flexible task at a glance. This is the smallest slice that delivers clear value.

**Independent Test**: Open the week view with a day that holds a class, an event, and a task. Confirm that each item shows its own category marker. Confirm a screen reader announces the category.

**Acceptance Scenarios**:

1. **Given** a week with a class meeting, **When** the week view renders, **Then** the class item shows the class marker and no alarm or checkbox indicator.
2. **Given** a week with an academic event, **When** the week view renders, **Then** the event item shows the event marker.
3. **Given** a week with an academic task, **When** the week view renders, **Then** the task item shows the task marker.
4. **Given** any week-view item, **When** a screen reader focuses the item, **Then** the item exposes an accessible label that names the category.

---

### User Story 2 - Inspect and complete a task from the calendar (Priority: P1)

A student taps a task item in the calendar. The detailed view opens. The view shows the linked journal note, a control to mark the task complete, the time window, and the duration. The student taps the linked note and lands on that note.

**Why this priority**: The task is the main actionable item. Mark-complete and note navigation from the calendar remove taps and app switches. This slice carries the core value of the request.

**Independent Test**: Tap a task that has a linked note and a duration. Confirm the note link, the complete control, the time window, and the duration appear. Tap the note link and confirm the note opens. Return and mark the task complete.

**Acceptance Scenarios**:

1. **Given** a task with a source note, **When** the student opens the task detailed view, **Then** the view shows the linked note as a control.
2. **Given** the task detailed view, **When** the student taps the linked note, **Then** the app navigates to that note.
3. **Given** the task detailed view, **When** the student activates the complete control, **Then** the task status becomes complete and the calendar reflects the change.
4. **Given** a task with a scheduled date, **When** the student opens the task detailed view, **Then** the view shows the time window.
5. **Given** a task with a duration, **When** the student opens the task detailed view, **Then** the view shows the duration.
6. **Given** a task with no source note, **When** the student opens the task detailed view, **Then** the view hides the note link.

---

### User Story 3 - Inspect an academic event from the calendar (Priority: P2)

A student taps an academic event in the calendar. The detailed view shows the linked journal note and the time window. The student taps the linked note and lands on that note. The view shows no duration because an academic event has none.

**Why this priority**: Events are rigid constraints. Showing the source note helps the student prepare. This mirrors the task view and reuses the same detail presentation.

**Independent Test**: Tap an academic event that has a linked note. Confirm the note link and the time window appear. Confirm no duration appears. Tap the note link and confirm the note opens.

**Acceptance Scenarios**:

1. **Given** an academic event with a source note, **When** the student opens the event detailed view, **Then** the view shows the linked note as a control.
2. **Given** the event detailed view, **When** the student taps the linked note, **Then** the app navigates to that note.
3. **Given** an academic event, **When** the student opens the event detailed view, **Then** the view shows the time window.
4. **Given** an academic event, **When** the student opens the event detailed view, **Then** the view shows no duration.
5. **Given** an academic event with no source note, **When** the student opens the event detailed view, **Then** the view hides the note link.

---

### User Story 4 - Preview every detail state from one shared component (Priority: P3)

A developer opens the component preview. One shared detail component renders all three item types: class, task, and event. Mock data covers every state, including a missing note link, a missing duration, an open task, a completed task, and a task with no scheduled date.

**Why this priority**: One shared component removes duplicate markup. Complete mock data proves every requirement, including the hide states, without manual setup.

**Independent Test**: Open the component preview and confirm the shared component renders a class, a task, and an event. Confirm the preview includes states with no note link, no duration, a completed task, and a task with no scheduled date.

**Acceptance Scenarios**:

1. **Given** the shared detail component, **When** it renders a class, **Then** it shows the class fields and the class controls.
2. **Given** the shared detail component, **When** it renders a task and an event, **Then** it reuses the same component without a separate task or event component.
3. **Given** the mock data, **When** the preview loads, **Then** a task without a note hides the note link.
4. **Given** the mock data, **When** the preview loads, **Then** a task without a duration hides the duration.
5. **Given** the mock data, **When** the preview loads, **Then** a completed task shows the completed state.

---

### Edge Cases

- A task is already complete: the complete control shows the completed state and does not send a second update.
- The complete update fails: the view keeps the prior state and shows an error message.
- A task has no duration: the view hides the duration and never shows a value.
- An academic event never shows a duration because the event carries none.
- A task has no scheduled date: the view shows the task category in place of a time window.
- A source note was deleted: the note link hides, and the detail view stays usable.
- The linked note title is long: the view truncates the title and keeps the tap target at least 44 by 44 pixels.
- A week day holds more items than the visible limit: the week view shows the overflow count and each visible item keeps its marker.
- A visible week crosses a year boundary: the week number follows the Thursday of that week. Sunday 27 December 2026 to Saturday 2 January 2027 shows week 53, and Sunday 28 December 2025 to Saturday 3 January 2026 shows week 1.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The week view MUST show a category marker on each item. The marker MUST distinguish a class meeting, an academic event, and an academic task. The marker MUST use the tri-block form: an alarm or flag indicator for an academic event, a completion indicator for an academic task, and no indicator for a class meeting.
- **FR-002**: The class marker MUST use a lower-contrast fill without an alarm or checkbox indicator.
- **FR-003**: The event marker MUST use an alarm or flag indicator.
- **FR-004**: The task marker MUST use a completion indicator. The task marker MAY show a duration badge.
- **FR-005**: Every category marker MUST expose an accessible label that names the category.
- **FR-006**: A tap on a task calendar item MUST open the detailed view for that task.
- **FR-007**: A tap on an academic event calendar item MUST open the detailed view for that event.
- **FR-008**: The task detailed view MUST show the linked source note when the task has one.
- **FR-009**: The task detailed view MUST navigate to the linked note when the student taps the note control.
- **FR-010**: The task detailed view MUST show a control that marks the task complete.
- **FR-011**: The complete control MUST persist the change through the task status update and MUST update the local task state from the saved result. The client MUST NOT refetch the full task list.
- **FR-012**: The task detailed view MUST show the time window of the task.
- **FR-013**: The task detailed view MUST show the duration when the task has one.
- **FR-014**: The academic event detailed view MUST show the linked source note when the event has one.
- **FR-015**: The academic event detailed view MUST navigate to the linked note when the student taps the note control.
- **FR-016**: The academic event detailed view MUST show the time window of the event.
- **FR-017**: The academic event detailed view MUST NOT show a duration. An academic event carries no duration.
- **FR-018**: The detailed view MUST hide the note link when no source note exists.
- **FR-019**: The detailed view MUST hide the duration when the duration is unknown. The system MUST NOT fabricate a duration or a deadline.
- **FR-020**: The complete control and the note control MUST each keep a minimum 44 by 44 pixel tap target and an accessible name.
- **FR-021**: One shared detail component MUST render the class, task, and event detailed views. The system MUST NOT keep a separate component for each item type.
- **FR-022**: The shared detail component MUST show only the fields that exist for the item. It MUST hide a missing field instead of showing a placeholder.
- **FR-023**: The system MUST include mock data that exercises every detailed-view state: a class, a task with a note, a task without a note, a task with a duration, a task without a duration, a scheduled task, a task with no scheduled date, an open task, a completed task, an event with a note, and an event without a note.
- **FR-024**: The mock data MUST exercise every week-view marker state: a class item, an event item, an open task item, a completed task item, and a day with more items than the visible limit.
- **FR-025**: The week view MUST show the ISO-8601 week number of the visible week in the left gutter of the week row header, above the time labels and left of the first day column. The number MUST be the ISO week of the Thursday of the visible Sunday-to-Saturday week. The label MUST have the accessible name `Week <number>`, MUST be non-interactive, and its text MUST meet a 4.5:1 contrast ratio on the header background. The label MUST NOT change the day-column widths, the two-chip limit, the `+N` overflow, or the day-cell tap target.

### Key Entities *(include if feature involves data)*

- **Course**: Academic container. Owns every schedule, note, task, and event. Gives each item its deterministic color.
- **Schedule**: Recurring weekly class meeting. A class calendar item comes from a schedule. A class has a fixed start and end time.
- **Journal Entry (`Note`)**: Student text linked to a course and an entry date. A task or an event points to its source note through a note identifier.
- **Task**: Actionable item of a course. Holds a status, an optional scheduled date, an optional duration, and an optional source note. The tri-state category is derived, not stored.
- **Academic Event**: Time-anchored occurrence of a course, such as an exam or a deadline. Holds a deadline and an optional source note. Holds no duration.
- **Calendar Item Category**: Visual classification of a calendar item as a class, an academic event, or an academic task.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can name the category of any week-view item in under 2 seconds without opening the item.
- **SC-002**: A student reaches the source note of a task from the calendar in 2 taps or fewer.
- **SC-003**: A student marks a task complete from the calendar in 2 taps or fewer and sees the new state within 1 second.
- **SC-004**: 100% of calendar item detailed views show a time window. Every task with a known duration shows the duration. No academic event shows a duration.
- **SC-005**: 0 fabricated durations or deadlines appear in any detailed view.
- **SC-006**: Every category marker and detail control passes an automated accessibility name check.

## Assumptions

- The detailed view presentation exists or ships with this feature. The presentation expands from the tapped calendar item and returns on close.
- One shared detail component renders the class, task, and event content. The three item types differ by data, not by separate components.
- The linked note of a task or an event is the source journal entry held in the item note identifier. A note navigation opens the existing note editor route for that note.
- Mark-complete sets the task status to `COMPLETED`.
- The detailed view reuses the existing calendar detail presentation for classes, tasks, and events.
- Durations use the existing ISO-8601 duration attribute on tasks. The system renders a task duration only when the attribute is present. Academic events carry no duration.
- The category marker uses the tri-block icons from the design system: a flag or alarm for an event, a completion check for a task, and no icon for a class.
- The application targets a 390-pixel mobile viewport. All new controls follow the existing design system.
- Week items use the existing deterministic course color.
- Mock data lives in the existing mock and fixture layer. The mock data powers the component preview and the offline run.

## Dependencies

- Tasks and academic events expose a source note identifier.
- The task status update endpoint exists and returns the saved task.
- The note route exists for note navigation.
- The calendar detail presentation uses one shared detail component for the class, task, and event content.
- The component preview tool hosts the shared component stories.
