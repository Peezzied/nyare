# Feature Specification: Create Schedule Week Calendar Preview

**Feature Branch**: `007-schedule-week-preview`

**Created**: 2026-10-17

**Status**: Complete

**Input**: User description: "in the create schedule, use the week calendar as the form visualizer to display the courses. the information on the course block is the course name only. the week row should not contain dates but only day of week only. use the image for your reference only. the user can tap on empty space in the calendar to add a new class."

## Clarifications

### Session 2026-10-17

- Q: When the student taps empty space in the week calendar, what does the new class become in the create schedule form? → A: A new class time (one more weekday/time block) for the course in the form. The behavior matches Google Calendar on mobile: the calendar outlines the tapped slot, and the create schedule view opens as a partially visible bottom sheet with the tapped day and time pre-filled.
- Q: What time slot should the outline and the pre-filled class time cover when the student taps empty space? → A: One hour, snapped down to the tapped hour. The start time is the tapped hour and the end time is the start plus one hour.
- Q: When the student taps a slot that already holds a course block, what should happen? → A: The bottom sheet opens to edit that class time. The tap starts no new class time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the course on a week calendar while building it (Priority: P1)

A student opens the create schedule form. A week calendar appears in the form. The student enters a course name, picks a color, selects weekdays, and sets a start time and an end time. The calendar shows the course on each selected weekday at the selected times. The calendar updates on each change.

**Why this priority**: The student must see the weekly shape of the course before saving. The preview turns separate form fields into one readable picture. This story alone delivers the feature value.

**Independent Test**: Open the form. Enter a course name. Select Monday and set 09:00 to 10:00. Confirm that a block appears in the Monday column from 09:00 to 10:00.

**Acceptance Scenarios**:

1. **Given** the form is open with no input, **When** the form loads, **Then** a week calendar appears with seven weekday columns and a time axis, and no course blocks.
2. **Given** the form is open, **When** the student enters a name and selects Monday 09:00 to 10:00, **Then** a block appears in the Monday column from 09:00 to 10:00.
3. **Given** a block is shown, **When** the student changes the end time, **Then** the block grows or shrinks to the new time.
4. **Given** a block is shown on Monday, **When** the student also selects Wednesday, **Then** a second block appears in the Wednesday column.
5. **Given** two time blocks have valid days and times, **When** the student views the calendar, **Then** the calendar shows the blocks of both time blocks.
6. **Given** a block is shown, **When** the student changes the course color, **Then** the block uses the new color.
7. **Given** the calendar shows empty space, **When** the student taps an empty slot, **Then** the calendar outlines the tapped slot and the create schedule form opens as a partially visible bottom sheet.
8. **Given** the bottom sheet is open after a tap, **When** the student reads the form, **Then** the form shows the tapped weekday and the tapped start time and end time in a new class time.
9. **Given** a block is shown, **When** the student taps the block, **Then** the bottom sheet opens with that class time ready to edit.

---

### User Story 2 - Read the course name on the block (Priority: P2)

The student reads the block on the calendar. The block shows the course name only. The block shows no room and no description.

**Why this priority**: The block must stay short at a small column width. The name alone keeps the block readable. The feature still works without this rule, so the priority is lower.

**Independent Test**: Enter the name "CS 101" and set a class time. Confirm that the block shows "CS 101" and no other course text.

**Acceptance Scenarios**:

1. **Given** the student enters "CS 101", **When** the block appears, **Then** the block shows "CS 101" and no other text.
2. **Given** the course carries a room or a description, **When** the block appears, **Then** the block shows the course name only.
3. **Given** the student enters a long course name, **When** the block appears, **Then** the text stays inside the block bounds.
4. **Given** the course name is empty, **When** the block appears, **Then** the block shows no name text.

---

### User Story 3 - Read weekday names only in the header (Priority: P3)

The student reads the calendar header row. The header row shows the seven weekday names only. The header row shows no calendar dates.

**Why this priority**: The preview shows one recurring week, not one dated week. Dates would mislead the student. The feature still works without this rule, so the priority is lower.

**Independent Test**: Open the form and read the header row. Confirm that it shows the seven weekday names and no date numbers.

**Acceptance Scenarios**:

1. **Given** the calendar appears, **When** the student reads the header row, **Then** the row shows the seven weekday names only.
2. **Given** any weekday, **When** the calendar appears, **Then** the header row shows no date number.

---

### Edge Cases

