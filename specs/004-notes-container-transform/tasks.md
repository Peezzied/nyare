# Tasks: Notes View Container Transform Animation

**Branch**: `004-notes-container-transform`  
**Input**: Feature specification from `specs/004-notes-container-transform/spec.md` and design artifacts from `specs/004-notes-container-transform/`  
**Target View**: `/notes` (Notes View and Note Editor)  

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish base type definitions and test infrastructure for container transform motion.

- [X] T001 [P] Verify development setup and Vitest test runner with `npm run test:unit` in `frontend/`
- [X] T002 [P] Define `TapOriginRect` (`top`, `left`, `width`, `height`, `borderRadius`), `AnimationPhase` (`'idle' | 'expanding' | 'settled' | 'collapsing'`), `NoteModalTriggerKind` (`'card' | 'fab'`), and `ActiveNoteModalState` in `frontend/src/types/notesTransition.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core motion calculations and geometry transformation helpers required by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this foundational phase is complete.

- [X] T003 Refactor container transform geometry and reduced motion helpers (`calculateTargetStyle`, `getOriginStyle`, `isReducedMotion`) in `frontend/src/composables/useNoteTransition.ts`
- [X] T004 [P] Create unit test suite for container transform math and transition state helpers in `frontend/src/composables/__tests__/useNoteTransition.spec.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Expand Existing Note Card on Tap (Priority: P1) 🎯 MVP

**Goal**: Tapping any existing note card (`NoteCard` or `PictureNoteCard`) smoothly expands the container outward from the card's exact bounding rectangle into the full note editor within 320ms.

**Independent Test**: Tap any note card in `NotesView`; verify container expands from card coordinates with `cubic-bezier(0.05, 0.7, 0.1, 1.0)` over 320ms and scrim fades in behind it.

### Tests for User Story 1

- [X] T005 [P] [US1] Unit test for note card click origin rectangle emission in `frontend/src/components/__tests__/NoteCard.spec.ts`

### Implementation for User Story 1

- [X] T006 [P] [US1] Update `NoteCard` and `PictureNoteCard` to emit click event with target element coordinates in `frontend/src/components/NoteCard.vue` and `frontend/src/components/PictureNoteCard.vue`
- [X] T007 [US1] Build `NoteEditorModal` container with Material 3 decelerate expansion (`320ms cubic-bezier(0.05, 0.7, 0.1, 1.0)`) and scrim backdrop (`bg-black/20`) in `frontend/src/components/notes/NoteEditorModal.vue`
- [X] T008 [US1] Integrate note card tap origin capture and modal expansion overlay in `frontend/src/views/NotesView.vue`

**Checkpoint**: User Story 1 is functional and testable as the standalone MVP.

---

## Phase 4: User Story 2 - Expand New Note Action on Tap (Priority: P1)

**Goal**: Tapping the floating action button (`notes-fab`) smoothly expands the container outward from the circular/rounded FAB boundary into an empty note editor within 320ms.

**Independent Test**: Tap `notes-fab` in `NotesView`; verify container expands outward from the FAB position and radius into an empty note editor ready for text input.

### Tests for User Story 2

- [X] T009 [P] [US2] Unit test for FAB expansion trigger in `frontend/src/views/__tests__/NotesView.spec.ts`

### Implementation for User Story 2

- [X] T010 [US2] Add FAB bounding rectangle capture (`notes-fab`) and blank note modal trigger in `frontend/src/views/NotesView.vue`
- [X] T011 [US2] Support blank note initialization and FAB origin geometry in `frontend/src/components/notes/NoteEditorModal.vue`

**Checkpoint**: User Stories 1 and 2 both expand smoothly from their respective origin elements.

---

## Phase 5: User Story 3 - Dismiss Note Editor Back to Origin (Priority: P1)

**Goal**: Dismissing the note editor via the back button, close button, Escape key, or browser/device back gesture contracts the container back into the origin card or FAB boundary within 240ms, while preserving 100% of the notes list scroll offset.

**Independent Test**: Open note editor, scroll notes list beforehand, tap back or trigger `popstate`; verify container contracts back to origin in 240ms with `cubic-bezier(0.3, 0.0, 0.8, 0.15)` and list scroll offset is preserved.

### Tests for User Story 3

- [X] T012 [P] [US3] Unit test for modal dismissal, popstate interception, and scroll position retention in `frontend/src/views/__tests__/NotesView.spec.ts`

### Implementation for User Story 3

- [X] T013 [US3] Implement 240ms accelerate contraction animation (`cubic-bezier(0.3, 0.0, 0.8, 0.15)`) and body scroll release in `frontend/src/components/notes/NoteEditorModal.vue`
- [X] T014 [US3] Implement ephemeral `history.pushState` (`{ nyareNoteModal: true }`) and `popstate` event listener for mobile back gesture dismissal in `frontend/src/components/notes/NoteEditorModal.vue`
- [X] T015 [US3] Wire modal close and save event handlers to refresh notes list and maintain scroll offset in `frontend/src/views/NotesView.vue`

