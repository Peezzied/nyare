# Feature Specification: New Course Interface

**Feature Branch**: `feat/setup-pages`
**Created**: 2026-10-14
**Status**: Draft — Frontend-only phase (Create New Course only)
**Implementation Scope**: Frontend only. No backend, database, schema, API, router, shared styling, or migration changes are included in this phase.
**Input**: User screenshots and description for the New Course interface; existing Nyare frontend/backend contracts and design conventions.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a New Course With Multiple Time Blocks (Priority: P1)

A student creates a course by entering a course name, selecting one course color, and adding one or more independent time blocks. Each time block has its own weekday, start time, end time, and room. Saving creates the course and all successfully entered recurring class meetings using the existing backend contracts.

**Why this priority**: Course creation is the entry point for schedules and downstream academic data.

**Independent Test**: Open the New Course interface, enter a course name, select a palette color, add at least two time blocks with different weekday, time, and room values, and save. Verify that one course and each successfully saved time block are created through the existing endpoints, with independent block values retained in the form.

**Acceptance Scenarios**:

1. **Given** a valid course name, a selected course color, and at least one complete time block, **When** the student saves, **Then** the course is created through the existing `coursesApi.create` contract and each time block is submitted as a separate `schedulesApi.create` request.
2. **Given** two time blocks in one form, **When** the student changes the weekday in the second block, **Then** the first block retains its original weekday, start time, end time, and room.
3. **Given** a selected course color, **When** the New Course form creates courses or schedule entries, **Then** the UI uses that same selected color for all time blocks and newly created schedule entries shown in the current session.
4. **Given** the “Add another time” action, **When** it is activated after the last time block, **Then** a new independent time-block card is appended below existing cards and the action moves beneath the new card.
5. **Given** Course creation succeeds but one or more Schedule creations fail, **When** save completes, **Then** the created course remains, successful Schedule responses are applied locally, failed blocks remain editable, and the UI does not claim full success.

### Edge Cases

- What happens when a student enters an invalid time range where the start time is not strictly before the end time?
- What happens when a duplicate or empty course name is submitted?
- How does the form present validation failures returned by the backend for course or schedule creation?
- What happens when a time block has no room value?
- What happens when the user adds several time blocks and rapidly edits them?
- How does the form behave if the network request is slow?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The New Course interface MUST allow entry of a course name.
- **FR-002**: The New Course interface MUST allow selection of exactly one course color from the application's existing 24-color palette.
- **FR-003**: The selected course color MUST be treated as belonging to the course in the UI, not as a property of an individual time block.
- **FR-004**: The UI MUST use the selected course color consistently for all time blocks and newly created schedule entries shown during the New Course flow.
- **FR-005**: The New Course interface MUST allow a course to have multiple time blocks.
- **FR-006**: Each time block MUST have independent scheduling details for weekday, start time, end time, and room.
- **FR-007**: The New Course interface MUST NOT include a “Repeat every week” toggle.
- **FR-008**: Each time block MUST be displayed in its own rounded card.
- **FR-009**: Consecutive time-block cards MUST be separated by small, consistent spacing.
- **FR-010**: The “Add another time” action MUST appear below the last time block.
- **FR-011**: Activating “Add another time” MUST append one new independent time block below existing blocks and move the action beneath the new block.
- **FR-012**: The course name and color selection MUST remain visually separate from the repeated time-block sections.
- **FR-013**: Weekday selectors MUST use rounded-square shapes rather than circular buttons.
- **FR-014**: Selected weekdays MUST be visually distinct from unselected weekdays.
- **FR-015**: Weekday selector corner radii, borders, and overall treatment MUST match existing app components.
- **FR-016**: The form MUST use existing color, typography, tactile button styling, rounded corner, spacing, and mobile-first layout conventions.
- **FR-017**: The New Course save flow MUST create the Course first through the existing backend contract, using name and resolved user identifier only.
- **FR-018**: The New Course save flow MUST use the returned `CourseResponse.id` for every subsequent Schedule request.
- **FR-019**: Each time block MUST be created as a separate Schedule request through the existing backend contract.
- **FR-020**: The UI MUST NOT send `color` or `room` under the existing course and schedule contracts.
- **FR-021**: If Course creation fails, the UI MUST NOT send Schedule requests, MUST preserve all entered form data, and MUST report the failure without modifying catalog state.
- **FR-022**: If Course creation succeeds but one or more Schedule creations fail, the UI MUST report that outcome, identify failed time blocks, preserve entered data, apply only successful responses locally, and MUST NOT state that all time blocks were saved.
- **FR-023**: The UI MUST retain the created course identifier after partial Schedule failure so failed blocks can be retried later.
- **FR-024**: The UI MUST NOT automatically delete the created course after partial Schedule failure.
- **FR-025**: The UI MUST NOT report complete success until every submitted time block has a corresponding successful Schedule creation response.
- **FR-026**: Loading, error, and empty states MUST be implemented without backend or API changes.
- **FR-027**: The implementation MUST reuse existing components, composables, types, and API functions where appropriate.
- **FR-028**: The implementation MUST NOT add dependencies or unrelated functionality without justification.

