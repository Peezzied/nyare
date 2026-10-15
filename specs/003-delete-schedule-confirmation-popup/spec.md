# Feature Specification: Reusable Delete Schedule Confirmation Popup

**Feature Branch**: `feat/delete-schedule-confirmation-popup`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Implement a reusable Delete Schedule Confirmation Popup component for the Nyare application... The component receives a selected schedule, shows a red-titled confirmation dialog with a schedule indicator, a prominent red CONFIRM action, a secondary Back dismiss action, and a semi-transparent overlay. Confirming deletion calls the existing schedule deletion operation and notifies the parent; dismissal closes without deleting."


## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm Schedule Deletion (Priority: P1)

A student has selected a schedule and activates the existing Delete action owned by the parent schedule UI. The application shows a compact confirmation popup over a dimmed background. The popup identifies the selected course/schedule, asks for confirmation, and performs deletion only after the student explicitly confirms. While deletion runs, repeated confirmation presses are prevented. On success, the parent is notified so it can update its cached schedule data.

**Why this priority**: Destructive actions require explicit confirmation and correct data updates; this is the core value of the component.

**Independent Test**: Render the component with a selected schedule target, open it, verify the title, message, schedule indicator, and course/schedule name, press CONFIRM once, mock a successful `schedulesApi.delete` response, and verify the delete request contains the selected schedule id and the `deleted` event is emitted once.

**Acceptance Scenarios**:

1. **Given** a persisted schedule target is supplied and the popup is open, **When** the student presses CONFIRM, **Then** the component calls `schedulesApi.delete(target.id)` exactly once and emits the successful deletion event with that id.
2. **Given** deletion is in progress, **When** the CONFIRM button is pressed again before the first request resolves, **Then** no second delete request is sent.
3. **Given** the delete request succeeds, **When** the request resolves, **Then** the component closes the modal and emits `deleted(target.id)` without refetching lists.

### User Story 2 - Dismiss Without Deletion (Priority: P1)

A student opens the confirmation popup and decides not to delete the selected schedule. The student presses the secondary `Back` action (or another supported dismissal). The popup closes immediately, no deletion request is sent, and no success notification is emitted.

**Why this priority**: Dismissal safety is equal in importance to confirmation for a destructive action.

**Independent Test**: Render the component open with a selected schedule target, press `Back`, and verify that no delete request is sent, `update:open` emits `false`, and no `deleted` event is emitted.

**Acceptance Scenarios**:

1. **Given** the popup is open, **When** the student presses `Back`, **Then** the component emits `update:open` with `false` and emits its cancel event.
2. **Given** deletion is in progress, **When** the student presses `Back`, **Then** dismissal is blocked until the request completes or fails.

### User Story 3 - Handle Deletion Failure (Priority: P2)

A student confirms deletion, but the existing backend operation fails or returns an error. The popup keeps the error within the project's existing error conventions, remains open or otherwise clearly reports failure, does not emit a false success event, and allows another attempt after the failure clears.

**Why this priority**: Failed destructive operations must not be hidden and must not corrupt local state.

**Independent Test**: Mock `schedulesApi.delete` to reject with an error, press CONFIRM, and verify that no `deleted` event is emitted, the popup remains usable, and CONFIRM can be pressed again after the failure resolves.

**Acceptance Scenarios**:

1. **Given** `schedulesApi.delete` rejects, **When** confirmation has been pressed, **Then** the component does not emit `deleted`, reports the failure using the existing error-handling convention, and returns the CONFIRM button to its default state.
2. **Given** a deletion failure, **When** the student retries, **Then** the selected target remains available for deletion.

### User Story 4 - Empty or Unselected State (Priority: P3)

The component is reusable across views. If it is opened without a valid selected schedule target, it does not perform a hard-coded deletion or show a fabricated schedule identity. It either remains disabled/inert or communicates that no schedule is selected through the parent's existing conventions.

**Why this priority**: Reuse requires safety when the expected input is missing.

**Independent Test**: Render the component with a null schedule target and verify the confirm action is disabled and no delete request can be sent.

**Acceptance Scenarios**:

1. **Given** the supplied schedule target is null, **When** the popup is open, **Then** CONFIRM is disabled and no deletion request can be sent.

---

### Edge Cases

- What happens when the selected schedule target ID changes while the popup is open?
- How does the component prevent repeated submissions while the existing delete request is pending?
- What happens if deletion succeeds but the parent does not update its cache?
- How does the popup behave when its overlay is clicked during an in-progress deletion?
- What happens when the course color cannot be resolved for the supplied target?
- How does the component report a backend `ProblemDetail` failure without inventing a new error model?

## Visual Design Reference *(mandatory for implementation)*

### Popup and overlay

