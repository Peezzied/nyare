# Tasks: Lift Navigation Bar Component

**Branch**: `001-lift-navigation-bar`

**Input**: Design documents from `specs/001-lift-navigation-bar/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify dependencies and define shared navigation types.

- [X] T001 [P] Verify dependencies and icon imports in frontend/package.json
- [X] T002 [P] Create navigation types and interface models in frontend/src/types/navigation.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core component scaffold and test harness required before feature logic.

- [X] T003 Create NavigationBar component shell with default destinations in frontend/src/components/NavigationBar.vue
- [X] T004 [P] Create unit test scaffold with mount fixtures in frontend/src/components/__tests__/NavigationBar.spec.ts

---

## Phase 3: User Story 1 - Primary View Navigation (Priority: P1) [MVP]

**Goal**: Deliver functional navigation across Tasks, Calendar, and Notes destinations.

**Independent Test**: Mount `NavigationBar.vue`, click each destination button, and verify active selection changes.

### Tests for User Story 1
- [X] T005 [P] [US1] Write unit tests for tab switching and modelValue binding in frontend/src/components/__tests__/NavigationBar.spec.ts

### Implementation for User Story 1
- [X] T006 [US1] Implement destination list rendering and modelValue update handler in frontend/src/components/NavigationBar.vue
- [X] T007 [US1] Integrate route matching and navigate event emission in frontend/src/components/NavigationBar.vue

---

## Phase 4: User Story 2 - Duolingo-Inspired Lift Animation (Priority: P2)

**Goal**: Deliver tactile 3D bottom bevel, active lift translation, and accent color feedback.

**Independent Test**: Verify active button has `-translate-y-1` lift styling and Ocean Cyan accent color.

### Tests for User Story 2
- [X] T008 [P] [US2] Write unit tests for lift displacement classes and accent styling in frontend/src/components/__tests__/NavigationBar.spec.ts

### Implementation for User Story 2
- [X] T009 [US2] Implement tactile 3D bottom bevel and resting state styles in frontend/src/components/NavigationBar.vue
- [X] T010 [US2] Implement active lift translateY transition and Ocean Cyan accent fill in frontend/src/components/NavigationBar.vue
- [X] T011 [US2] Implement active tap down compression physics in frontend/src/components/NavigationBar.vue

---

## Phase 5: User Story 3 - Mobile Thumb Reach & Accessible Controls (Priority: P3)

**Goal**: Deliver 44px minimum tap targets, fixed bottom docking, safe-area chin insets, and screen reader labels.

**Independent Test**: Measure touch target bounds and inspect ARIA attributes on mobile screen widths.

### Tests for User Story 3
- [X] T012 [P] [US3] Write unit tests for ARIA tablist semantics and 44px tap boundaries in frontend/src/components/__tests__/NavigationBar.spec.ts

### Implementation for User Story 3
- [X] T013 [US3] Implement fixed bottom dock positioning and safe-area chin padding in frontend/src/components/NavigationBar.vue
- [X] T014 [US3] Add accessibility attributes and prefers-reduced-motion queries in frontend/src/components/NavigationBar.vue

---

## Phase 6: Subagent Histoire Story Generation (Histoire Skill)

**Goal**: Deploy an isolated subagent to author the visual component story with interactive controls.

**Independent Test**: Run `npm run story` and verify `components/NavigationBar` displays all variants.

- [X] T015 Deploy subagent with histoire skill to author interactive story in frontend/src/components/NavigationBar.story.vue
- [X] T016 Verify Histoire story variants and responsive preview in frontend/src/components/NavigationBar.story.vue

---

## Phase 7: Polish & Verification

**Purpose**: Execute linters, type checks, and complete end-to-end validation.

- [X] T017 [P] Run fast oxlint check using npm run lint:oxlint in frontend/
- [X] T018 [P] Run TypeScript type-check using npm run type-check in frontend/
- [X] T019 Run full unit test suite using npx vitest run in frontend/src/components/__tests__/NavigationBar.spec.ts
- [X] T020 Validate quickstart scenarios against specs/001-lift-navigation-bar/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies
1. **Setup (Phase 1)**: Can start immediately.
2. **Foundational (Phase 2)**: Depends on Phase 1. Blocks User Story implementation.
3. **User Story 1 (Phase 3)**: Depends on Phase 2. Forms the core MVP.
4. **User Story 2 (Phase 4)**: Depends on Phase 3 completion.
5. **User Story 3 (Phase 5)**: Depends on Phase 4 completion.
6. **Subagent Story (Phase 6)**: Can execute after component implementation (Phase 5).
7. **Polish (Phase 7)**: Depends on Phase 5 and Phase 6 completion.

### Parallel Opportunities
- T001 and T002 in Setup can execute concurrently.
- T004 (test scaffold) can execute alongside T003.
- T005, T008, and T012 unit test writing can prepare test assertions before logic implementation.
- T017 and T018 can run in parallel during the polish phase.