- A time block with no selected weekday shows no block on the calendar.
- A time block with an empty start time, an empty end time, or a start time that is not before its end time shows no block.
- A whitespace-only course name behaves as an empty name.
- Two time blocks share a weekday. Both blocks stay visible on the calendar.
- The student selects all seven weekdays. The calendar shows a block in each column.
- A course name is longer than the block width. The block clips the text inside its bounds.
- A class time starts before or ends after the visible time range. The time axis covers the full range of the selected class times.
- A class time is shorter than one hour. The block stays visible and keeps its text.
- A tap on an occupied slot opens the bottom sheet to edit that class time and starts no new class time.
- A tap outside the time axis starts no new class time.
- A tap on the last visible slot keeps the outlined hour inside the time axis.
- A tap creates a class time that clashes with a known course. The existing save validation blocks the save.
- The bottom sheet keeps the values that the student already entered in the form.
- The student closes the bottom sheet without a save. The outline clears, the form adds no class time, and an edited class time keeps its prior values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The create schedule form MUST include a week calendar preview.
- **FR-002**: The week calendar preview MUST show seven weekday columns and a time axis.
- **FR-003**: The preview MUST update on each change to the course name, the course color, a selected weekday, a start time, or an end time, without a save and without a page reload.
- **FR-004**: The preview MUST show a block in each selected weekday column, and MUST place the block by the start time and the end time of the time block.
- **FR-005**: Each block MUST show the course name text only, and MUST NOT show a room or a description.
- **FR-006**: The preview header row MUST show the seven weekday names only, and MUST NOT show a calendar date.
- **FR-007**: The preview MUST show the blocks of every time block in the form.
- **FR-008**: The preview MUST NOT show a block for a time block with no selected weekday.
- **FR-009**: The preview MUST NOT show a block when the start time is empty, the end time is empty, or the start time is not before the end time.
- **FR-010**: The preview MUST show a block with no name text when the course name is empty.
- **FR-011**: The preview MUST keep a long course name inside the block bounds.
- **FR-012**: The preview MUST use the course color that the student selects.
- **FR-013**: The preview MUST NOT store data by itself. It MUST NOT change the save result.
- **FR-014**: The preview MUST fit the mobile viewport without horizontal scrolling.
- **FR-015**: The preview MUST keep day-level granularity. It MUST NOT add time-blocking controls, priority values, or drag interactions.
- **FR-016**: The time axis MUST cover the range of the selected class times and the tapped slot.
- **FR-017**: When the student taps an empty time slot in the week calendar, the system MUST start a new class time for the course in the form.
- **FR-018**: On a tap of an empty slot, the system MUST outline the tapped time slot on the calendar. The outlined slot MUST cover one hour, from the tapped hour to the tapped hour plus one hour.
- **FR-019**: On a tap of an empty slot, the system MUST open the create schedule form as a partially visible bottom sheet, with the tapped weekday and the tapped start and end times set in the new class time.
- **FR-020**: The system MUST keep the current form values when the bottom sheet opens.
- **FR-021**: When the student taps a slot that holds an existing block, the system MUST open the create schedule form as a partially visible bottom sheet to edit that class time, and MUST NOT start a new class time.
- **FR-022**: A save from the bottom sheet MUST use the existing create schedule save flow.

### Key Entities *(include if feature involves data)*

- **Course**: An academic class container. Key attributes: name and color. A course owns zero or more class times.
- **Class time**: A recurring weekly meeting. Key attributes: selected weekdays, start time, end time.
- **Week preview**: A derived view of the course and its class times on a seven-day grid. It is never stored. It also accepts a tap to start or to edit a class time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can see the weekly shape of the course, that is the weekdays, the times, and the name, before the save step, inside the same form.
- **SC-002**: 100% of form changes to the name, a weekday, or a time appear in the preview without a save and without a reload.
- **SC-003**: 100% of blocks show the course name text only, and 0 header cells show a date.
- **SC-004**: A student can confirm the weekly shape of the course in under 10 seconds after entering the class times.
- **SC-005**: The preview adds no save delay and never changes the stored schedule.

## Assumptions

- The preview shows the course that the student creates in the form. It does not show other catalog courses.
- The student picks one course color from the existing palette, and the preview uses that color.
- The reference image defines the visual style only. It does not define which courses appear.
- The preview shows one recurring week. It shows no dates. It may emphasize the current weekday.
- The form already validates the course name and the class times. The preview reuses those values.
- The preview never stores data by itself. A save happens only through the form.
- A tap on an empty slot reuses the existing create schedule form. The form appears as a bottom sheet on top of the calendar.
- The application targets a mobile-first viewport.
- The feature uses day-level granularity, per the project constitution. It excludes hourly time-blocking and priority values.
