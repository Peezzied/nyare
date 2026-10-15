# Research: New Course Interface

## Decision: Course color is temporary UI state

- **Decision**: Use the selected palette color ID only in frontend component state during New Course creation.
- **Rationale**: The existing `CourseRequest` contract has no color field. Sending or persisting color would require backend changes that are out of scope.
- **Alternatives considered**: localStorage/sessionStorage or backend persistence. Deferred or rejected for this phase to avoid fake persistence or scope expansion.

## Decision: Room is temporary UI state

- **Decision**: Collect room per time block and display it in the New Course flow only.
- **Rationale**: The existing `ScheduleRequest` contract has no room field. Sending it would exceed the current backend contract.
- **Alternatives considered**: Persisting it through backend changes. Deferred to a later approved phase.

## Decision: Multi-request course creation flow

- **Decision**: Create Course first, then create each time block as a separate Schedule request.
- **Rationale**: Existing APIs have no composite endpoint and support direct create for both entities.
- **Alternatives considered**: A bulk course-and-schedules endpoint. Rejected because no repository evidence requires it and it would add backend work.

## Decision: Partial failure handling

- **Decision**: Preserve the created Course, retain failed block drafts, allow retry only for failed blocks, and do not claim full success until all block requests succeed.
- **Rationale**: There is no cross-request transaction and automatic deletion would remove successfully persisted data.
- **Alternatives considered**: Deleting the course after failure. Rejected because it destroys successful records.

## Decision: Implementation surface

- **Decision**: Implement in the existing `ScheduleView.vue` at `/schedule`.
- **Rationale**: `WelcomeView.vue` already navigates there. No separate route evidence exists.
- **Alternatives considered**: Adding a dedicated route/component. Rejected as unnecessary for the approved scope.

## Decision: Modal and deletion work

- **Decision**: No Delete Schedule work is included in this phase.
- **Rationale**: Scope is limited to Create New Course interface only.<|end|><|start|>write to=assistant<|channel|>analysis<|message|>Wrote file successfully: specs/002-new-course-delete-schedule/research.md