**Checkpoint**: Note editor opens and collapses back into card or FAB with full history and scroll preservation.

---

## Phase 6: User Story 4 - Staggered Content Appearance (Priority: P2)

**Goal**: Title, date, and body text fade and slide up at 100ms offset, toolbar/action controls appear at 180ms offset during expansion; fast 80ms content exit on dismissal.

**Independent Test**: Inspect expansion and collapse timings; verify content enters staggered at 100ms/180ms and exits before contraction begins.

### Tests for User Story 4

- [X] T016 [P] [US4] Unit test verifying phase progression (`expanding` -> `settled` -> `collapsing` -> `idle`) in `frontend/src/components/notes/__tests__/NoteEditorModal.spec.ts`

### Implementation for User Story 4

- [X] T017 [US4] Implement staggered `showContent` (100ms) and `showControls` (180ms) timer choreography in `frontend/src/components/notes/NoteEditorModal.vue`
- [X] T018 [US4] Apply staggered CSS entrance transitions (`opacity-0 translate-y-2` to `opacity-100 translate-y-0`) and fast 80ms exit classes in `frontend/src/views/NoteEditor.vue`

**Checkpoint**: Content reveals gracefully without text distortion or font stretching during rapid bounds scaling.

---

## Phase 7: User Story 5 - Accessible Motion for Reduced Motion Preferences (Priority: P2)

**Goal**: Users with `prefers-reduced-motion` enabled receive an instantaneous layout with a gentle 150ms opacity crossfade, bypassing spatial scaling.

**Independent Test**: Emulate `prefers-reduced-motion: reduce`; verify container does not scale spatially and instead crossfades smoothly.

### Tests for User Story 5

- [X] T019 [P] [US5] Unit test for reduced motion crossfade behavior in `frontend/src/components/notes/__tests__/NoteEditorModal.spec.ts`

### Implementation for User Story 5

- [X] T020 [US5] Implement reduced motion bypass in container transform style calculation in `frontend/src/components/notes/NoteEditorModal.vue`

**Checkpoint**: Reduced motion preferences are fully respected with accessible non-spatial crossfade transitions.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end verification, linting, formatting, and quickstart validation.

- [X] T021 [P] Run type-check and linter checks with `npm run type-check` and `npm run lint` in `frontend/`
- [X] T022 [P] Run all frontend unit tests with `npm run test:unit` in `frontend/`
- [ ] T023 Validate end-to-end quickstart scenarios per `specs/004-notes-container-transform/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - starts immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Phase 2 completion.
  - User Story 1 (P1): Expand Existing Note Card (MVP).
  - User Story 2 (P1): Expand New Note Action on Tap (depends on US1 modal foundation).
  - User Story 3 (P1): Dismiss Note Editor Back to Origin (depends on US1/US2).
  - User Story 4 (P2): Staggered Content Appearance (enhances US1/US2/US3).
  - User Story 5 (P2): Accessible Motion (enhances US1/US2/US3).
- **Polish (Phase 8)**: Depends on all user stories being complete.

---

## Parallel Opportunities

- **Phase 1**: `T001` and `T002` can execute in parallel.
- **Phase 2**: `T004` (unit test suite) can run in parallel with foundational type setup.
- **User Story 1**: `T005` (spec test) and `T006` (`NoteCard` / `PictureNoteCard` updates) can run in parallel.
- **User Story 2**: `T009` (test) and `T010` (FAB trigger) can run in parallel.
- **User Story 3**: `T012` (test) can run in parallel with modal close logic.
- **User Story 4 & 5**: `T016` and `T019` test suites can run in parallel.
- **Polish Phase**: `T021` and `T022` can execute in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch NoteCard coordinate updates and test in parallel:
Task: "Unit test for note card click origin rectangle emission in frontend/src/components/__tests__/NoteCard.spec.ts"
Task: "Update NoteCard and PictureNoteCard to emit click event with target element coordinates in frontend/src/components/NoteCard.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`T001`, `T002`).
2. Complete Phase 2: Foundational (`T003`, `T004`).
3. Complete Phase 3: User Story 1 (`T005`-`T008`).
4. **STOP and VALIDATE**: Verify note card container transform expansion works independently on `/notes`.

### Incremental Delivery

1. Phase 1 + 2 → Foundational motion helpers ready.
2. Phase 3 (US1) → Note card expansion working (MVP).
3. Phase 4 (US2) → Floating action button expansion working.
4. Phase 5 (US3) → Contraction to origin, scroll preservation, and device back gesture working.
5. Phase 6 (US4) → Staggered typography and controls reveal added.
6. Phase 7 (US5) → Reduced motion accessibility supported.
7. Phase 8 → Full lint, type-check, and Vitest suite passing.