- Render a centered, compact confirmation popup over a full-screen overlay.
- Overlay color: `rgba(0, 0, 0, 0.4)`. The dimmed underlying interface remains recognizable.
- Popup surface: white or warm off-white, `rounded-2xl`, subtle gray border, and soft shadow.
- Popup width: most of the available mobile width while retaining comfortable side margins.
- Layout remains compact, balanced, and readable on mobile screens.

### Popup content

- Title: `Delete Schedule`, prominent red text, near the upper-left.
- Mascot (required): existing `frontend/src/assets/mascot/duckota_feedback.png`, positioned near the upper-right of the popup, partially aligned with the title area. Preserve its aspect ratio and avoid overlap with title, message, schedule identity, and controls.
- Confirmation message: `Are you sure you want to delete the schedule:` in muted gray supporting text, wrapping naturally.
- Schedule identification: a small circular indicator using the selected course color, followed by the selected course or schedule name. The reference example `OOP` is illustrative only; the actual supplied name must be displayed.
- Confirm action: prominent red tactile button labeled `CONFIRM`, with white bold Quicksand text, rounded corners, `#DC2626` face, and `#991B1B` bevel.
- Back action: visually secondary gray action that dismisses without deletion, subordinate to CONFIRM and consistent with Nyare button conventions.

### Typography

- Use Quicksand for headings, labels, and buttons according to existing weights and conventions.
- Use the project's existing font conventions for supporting text instead of introducing a new typography system.

### Accessibility

- Follow shadcn/ui Alert Dialog or Dialog patterns for modal structure, focus handling, and dismissal.
- Keep accessible labels, focus indicators, and dismissal behavior intact.

### Design system and skill references

- Verify tokens against `frontend/DESIGN.md` before implementation.
- Reference existing Nyare screens, components, and `TactileButton.vue` for borders, shadows, spacing, and tactile button behavior.
- Consult the frontend skill references already present under `frontend/.agents/skills/`, including `shadcn-vue`, `ui-ux-pro-max`, `tailwind-4-docs`, and `taste-design`, where relevant.
- Use Google Stitch or UI Max only as supplementary design references; do not introduce a new UI library solely for this popup.

### Scope

- Implement only the popup and its dimming overlay.
- Do not implement, modify, or redesign the calendar grid, navigation bar, existing Delete button, Create Schedule screen, or surrounding page layout.
- Receive selected schedule data and visibility through the project's established component communication pattern.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The component MUST be a reusable Vue 3 component located under `frontend/src/components/` using `<script setup lang="ts">`.
- **FR-002**: The component MUST render only the popup and its semi-transparent overlay. It MUST NOT render, modify, replace, or control the calendar grid, navigation bar, Delete button, schedule creation interface, page layout, or any unrelated surface.
- **FR-003**: The component MUST accept a selected schedule target through props or the project's existing component communication pattern. It MUST NOT hard-code a course name, schedule identifier, or color.
- **FR-004**: The schedule identification MUST derive from the supplied schedule target and associated course data, including a small colored indicator and the selected course/schedule name.
- **FR-005**: The component MUST display the title `Delete Schedule` in red using the project's destructive visual convention.
- **FR-006**: The component MUST display the confirmation message `Are you sure you want to delete the schedule:` followed by the selected schedule identification.
- **FR-007**: The component MUST display a prominent red CONFIRM action using the project's tactile 3D destructive button convention (`#DC2626` face, `#991B1B` bevel).
- **FR-008**: The component MUST display a visually secondary `Back` dismissal action that closes the popup without deleting anything.
- **FR-009**: The component MUST render a semi-transparent gray overlay (`rgba(0, 0, 0, 0.4)` or equivalent) behind the popup.
- **FR-010**: The component MUST prevent accidental repeated submissions while deletion is in progress.
- **FR-011**: The component MUST invoke the existing `schedulesApi.delete` operation only when a valid schedule target and confirmed action are present.
- **FR-012**: The component MUST NOT invent, mock, or silently emulate a missing deletion endpoint. If the deletion contract changes, integration must use the documented existing contract only.
- **FR-013**: The component MUST handle deletion failures using the project's existing error-handling conventions and MUST NOT display a false success message.
- **FR-014**: After successful deletion, the component MUST notify the parent using an emitted event or existing project pattern so the parent can update schedule data without refetching unrelated lists.
- **FR-015**: The component MUST be self-contained and MUST NOT directly mutate parent catalog or router state.
- **FR-016**: The component MUST support accessibility for modal structure, focus handling, and dismissal behavior consistent with shadcn/ui Alert Dialog or Dialog reference guidance.
- **FR-017**: The component MUST NOT introduce new runtime dependencies solely for this component if the project already provides the required functionality.
- **FR-018**: The component MUST reuse existing Nyare typography, color, rounded-corner, border, shadow, and tactile button conventions wherever applicable.
- **FR-019**: The component MUST use only existing project assets, if any decorative asset is used. It MUST NOT create unrelated illustrations or assets.
- **FR-020**: The popup MUST derive its course color indicator from the existing deterministic palette function (`getCourseColor(courseId)`) or equivalent supplied data, never from a hard-coded color.
- **FR-021**: The component MUST disable CONFIRM when no valid schedule target is supplied.
- **FR-022**: The component MUST keep changes limited to the minimum files needed for the popup component, its types, and documentation of its parent integration.

