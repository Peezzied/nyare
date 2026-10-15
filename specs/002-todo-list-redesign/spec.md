# Feature Specification: Revise To-do List Screen and Task Detail Placeholder

**Feature Branch**: `002-todo-list-redesign`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "revise the To-do list screen to the new reference, and replace the item modal with a full-page placeholder. This supersedes the list layout and the modal part of spec 001. Keep the header shell, bottom nav, burger placeholder panel, router, and app shell."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Categorized Task List with Filtering and Accordions (Priority: P1)

A student views their academic tasks organized by virtual planning category (`Scheduled`, `Later`, `Backlog`). Under the screen title, the student toggles between "All" and individual planning categories using a segmented pill control. In the "All" view, three collapsible sections group tasks by category. Toggling a category section collapses or expands that section. Selecting an individual filter displays only tasks belonging to that category in a flat list without section headers.

**Why this priority**: Core navigation and categorization deliver the primary value of the revised planner view, allowing students to focus on immediate work or long-term backlog.

**Independent Test**: Load the To-do screen, verify the default "All" view with Scheduled open and Later/Backlog closed, toggle section collapse buttons, and select specific filters to confirm flat categorized displays.

**Acceptance Scenarios**:

1. **Given** the user lands on the To-do screen, **When** default state loads, **Then** the filter is "All", the "Scheduled" section is expanded, and "Later" and "Backlog" sections are collapsed.
2. **Given** the user is viewing "All", **When** the user clicks the section header of "Later", **Then** the chevron rotates from right to down and the tasks in "Later" expand into view without changing the active filter.
3. **Given** multiple tasks across categories, **When** the user selects the "Later" segment, **Then** only Later tasks render as a flat list with no section header, and the active pill displays filled primary background with white text.

---

### User Story 2 - Rich Task Row Presentation and Due Urgency (Priority: P2)

A student inspects individual task rows. Each row displays a completion checkbox on the left, course name in its assigned color, task title, display time, duration badge, calendar icon colored by date urgency, and a due date label. Overdue tasks and tasks due today display a red calendar icon with "TODAY" for tasks due on the current day. Tasks due in 1 to 2 days display yellow, tasks due in 3 or more days display green, and tasks without due dates display a neutral muted calendar icon without a date label.

**Why this priority**: Visual hierarchy and color-coded urgency provide immediate feedback on what tasks require urgent attention without manual date calculation.

**Independent Test**: Verify task rows against mock fixtures with varying due date offsets (0, 1, 2, 3, 5, 15, 40 days) to ensure red, yellow, green, and neutral icon states appear with correct labels.

**Acceptance Scenarios**:

1. **Given** a task due today (offset 0 days), **When** rendered in the list, **Then** its calendar icon uses the red urgency token and the label below displays "TODAY".
2. **Given** a task due in 2 days (offset 2 days), **When** rendered in the list, **Then** its calendar icon uses the yellow urgency token and the label below displays its due date as `mm/dd`.
3. **Given** a task due in 10 days (offset >= 3 days), **When** rendered in the list, **Then** its calendar icon uses the green urgency token and the label displays `mm/dd`.
4. **Given** a task with no due date, **When** rendered in the list, **Then** its calendar icon displays in neutral muted color and no label appears below it.
5. **Given** a task with duration (e.g., 30 minutes, 60 minutes, 90 minutes), **When** rendered in the row, **Then** the duration text displays as "30m", "1hr", or "1.5hr" in lighter teal-muted text directly to the left of the calendar icon.

---

### User Story 3 - Task Status Toggle and Completed State (Priority: P3)

A student completes a task by tapping its checkbox. Tapping the checkbox marks the task completed or returns it to todo without navigating away from the list. Completed tasks remain in their section with strikethrough styling and reduced opacity.

**Why this priority**: Essential interaction for student productivity and daily task clearing.

**Independent Test**: Click a checkbox on an uncompleted task, confirm status toggles, strikethrough and opacity apply, and navigation is not triggered.

**Acceptance Scenarios**:

1. **Given** an active task in any section, **When** the user clicks the checkbox on the left, **Then** the task updates to completed, the checkbox reflects checked state, the title applies strikethrough and reduced opacity, and the screen remains on the list.
2. **Given** a completed task, **When** the user clicks the checkbox again, **Then** the task returns to active status and normal opacity.

---

### User Story 4 - Task Detail Navigation and Dedicated Placeholder (Priority: P4)

A student taps on a task row to inspect full details. The app navigates to a dedicated full-page route `/tasks/:id`. The page displays a top header with a 44px back button and centered title, an empty placeholder body, and the persistent bottom navigation bar with the To-do tab highlighted. If the student enters an invalid task ID, the application redirects to `/`.

**Why this priority**: Replaces the obsolete popup modal with a scalable full-page screen architecture while maintaining navigation context.

**Independent Test**: Click any task row (excluding checkbox) to navigate to `/tasks/:id`. Test back button navigation back to `/`. Navigate directly to `/tasks/non-existent-id` to verify redirection to `/`.

**Acceptance Scenarios**:

1. **Given** a task row in the list, **When** the user clicks anywhere on the row outside the checkbox, **Then** the application navigates to `/tasks/:id`.
2. **Given** the Task Detail page, **When** displayed, **Then** the top header has a 44px back button with an ArrowLeft icon, the title is centered, the body is empty, and the bottom navigation shows the To-do tab as active.
3. **Given** the Task Detail page, **When** the user clicks the back button, **Then** the app navigates back to the To-do list view.
4. **Given** a route to `/tasks/unknown-task-id`, **When** loaded, **Then** the router redirects the user to `/`.

---

### Edge Cases

