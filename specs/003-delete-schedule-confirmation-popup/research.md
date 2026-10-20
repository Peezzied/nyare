# Research: Reusable Delete Schedule Confirmation Popup

## Decision: Component communication pattern

- **Decision**: Use a controlled Vue dialog with `open` and `schedule` props plus `update:open`, `deleted`, and `cancel` emits.
- **Rationale**: This matches Vue's v-model convention and keeps deletion state inside the popup while leaving calendar/list ownership to the parent.
- **Alternatives considered**: A slot-based parent-operated dialog was rejected because it would move deletion orchestration into another team's component.

## Decision: Overlay rendering

- **Decision**: Render the overlay and dialog with `<Teleport to="body">` while `open` is true.
- **Rationale**: Existing screens such as `ScheduleView.vue` use constrained overflow containers; teleporting avoids clipping.
- **Alternatives considered**: In-place rendering was rejected because parent overflow can hide the overlay and popup.

## Decision: Schedule identity

- **Decision**: Require a `DeleteScheduleTarget` containing `id`, `courseId`, and `name`.
- **Rationale**: `ScheduleResponse` does not include a course name, and the popup must identify the real selected schedule without hard-coding.
- **Alternatives considered**: Passing separate props was rejected because the three values form one selection boundary and make the API easier to validate.

## Decision: Deletion orchestration

- **Decision**: The popup calls `schedulesApi.delete(schedule.id)` directly, disables repeated submission while pending, reports the existing `ApiError` message on failure, and emits `deleted(id)` only after success.
- **Rationale**: The spec requires the popup to invoke the supported deletion operation and allows self-contained reusable behavior. `schedulesApi.delete` returns `void`; failure throws and leaves state unchanged.
- **Alternatives considered**: Emitting only a `confirm` event and requiring the parent to delete was rejected because the spec asks the popup to perform the operation and notify after success.

## Decision: Visual assets and styling

- **Decision**: Import the existing required asset from `frontend/src/assets/mascot/duckota_feedback.png` and use Nyare tokens from `DESIGN.md`: overlay `rgba(0, 0, 0, 0.4)`, white `rounded-2xl` surface, red tactile `CONFIRM` with `#DC2626` and `#991B1B`, secondary gray `Back`, `getCourseColor(courseId).solid` indicator, and Quicksand UI typography.
- **Rationale**: These values are already specified and verified in the repository and avoid new tokens or dependencies.
- **Alternatives considered**: Introducing shadcn-vue component primitives or a new mascot asset was rejected because Nyare already provides the needed conventions and assets.

## Decision: Accessibility

- **Decision**: Implement native dialog semantics with `role="dialog"`, `aria-modal="true"`, labeled content, keyboard Escape dismissal outside pending deletion, and overlay dismissal. Focus moves to the secondary `Back` action when opening.
- **Rationale**: No UI library is needed while still following shadcn/ui dialog reference behavior.
- **Alternatives considered**: A full focus trap library was rejected to avoid an unnecessary dependency.