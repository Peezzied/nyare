# Feature Specification: Configurable Planning and Backdating Horizons

**Feature Branch**: `015-configure-planning-horizons`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "make it them configurable and connect the setting to the frontend"

## Clarifications

### Session 2026-10-24
- Q: Where and how should the settings interface be presented in the frontend? → A: A dedicated Settings page reachable from a navigation link inside the hamburger menu panel.
- Q: How should the Settings page handle saving changes made to horizon values? → A: Explicit "Save" tactile button with input validation and confirmation toast, accompanied by a "Reset to Defaults" button restoring 14-day defaults.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Planning Horizon for Study Scheduling (Priority: P1)

Students prepare for upcoming academic events on different schedules. Some students prefer to plan studies two weeks ahead. Other students need a four-week or one-week lookahead window. A student opens the application settings and adjusts the study planning horizon to their preferred number of days. When the student processes notes, the planner considers events and schedules preparation tasks within the chosen horizon.

**Why this priority**: The planning horizon directly controls how far in advance the system generates preparation tasks. Customizing this value aligns the planning engine with individual study habits.

**Independent Test**: Set the planning horizon to 21 days in settings. Add an academic event 18 days in the future. Trigger note processing. Confirm the system schedules a study preparation task for the event.

**Acceptance Scenarios**:

1. **Given** a student with a configured planning horizon of 21 days, **When** the student triggers study planning, **Then** the system detects upcoming academic events occurring within 21 days and generates preparation tasks.
2. **Given** a student with an event scheduled beyond their configured planning horizon, **When** study planning runs, **Then** the system ignores the distant event until it enters the configured window.
3. **Given** a new user account, **When** checking the default settings, **Then** the planning horizon defaults to 14 days.

---

### User Story 2 - Configure Note Backdating Horizon (Priority: P2)

Students often catch up on journal entries after illness, travel, or exams. The default two-week backdating limit prevents recording older lectures. A student accesses settings and increases the maximum backdating limit. The student can now save journal notes dated further into the past.

**Why this priority**: Students need flexibility to record retrospective class notes without artificial rejection errors when catching up on past course material.

**Independent Test**: Set the maximum note backdating limit to 30 days. Create a new journal note with an entry date 25 days in the past. Confirm the application saves the note successfully.

**Acceptance Scenarios**:

1. **Given** a student with backdating horizon set to 30 days, **When** creating a note with an entry date 25 days before today, **Then** the system accepts and saves the note.
2. **Given** a student attempting to create a note dated older than the configured backdating limit, **When** submitting the note, **Then** the system rejects the request with a clear explanatory validation message.
3. **Given** a new user account, **When** checking the default settings, **Then** the note backdating horizon defaults to 14 days.

---

### User Story 3 - View and Edit Preferences via Dedicated Settings Page (Priority: P3)

A student wants to inspect and adjust their planning horizons directly in the web application. The student opens the hamburger navigation panel, clicks "Settings", and navigates to the dedicated Settings page. The student views the current horizon values. The student adjusts the day values using numeric inputs with clear minimum and maximum boundaries. The student saves the changes and sees immediate visual confirmation.

**Why this priority**: A dedicated user interface allows users to discover, view, and adjust their horizons without modifying configuration files.

**Independent Test**: Open the hamburger panel, click Settings to navigate to `/settings`, change values, save, refresh the page, and verify the updated values persist.

**Acceptance Scenarios**:

1. **Given** an active user session, **When** the user opens the side navigation menu, **Then** a "Settings" option is visible and accessible.
2. **Given** the Settings view is open, **When** viewing the controls, **Then** current values for planning horizon and backdating horizon are displayed.
3. **Given** invalid input values below minimum or above maximum boundaries, **When** attempting to save, **Then** the interface blocks submission and displays helpful guidance.
4. **Given** valid modifications, **When** the user clicks save, **Then** the system persists the settings and displays a confirmation toast message.
5. **Given** custom or altered horizon values, **When** the user clicks "Reset to Defaults", **Then** the input fields immediately reset to 14 days.

---

### Edge Cases

- What happens when a user enters 0 or negative days? The system rejects values outside the allowed positive range.
- What happens when a user sets an excessively large planning horizon (such as 365 days)? The system caps the maximum allowed horizon to prevent performance degradation.
- What happens when the user adjusts the horizon after notes are already processed? Previously scheduled tasks remain intact. Only subsequent planning runs use the new horizon.
- What happens when a user switches accounts? Each account maintains its own distinct horizon preferences.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a user preference to configure the study planning horizon in days.
- **FR-002**: System MUST default the study planning horizon to 14 days for new accounts.
- **FR-003**: System MUST restrict the study planning horizon to valid bounds between 1 day and 60 days.
- **FR-004**: System MUST provide a user preference to configure the note backdating horizon in days.
- **FR-005**: System MUST default the note backdating horizon to 14 days for new accounts.
- **FR-006**: System MUST restrict the note backdating horizon to valid bounds between 1 day and 60 days.
- **FR-007**: System MUST use the user's configured planning horizon when generating upcoming event study preparation tasks.
- **FR-008**: System MUST enforce the user's configured backdating horizon when validating note entry dates.
- **FR-009**: System MUST provide a dedicated Settings page reachable from a navigation link in the hamburger panel for viewing and updating horizon preferences.
- **FR-010**: System MUST persist horizon settings per user account across sessions.
- **FR-011**: System MUST provide an explicit Save action on the Settings page to validate and persist modified values with toast feedback.
- **FR-012**: System MUST provide a Reset to Defaults action on the Settings page that restores planning and backdating horizons to their 14-day defaults.

### Key Entities

- **User Preferences**: Stores user-specific operational settings. Contains planning horizon days, backdating horizon days, and links to the owning user account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can change and save planning horizon settings in fewer than 3 clicks from the main application view.
- **SC-002**: 100% of study planning runs apply the student's active configured planning horizon for upcoming event discovery.
- **SC-003**: 100% of journal note creation requests validate entry dates against the student's active configured backdating limit.
- **SC-004**: Settings updates persist immediately with visual confirmation within 1 second.

## Assumptions

- Each user account has independent preferences stored on the server.
- The planning horizon bounds are set between 1 and 60 days to protect planning quality and performance.
- The backdating horizon bounds are set between 1 and 60 days to protect journal integrity.
- Existing historical notes remain valid even if the user later reduces their backdating horizon.
- The Settings view is a standalone page accessible from the hamburger drawer navigation list alongside Manage Courses and Archive.
