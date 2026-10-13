# Tasks: Rich Text Toolbar and Editor

**Branch**: `001-tiptap-toolbar` | **Feature**: Rich Text Toolbar and Editor

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency installation and component directory initialization

- [x] T001 Install @tiptap/extension-image dependency in frontend/package.json
- [x] T002 [P] Create editor component directory structure in frontend/src/components/editor/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and API contract readiness required before component development

- [x] T003 Define toolbar action interfaces and button configuration in frontend/src/components/editor/types.ts
- [x] T004 [P] Verify image upload API integration contracts in frontend/src/api/images.ts

---

## Phase 3: User Story 1 - Core Text Formatting and Edit History (Priority: P1) 🎯 MVP

**Goal**: Deliver accessible text formatting (bold, italic, strike, code, headings, lists, quotes, dividers) and undo/redo history controls.

**Independent Test**: Mount `TiptapEditor`, apply inline and block formatting styles, trigger undo to revert edits, trigger redo to reapply, and verify disabled states when history stacks are empty.

### Tests for User Story 1

- [x] T005 [P] [US1] Create unit test suite verifying formatting button dispatches, active state highlights, and undo/redo disabled states in frontend/src/components/editor/__tests__/TiptapToolbar.spec.ts

### Implementation for User Story 1

- [x] T006 [US1] Implement TiptapToolbar component with undo/redo history and basic formatting controls using Button primitives in frontend/src/components/editor/TiptapToolbar.vue
- [x] T007 [P] [US1] Implement TiptapEditor wrapper integrating StarterKit, toolbar header, and ProseMirror content area in frontend/src/components/editor/TiptapEditor.vue
- [x] T008 [US1] Create Histoire preview story demonstrating text formatting and undo/redo functionality in frontend/src/components/editor/TiptapEditor.story.vue

---

## Phase 4: User Story 2 - Image Upload and Embedded Visuals (Priority: P1)

**Goal**: Enable students to upload image files from device storage and embed them inline at the active cursor position.

**Independent Test**: Click image button in toolbar, select an image file, verify `imagesApi.upload` is called with file payload, and verify an image node with URL source renders inside the editor.

### Tests for User Story 2

- [x] T009 [P] [US2] Add unit test cases for image button click, file input trigger, upload handler execution, and error event emission in frontend/src/components/editor/__tests__/TiptapToolbar.spec.ts

### Implementation for User Story 2

- [x] T010 [US2] Implement file input element, image picker trigger, upload handling, and node insertion in frontend/src/components/editor/TiptapToolbar.vue
- [x] T011 [US2] Register and configure Image extension with schema attributes in frontend/src/components/editor/TiptapEditor.vue
- [x] T012 [US2] Update Histoire story with image attachment demonstration in frontend/src/components/editor/TiptapEditor.story.vue

---

## Phase 5: User Story 3 - Mobile-Responsive Toolbar Usability (Priority: P2)

**Goal**: Ensure toolbar controls wrap gracefully on mobile viewports (down to 360px) and maintain accessible touch targets (>= 32x32px).

**Independent Test**: Render editor in a 360px viewport and verify all controls wrap cleanly without horizontal viewport clipping or overflow.

### Tests for User Story 3

- [x] T013 [P] [US3] Add unit tests for toolbar flex-wrap layout classes and button touch target sizing attributes in frontend/src/components/editor/__tests__/TiptapToolbar.spec.ts

### Implementation for User Story 3

- [x] T014 [US3] Apply responsive flex-wrap styling, icon-sm sizing, and touch target constraints in frontend/src/components/editor/TiptapToolbar.vue

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Quality verification, type safety, linting, and manual validation

- [x] T015 Run oxlint linter on frontend source via npm run lint:oxlint in frontend/
- [x] T016 Run TypeScript compiler verification via npm run type-check in frontend/
- [x] T017 [P] Run Vitest unit tests via npm run test:unit in frontend/
- [x] T018 Validate quickstart scenarios against Histoire story via npm run story in frontend/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — executes first.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) — blocks all user story phases.
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) — delivers MVP.
- **User Story 2 (Phase 4)**: Depends on User Story 1 (Phase 3) toolbar foundation.
- **User Story 3 (Phase 5)**: Depends on User Story 1 and 2 component implementations.
- **Polish (Phase 6)**: Runs after all implementation phases complete.

### Parallel Opportunities

- `T002` (directory creation) runs in parallel with `T001` (dependency install).
- `T004` (API contract check) runs in parallel with `T003` (types definition).
- `T005` (US1 unit tests) and `T007` (TiptapEditor wrapper) can develop in parallel with `T006` (TiptapToolbar).
- `T009` (US2 unit tests) runs in parallel with `T010` (upload handler).
- `T013` (US3 tests) runs in parallel with `T014` (responsive layout refinement).
- `T017` (unit test run) runs in parallel with `T016` (type-check).

---

## Parallel Example: User Story 1

```bash
# Launch test and wrapper development concurrently:
Task: T005 [P] [US1] Create unit test suite in frontend/src/components/editor/__tests__/TiptapToolbar.spec.ts
Task: T007 [P] [US1] Implement TiptapEditor wrapper in frontend/src/components/editor/TiptapEditor.vue
```

---

## Implementation Strategy

### MVP Scope (User Story 1)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (User Story 1: Text Formatting + Undo/Redo).
3. Validate User Story 1 independently in Histoire.

### Incremental Delivery
1. Foundation & US1: Usable rich text editor with history controls (MVP).
2. US2 increment: Adds diagram and photo upload capability.
3. US3 increment: Guarantees mobile ergonomics and touch accessibility.
4. Polish: Static analysis, type validation, and full automated test execution.