- **Task with no due date and no scheduled date**: Task belongs to Backlog (or Later if duration is present). The calendar icon is muted neutral and no date label is rendered below the icon.
- **Overdue task (due date before today)**: Whole days difference is less than or equal to 0; calendar icon renders in red urgency color with `mm/dd` date label.
- **Task with non-round duration**: Formats using standard hour fractions (e.g., 90 minutes -> "1.5hr", 120 minutes -> "2hr", 45 minutes -> "45m").
- **Collapsing an empty section**: Sections with 0 tasks still show the section header and collapse/expand controls without throwing errors.
- **Rapid checkbox clicks**: Optimistic update handles state cleanly and preserves checkbox isolation from row navigation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a pill-shaped segmented filter control under the title with options: "All", "Scheduled", "Later", "Backlog".
- **FR-002**: The active filter segment MUST display filled primary background with white text, while the segmented container has a thin border.
- **FR-003**: The header avatar MUST remain an empty placeholder without mascot illustration.
- **FR-004**: When filter is "All", system MUST display three collapsible sections in order: `Scheduled`, `Later`, `Backlog`.
- **FR-005**: Each section header MUST include a toggle button with an expand/collapse chevron (down when expanded, right when collapsed), section title, and a divider line.
- **FR-006**: Default collapse state for "All" MUST have "Scheduled" open and "Later" and "Backlog" closed.
- **FR-007**: When a specific filter is selected ("Scheduled", "Later", or "Backlog"), system MUST render only tasks matching that category as a flat list with no section headers.
- **FR-008**: Collapsed/expanded state of sections MUST be tracked independently of the active filter selection.
- **FR-009**: Category derivation MUST use `task.planCategory ?? getPlanCategory(task)`.
- **FR-010**: Task rows MUST position the selection checkbox on the left.
- **FR-011**: Task rows MUST position course name (bold, wrapped, in course palette text color), task title, and display time in the middle section.
- **FR-012**: Task rows MUST position suggested duration text (lighter teal-muted) to the left of the calendar icon on the right.
- **FR-013**: Duration MUST be formatted as minutes if under 60 (e.g. "30m"), whole hours (e.g. "1hr"), or decimal hours (e.g. "1.5hr"), and hidden if duration is absent.
- **FR-014**: Calendar icon color MUST reflect whole days between due date and local today: red for overdue or today (<= 0 days), yellow for 1 to 2 days, green for 3 or more days, and neutral muted when due date is absent.
- **FR-015**: A date label below the calendar icon MUST display "TODAY" if due today, `mm/dd` if due on another date, or be hidden if no due date exists.
- **FR-016**: Urgency color tokens MUST be defined in CSS theme tokens: red (`#D50000`), yellow (`#F6BF26`), green (`#0B8043`).
- **FR-017**: Tasks in Scheduled MUST be sorted by due date ascending (falling back to scheduledDate or createdAt). Tasks in Later and Backlog MUST be sorted by `createdAt` ascending.
- **FR-018**: Completed tasks MUST remain visible in their section with strikethrough styling on title and reduced opacity on the row.
- **FR-019**: Tapping a task row MUST navigate to `/tasks/:id`.
- **FR-020**: Tapping the checkbox MUST toggle task completion status and MUST NOT trigger row navigation.
- **FR-021**: The `/tasks/:id` route MUST render a full-page placeholder (`TaskDetailView.vue`) containing a top header with a 44px back button (ArrowLeft) and centered title, empty body, and bottom navigation bar with To-do tab active.
- **FR-022**: An unknown task ID navigated via `/tasks/:id` MUST redirect to `/`.
- **FR-023**: The modal component `TodoItemModal.vue` and its references MUST be removed.
- **FR-024**: Mock fixtures MUST include a display-only due date map with `scheduledDate` fallback and supply at least 12 dummy tasks covering all categories, duration variants, and due date offsets (0, 1, 2, 3, 5, 15, 40) using specified course names.
- **FR-025**: Existing shared types (`TaskResponse`, etc.) MUST NOT be modified.

### Key Entities *(include if feature involves data)*

- **Task**: Academic action item with attributes: `id`, `courseId`, `title`, `description`, `scheduledDate`, `duration`, `status`, `planCategory`, `createdAt`, `updatedAt`.
- **PlanCategory**: Derived virtual category: `SCHEDULED` (scheduled date present), `LATER` (duration present, no date), `BACKLOG` (neither present).
- **TaskUrgency**: Derived display state based on calendar difference between due date and current date: `OVERDUE_OR_TODAY` (red), `APPROACHING` (yellow), `FUTURE` (green), `NONE` (muted).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of tasks display in their correct section (`Scheduled`, `Later`, `Backlog`) according to derived `PlanCategory`.
- **SC-002**: Filter switching between "All" and specific categories updates view instantly with zero page reload.
- **SC-003**: 100% of due tasks display calendar icon urgency colors matching date math (<=0 red, 1-2 yellow, >=3 green).
- **SC-004**: Tapping a row navigates to task detail placeholder in under 100ms; tapping checkbox toggles status without navigation.
- **SC-005**: All existing unit tests in `src/api` continue to pass without modification.

## Assumptions

- Task due dates for mock display are resolved from fixture map `TASK_DUE_DATES` with `task.scheduledDate` as fallback.
- Today's date is computed from local client time at midnight for whole-day difference calculation.
- Back button on task detail uses browser back navigation or navigates to `/` if no history exists.
- The 44px back button adheres to mobile touch target requirements from `DESIGN.md`.
- Time-of-day strings continue to be display-only via `TASK_DISPLAY_TIMES` without time-blocking logic.
- Lucide Vue Next provides `ChevronDown`, `ChevronRight`, `Calendar`, and `ArrowLeft` icons.
- Section divider lines use standard theme border styling without introducing third-party accordion dependencies.
- No new external packages or state management libraries are introduced.