### Visual functional requirements

- **FR-023**: The popup MUST use the existing required asset `frontend/src/assets/mascot/duckota_feedback.png` as its mascot. It MUST NOT create, redraw, replace, download, or substitute another illustration.
- **FR-024**: The Duckota image MUST preserve its aspect ratio and remain non-obstructive to the title, message, schedule identity, and controls.
- **FR-025**: The popup MUST use the established overlay color `rgba(0, 0, 0, 0.4)`.
- **FR-026**: The popup MUST use the established destructive button colors `#DC2626` and `#991B1B` with the existing tactile button treatment.
- **FR-027**: The popup MUST use Quicksand for headings, labels, and buttons and existing Nyare font conventions for supporting text.
- **FR-028**: The popup MUST use the existing course color only as a small circular schedule indicator.
- **FR-029**: The popup MUST keep compact, mobile-friendly proportions and side margins.
- **FR-030**: The popup MUST provide accessible focus, labeling, and dismissal behavior following shadcn/ui dialog reference patterns without adding a new UI library.

### Key Entities

- **Schedule Target (UI)**: A minimal immutable description of the selected schedule used by the popup. It carries the schedule id, owning course id, and display name. It may be constructed by the parent from `ScheduleResponse` plus `CourseResponse`.
- **Selected Schedule**: The existing persisted `ScheduleResponse` identified by id, course id, weekday, start time, and end time.
- **Course Color (UI)**: A deterministic 24-palette color derived from `courseId` using the existing `getCourseColor` function. It is a display-only value.
- **Delete Operation**: The existing `schedulesApi.delete(id)` request that returns no content on success.

### Frontend Component Contract *(mandatory)*

- Component source: `frontend/src/components/DeleteScheduleConfirmDialog.vue` (or the established Nyare component filename chosen during implementation).
- Proposed props:
  - `open: boolean` — controls popup visibility.
  - `schedule: DeleteScheduleTarget | null` — the selected schedule target; required for naming and deletion.
- Proposed standard events:
  - `update:open` with `boolean` — for visibility toggling using the project/Vue convention.
  - `deleted` with `number` — emitted only after `schedulesApi.delete` succeeds, carrying the schedule id.
  - `cancel` with no payload — emitted when the student dismisses without deletion.
- Standard emits may be split or renamed only if needed to match an existing project pattern. Any rename must be documented at the component boundary.
- Parent integration flow:
  1. Parent owns the existing Delete button and the selected schedule state.
  2. Clicking Delete stores the selected schedule target and sets `open` to `true`.
  3. The popup calls `schedulesApi.delete(target.id)` on CONFIRM.
  4. On success, the popup emits `deleted(target.id)`, closes itself, and the parent calls `useCatalog().applyScheduleDeleted(target.id)`.
  5. On failure, the popup reports the error using existing conventions and leaves list data unchanged.
- The parent is responsible for any calendar, navigation-bar, or list rendering changes.
- The component is responsible for modal structure, overlay, identification, button states, and deletion orchestration.

### Success Criteria *(mandatory)*

#### Measurable Outcomes

- **SC-001**: A reviewer can render the component with a supplied selected schedule and confirm it displays the title `Delete Schedule`, the confirmation message, a derived schedule indicator, and the selected course/schedule name without hard-coded values.
- **SC-002**: CONFIRM triggers exactly one `schedulesApi.delete` request for the supplied id and emits `deleted` exactly once on success.
- **SC-003**: Pressing `Back` closes the popup, emits no delete request, and emits no false success notification.
- **SC-004**: Repeated CONFIRM presses are ignored while deletion is pending.
- **SC-005**: A deletion failure emits no `deleted` event and returns the component to a retryable state.
- **SC-006**: The popup renders correctly on a 390px mobile viewport without overlay or card overflow.
- **SC-007**: The component passes Oxlint and TypeScript checks as required by the frontend AGENTS verification gates.

### Assumptions

- The first reference image provides parent/UI context only; this feature does not implement or modify the surrounding schedule interface.
- Backend schedule deletion is exposed by `DELETE /api/schedules/{id}` (verified in `backend/src/main/java/.../controller/ScheduleController.java`).
- The parent owns selection state and will supply the selected schedule target and any associated course lookup.
- The selected display name may be a course name (for example, `OOP`) because `ScheduleResponse` does not include a course name. The parent is expected to resolve and pass it.
- Verified against frontend source: `schedulesApi.delete(id)` exists in `frontend/src/api/schedules.ts`.
- Verified against frontend source: `useCatalog().applyScheduleDeleted(id)` exists in `frontend/src/composables/useCatalog.ts`.