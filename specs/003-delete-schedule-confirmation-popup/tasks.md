# Tasks: Reusable Delete Schedule Confirmation Popup

**Input**: Design documents from `/specs/003-delete-schedule-confirmation-popup/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Optional test tasks are included below for the component's main acceptance scenarios.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing integration points and create the component file

- [ ] T001 [P] Verify existing dependencies and assets are present: `frontend/src/assets/mascot/duckota_feedback.png`, `schedulesApi.delete` in `frontend/src/api/schedules.ts`, `useCatalog().applyScheduleDeleted` in `frontend/src/composables/useCatalog.ts`, and `getCourseColor` in `frontend/src/constants/palette.ts`
- [ ] T002 Create the component skeleton in `frontend/src/components/DeleteScheduleConfirmDialog.vue`

---

## Phase 2: Foundational (Blocking Prerequisites)

No shared blocking tasks beyond T001 and T002.

---

## Phase 3: User Story 1 - Confirm Schedule Deletion (Priority: P1)

**Goal**: Opened popup identifies the selected schedule, prevents repeated submissions, calls the existing delete API on CONFIRM, and notifies the parent after success.

**Independent Test**: Render the component with a valid target, open it, press CONFIRM once, mock a successful `schedulesApi.delete` response, and verify one delete request, one `deleted` event, and modal closure.

- [ ] T003 [US1] Implement `open` and `schedule` props plus `update:open`, `deleted`, and `cancel` emits in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T004 [US1] Implement overlay, centered `rounded-2xl` card, required `duckota_feedback.png` mascot, red title, confirmation message, schedule color indicator, and CONFIRM button in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T005 [US1] Implement `isDeleting` protection and `schedulesApi.delete(schedule.id)` orchestration, emitting `deleted(id)` only after success in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T006 [P] [US1] Unit test: successful deletion calls API once and emits `deleted` in `frontend/src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts`

---

## Phase 4: User Story 2 - Dismiss Without Deletion (Priority: P1)

**Goal**: Secondary gray Back action closes the popup without deletion.

**Independent Test**: Render the component open with a valid target, press Back, and verify no delete request, `update:open(false)`, and no false success event.

- [ ] T007 [US2] Implement Back dismissal and `cancel` emission in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T008 [US2] Block Back dismissal while `isDeleting` is true in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T009 [P] [US2] Unit test: dismissal emits no delete request and no success event in `frontend/src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts`

---

## Phase 5: User Story 3 - Handle Deletion Failure (Priority: P2)

**Goal**: Failed deletion reports the existing error, leaves data unchanged, and restores retryability.

**Independent Test**: Mock `schedulesApi.delete` to reject, press CONFIRM, and verify no `deleted` event, visible error, and retryable CONFIRM button.

- [ ] T010 [US3] Implement `ApiError` display and error state cleanup in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T011 [P] [US3] Unit test: failed deletion emits no success event and restores retry state in `frontend/src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts`

---

## Phase 6: User Story 4 - Unselected or Invalid Target (Priority: P3)

**Goal**: The component cannot perform a hard-coded or invalid deletion.

**Independent Test**: Render the component with a null target and verify CONFIRM is disabled and no request can be sent.

- [ ] T012 [US4] Disable CONFIRM when `schedule` is null or deletion is pending in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T013 [P] [US4] Unit test: null target disables deletion in `frontend/src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts`

---

## Phase 7: Accessibility and Visual Compliance

**Purpose**: Keep the popup accessible and aligned with Nyare and shadcn references

- [ ] T014 [P] Implement `role="dialog"`, `aria-modal="true"`, labeling, overlay dismissal, and Escape handling in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T015 [P] Implement focus movement to the Back action on open without adding focus-trap dependencies in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T016 [P] Verify visual tokens: overlay `rgba(0, 0, 0, 0.4)`, `rounded-2xl` surface, red button `#DC2626` / `#991B1B`, secondary gray Back, Quicksand UI text, and `getCourseColor` indicator in `frontend/src/components/DeleteScheduleConfirmDialog.vue`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verification required by frontend AGENTS gates

- [ ] T017 Run `npm run lint:oxlint` and fix findings in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T018 Run `npm run type-check` and fix findings in `frontend/src/components/DeleteScheduleConfirmDialog.vue`
- [ ] T019 Run the targeted Vitest file `frontend/src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts` if included

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies
- **Phase 2**: No separate tasks
- **Phase 3**: Depends on T002
- **Phase 4**: Depends on Phase 3
- **Phase 5**: Depends on Phase 3
- **Phase 6**: Depends on Phase 3
- **Phase 7**: Depends on Phase 3
- **Phase 8**: Depends on completed implementation

### User Story Dependencies

- US1 can start after T002
- US2 and US3 depend on core deletion behavior from T005
- US4 can be implemented with US1 because it uses the same `schedule` null check
- All visual/accessibility tasks depend on the component skeleton

### Parallel Opportunities

- T001 is parallel with T002
- T006, T009, T011, and T013 are optional tests and can run in parallel after their implementation tasks
- T014 and T015 are parallel with T016 once T004 is complete
- T017 and T018 are independent verification tasks

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 and T002
2. Complete T003 through T005
3. Validate confirm deletion independently
4. Add US2, US3, US4, accessibility, and polish tasks

### Incremental Delivery

1. Confirming deletion works end to end
2. Dismissal safety added
3. Failure reporting and retry
4. Invalid selection handling and polish

---

## Notes

- Unit tests are required as part of this feature's implementation scope.
- Parent integration remains another team member's responsibility.
- No backend, API, catalog, routing, or layout changes are included in these tasks.