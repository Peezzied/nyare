# Tasks: Note Editor View

**Branch**: `002-note-editor-view` | **Feature**: Note Editor View

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type definitions, utility preparation, and route registrations

- [x] T001 Update NoteRequest and NoteResponse interfaces in frontend/src/types/api.ts to include title and entryDate fields per backend DTO parity
- [x] T002 [P] Create 24-color course palette utility and deterministic index resolver (course.id % 24) in frontend/src/utils/courseColors.ts per DESIGN.md
- [x] T003 [P] Create unit test suite for courseColors utility verifying badge background, text, and border classes in frontend/src/utils/__tests__/courseColors.spec.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Markdown conversion, image DB validation helpers, and router registration required before view development

- [x] T004 Create minimal bidirectional Markdown-to-HTML and HTML-to-Markdown serialization utility supporting headings, bold, italic, underline/strikethrough, lists, blockquotes, horizontal rules, and image tags in frontend/src/utils/markdown.ts
- [x] T005 [P] Create unit test suite for markdown conversion utility verifying bidirectional serialization and image tag handling in frontend/src/utils/__tests__/markdown.spec.ts
- [x] T006 [P] Add route entries for `/notes/new` and `/notes/:id` with dynamic component imports in frontend/src/router/index.ts
- [x] T007 [P] Create Histoire preview story skeleton for NoteEditor in frontend/src/views/NoteEditor.story.vue

---

## Phase 3: User Story 1 - Create and Edit Course Journal Note (Priority: P1) 🎯 MVP

**Goal**: Deliver note creation and editing capabilities linked to a required course anchor and valid entry date with Markdown persistence via backend REST API.

**Independent Test**: Navigate to `/notes/new`, select a course from catalog, set entry date, write note title and body, and tap Save. Confirm `notesApi.create` is dispatched with Markdown content and redirect/feedback occurs.

### Tests for User Story 1

- [x] T008 [P] [US1] Create unit test suite verifying NoteEditor course gating (locked editor when unassigned), form state handling, API submission, and unsaved changes back-navigation warning in frontend/src/views/__tests__/NoteEditor.spec.ts

### Implementation for User Story 1

- [x] T009 [US1] Implement NoteEditor view component with course anchor gating, title input, course picker, date picker, and save action in frontend/src/views/NoteEditor.vue
- [x] T010 [US1] Wire TiptapEditor into NoteEditor with bidirectional Markdown sync (`markdown.ts`) and editable state binding in frontend/src/views/NoteEditor.vue
- [x] T011 [US1] Implement note loading by route id parameter (`/notes/:id`) via `notesApi.get()` and update flow via `notesApi.update()` in frontend/src/views/NoteEditor.vue
- [x] T012 [US1] Implement image database reference pre-save validation verifying embedded `/api/images/{uuid}` URLs match valid uploaded images before persistence in frontend/src/views/NoteEditor.vue

---

## Phase 4: User Story 2 - Integrated Single-Line Scrollable Rich Text Toolbar (Priority: P1)

**Goal**: Enhance the Tiptap toolbar into a single-line, horizontally scrollable bar at the bottom with standout Undo/Redo buttons and no wrapping.

**Independent Test**: Render editor on a 360px viewport; swipe horizontally to access all formatting tools; verify Undo/Redo stand out visually with cyan styling and larger touch area.

### Tests for User Story 2

- [x] T013 [P] [US2] Update unit test suite in frontend/src/components/editor/__tests__/TiptapToolbar.spec.ts to verify single-line horizontal scroll layout classes, standout Undo/Redo button classes, and disabled history states
- [x] T014 [US2] Update TiptapToolbar.vue to support bottom placement, one-liner horizontal scrolling (`flex-nowrap overflow-x-auto no-scrollbar`), and standout Undo/Redo styling in frontend/src/components/editor/TiptapToolbar.vue
- [x] T015 [US2] Update TiptapEditor.vue to anchor TiptapToolbar at the bottom of the editor container with a crisp teal divider in frontend/src/components/editor/TiptapEditor.vue

---

## Phase 5: User Story 3 - Visual Styling and Course Anchor Fidelity (Priority: P2)

**Goal**: Align NoteEditor's visual presentation with the reference UI prototype and Google Stitch design draft (`#F6F7EE` parchment, 3D tactile buttons, course badge colors).

**Independent Test**: Verify NoteEditor matches prototype visually: Back text action, Quicksand title, course pill badge with course color, date pill, teal horizontal divider rules, and Duolingo-style 3D Save button.

### Implementation for User Story 3

- [x] T016 [US3] Style NoteEditor header with Back link, borderless title input, course pill, date pill, and Duolingo-style 3D Save button in frontend/src/views/NoteEditor.vue
- [x] T017 [US3] Add teal divider lines (`#00A4C8`) below header metadata and above bottom toolbar per reference prototype in frontend/src/views/NoteEditor.vue
- [x] T018 [US3] Apply course palette styling to course selector pill using `courseColors.ts` in frontend/src/views/NoteEditor.vue
- [x] T019 [US3] Update Histoire story in frontend/src/views/NoteEditor.story.vue demonstrating new note, course-selected note, and mobile viewport variations

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality verification, type safety, linting, and manual validation

- [x] T020 Run oxlint linter on frontend source via `npx oxlint src/` in frontend/
- [x] T021 Run TypeScript compiler verification via `npm run type-check` in frontend/
- [x] T022 [P] Run Vitest unit tests via `npm run test:unit` in frontend/
- [x] T023 Validate quickstart scenarios against Histoire story via `npm run story` in frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — executes first.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — blocks User Story implementation.
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — delivers MVP note editing and persistence.
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) — enhances toolbar layout and mobile scrolling.
- **User Story 3 (Phase 5)**: Depends on User Story 1 & 2 — completes visual styling fidelity.
- **Polish (Phase 6)**: Runs after all implementation phases complete.

### Parallel Opportunities

- **T002 & T003**: Course colors utility and tests can run in parallel.
- **T004, T005, T006, T007**: Markdown utility, route registration, and story skeleton can run in parallel.
- **T008 & T013**: Test suites for NoteEditor and TiptapToolbar can be developed in parallel.
- **T021 & T022**: Vitest unit tests and TypeScript compiler checks can execute concurrently.

---

## Implementation Strategy

1. **MVP First (Phases 1-3)**: Deliver working course-gated note creation and editing with Markdown persistence (`POST`/`PUT /api/notes`).
2. **Ergonomics & Layout (Phase 4)**: Transform bottom toolbar into a single-line horizontal scroller with prominent Undo/Redo buttons.
3. **Design Polish (Phase 5)**: Ensure exact visual parity with prototype and Stitch design (parchment background, 3D buttons, teal rules).
4. **Verification Gate (Phase 6)**: Run oxlint, vue-tsc, and vitest to guarantee zero regressions.