### Key Entities

- **Course**: Academic subject with an owner user and child schedules; created through the existing API.
- **Schedule**: One recurring weekly class meeting with a course reference, weekday, start time, and end time; created through the existing API.
- **Time Block (UI)**: A locally managed draft card in the New Course form. Each draft maps to one Schedule create request and retains independent weekday, start time, end time, and room values.
- **Course Color (UI)**: A selected 24-palette color ID used only in frontend state during this phase. It is not persisted by the existing backend.
- **Schedule Room (UI)**: A room text value collected per time block and used only in frontend state during this phase. It is not persisted by the existing backend.

## Frontend-Only Contract Decisions *(mandatory for this phase)*

- Using the existing `coursesApi.create` and `schedulesApi.create` endpoints is allowed. Modifying their backend implementations, API modules, type contracts, database files, router, shared styles, or unrelated files is prohibited in this phase.
- Course creation uses the existing `coursesApi.create(request)` contract, which accepts `name`, optional `description`, and optional `userId`.
- Schedule creation uses the existing `schedulesApi.create(request)` contract, which accepts `courseId`, `day`, `startTime`, and `endTime`.
- `day` MUST use the existing `DayOfWeek` enum values: `MONDAY` through `SUNDAY`.
- `startTime` and `endTime` MUST use ISO-8601 local time strings accepted by the existing backend, such as `HH:MM`.
- Room is collected in the form and displayed in the current session, but it is not sent to the existing backend.
- Selected color is used in the New Course UI and for created schedule entries shown during this phase, but it is not sent to the existing backend.
- Existing courses continue to use the deterministic `getCourseColor(course.id)` behavior when rendered outside the New Course flow.
- Selected color and room must not be described in user-facing success messages as persisted values.
- New Course creation sequence:
  1. Validate all locally required fields before any network request.
  2. POST the Course using the existing contract.
  3. If Course creation fails, stop, preserve all entered data, and report failure.
  4. If Course creation succeeds, use `CourseResponse.id` for each Schedule request.
  5. POST each time block as a separate Schedule request using existing fields.
  6. Apply only successful responses to `useCatalog` state.
  7. On partial Schedule failure, preserve entered data, identify failed blocks, and allow retry only for failed blocks.
  8. Do not claim full success until every submitted Schedule request succeeds.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: A student can create a course with a selected palette color and at least one time block using the existing API contracts.
- **SC-002**: A student can add at least three independent time blocks in one New Course form without one block overwriting another.
- **SC-003**: The selected color is applied consistently to all time blocks and created schedule entries during the New Course session.
- **SC-004**: If Course creation succeeds but one or more Schedule creations fail, the UI identifies the failed blocks and does not claim that all entered time blocks were saved.
- **SC-005**: The New Course interface renders without overflow on a 390px mobile viewport.
- **SC-006**: New Course behavior passes frontend lint and type checks.

### Assumptions

- This phase is frontend-only; backend, database, API, router, shared styling, and Delete Schedule work are deferred or out of scope.
- The New Course form reuses the existing `coursesApi` and `schedulesApi`, applying successful mutation responses to local `useCatalog` state.
- Validation uses the backend's existing course name length limit and schedule time integrity rules.
- Selected color and room are used immediately in the UI but are not persisted by the existing backend.
- Existing courses continue to use deterministic `getCourseColor(course.id)` outside the New Course flow.
- No new runtime dependencies are added for color selection or room input.
- Frontend changes must not imply that temporary UI state is persisted after reload.
- No application code has been implemented; this remains a planning/specification phase.