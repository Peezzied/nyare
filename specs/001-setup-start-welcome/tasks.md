# Tasks: Start, Welcome, and Schedule Header Flow

**Feature**: [spec.md](spec.md)  
**Plan**: [plan.md](plan.md)  
**Date**: 2026-10-12  

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure router entries and root app wrapper layout.

- [X] T001 [P] Configure route entries for `/`, `/welcome`, and `/schedule` in `frontend/src/router/index.ts`
- [X] T002 [P] Clean up default template markup in `frontend/src/App.vue` to render centered parchment layout with `<RouterView />`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core UI components and state composable required by onboarding views.

- [X] T003 [P] Create tactile 3D button component `TactileButton.vue` in `frontend/src/components/TactileButton.vue`
- [X] T004 [P] Create unit tests for `TactileButton.vue` in `frontend/src/components/__tests__/TactileButton.spec.ts`
- [X] T005 [P] Create 3-dot step progress indicator component `StepProgress.vue` in `frontend/src/components/StepProgress.vue`
- [X] T006 [P] Create unit tests for `StepProgress.vue` in `frontend/src/components/__tests__/StepProgress.spec.ts`
- [X] T007 [P] Create student onboarding composable `useOnboarding.ts` with `studentName` and validation in `frontend/src/composables/useOnboarding.ts`

**Checkpoint**: Core components and composable ready. View implementation can now proceed.

---

## Phase 3: User Story 1 - View Start Screen and Begin Onboarding (Priority: P1) 🎯 MVP

**Goal**: Render landing screen with brand title `'Nyare`, coastal scenery, stone mascot, and "GET STARTED" button without progress dots.

**Independent Test**: Navigate to `/`. Verify title, subtitle, mascot, and "GET STARTED" button render. Confirm zero progress dots appear. Click "GET STARTED" and verify navigation to `/welcome`.

### Tests for User Story 1

- [X] T008 [P] [US1] Create unit tests for `StartView.vue` in `frontend/src/views/__tests__/StartView.spec.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement `StartView.vue` with brand title, background props, stone mascot, and "GET STARTED" button in `frontend/src/views/StartView.vue`

**Checkpoint**: User Story 1 is functional and testable independently as the initial MVP slice.

---

## Phase 4: User Story 2 - Enter Student Name on Welcome Screen (Priority: P2)

**Goal**: Render Welcome screen with 3-dot progress indicator (middle dot active), student name input, greeting mascot with speech bubble, and "CONTINUE" button.

**Independent Test**: Navigate to `/welcome`. Confirm middle dot is active. Confirm name input field and greeting mascot render. Verify "CONTINUE" button remains disabled until non-whitespace text is entered. Click "CONTINUE" with valid name and verify navigation to `/schedule`.

### Tests for User Story 2

- [X] T010 [P] [US2] Create unit tests for `WelcomeView.vue` in `frontend/src/views/__tests__/WelcomeView.spec.ts`

### Implementation for User Story 2

- [X] T011 [US2] Implement `WelcomeView.vue` with progress dots, name input, Duckota greeting with speech bubble, and reactive "CONTINUE" button in `frontend/src/views/WelcomeView.vue`

**Checkpoint**: User Stories 1 and 2 operate smoothly in sequence.

---

## Phase 5: User Story 3 - View Schedule Screen Header (Priority: P3)

**Goal**: Render Schedule screen top section with 3-dot progress indicator (third dot active), back button returning to `/welcome`, "Create a Schedule" title, and checkmark button. Strictly exclude calendar grid and bottom toolbar.

**Independent Test**: Navigate to `/schedule`. Verify third dot is active. Verify back button, title, and checkmark button render. Verify calendar grid and bottom toolbar do not render. Click back button and verify navigation to `/welcome`.

### Tests for User Story 3

- [X] T012 [P] [US3] Create unit tests for `ScheduleView.vue` in `frontend/src/views/__tests__/ScheduleView.spec.ts`

### Implementation for User Story 3

- [X] T013 [US3] Implement `ScheduleView.vue` rendering only the top header section in `frontend/src/views/ScheduleView.vue`

**Checkpoint**: Complete three-screen forward and backward onboarding navigation verified.

---

## Phase 6: User Story 4 - Accessible Keyboard and Screen Reader Navigation (Priority: P4)

**Goal**: Guarantee full keyboard operation, visible focus indicators, and accessible names across all three onboarding views.

**Independent Test**: Navigate using only the Tab key across Start, Welcome, and Schedule screens. Verify focus indicators and screen reader attributes on inputs and buttons.

### Implementation for User Story 4

- [X] T014 [P] [US4] Add accessible name labels and ARIA attributes for name input and action buttons in `frontend/src/views/WelcomeView.vue`
- [X] T015 [P] [US4] Add focus-visible styling and ARIA attributes for header navigation controls in `frontend/src/views/ScheduleView.vue`

**Checkpoint**: All three onboarding screens satisfy accessibility and keyboard requirements.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive layout refinement and end-to-end automated validation.

- [X] T016 [P] Verify mobile viewport centering and layout responsiveness across viewports in `frontend/src/assets/main.css`
- [X] T017 Run full validation suite (`npm run type-check`, `npm run lint`, `npm run test:unit`) per `specs/001-setup-start-welcome/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; starts immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1); blocks all User Stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2; can proceed independently.
- **User Story 2 (Phase 4)**: Depends on Phase 2; integrates with `useOnboarding.ts`.
- **User Story 3 (Phase 5)**: Depends on Phase 2; connects destination route from Welcome screen.
- **User Story 4 (Phase 6)**: Depends on Phases 3, 4, and 5 views existing.
- **Polish (Phase 7)**: Depends on all user story implementations completing.

### Parallel Opportunities

- `T001` and `T002` can execute in parallel.
- `T003`, `T005`, and `T007` can execute in parallel.
- `T004` and `T006` component tests can execute in parallel.
- Tests marked `[P]` within each story phase can run concurrently.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`, `T002`).
2. Complete Phase 2: Foundational (`T003` - `T007`).
3. Complete Phase 3: User Story 1 (`T008`, `T009`).
4. Validate Start screen independently at `/`.

### Incremental Delivery

1. Setup + Foundational -> Components and composables ready.
2. User Story 1 -> Brand landing screen operational (MVP).
3. User Story 2 -> Name entry and validation operational.
4. User Story 3 -> Schedule header and reverse navigation operational.
5. User Story 4 + Polish -> Accessibility and test suite verified.
