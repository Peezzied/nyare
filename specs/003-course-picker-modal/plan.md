# Implementation Plan: Course Picker Modal in Note Editor

**Branch**: `003-course-picker-modal` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-course-picker-modal/spec.md` with shadcn dialog components and DESIGN.md styling.

## Summary

Deliver a dedicated course selection modal dialog (`CoursePickerDialog.vue`) using shadcn-vue `Dialog` primitives and tailored to Nyare's coastal academic design system (`DESIGN.md`). Replace the native `<select>` dropdown in `NoteEditor.vue` with a tactile trigger pill that opens the modal. Each course item displays a 24-palette color dot, the course title, and aggregated schedule days (e.g. `Mo, We, Th`). Strictly enforce that both Course and Entry Date must be selected before enabling the Save action in NoteEditor.

## Technical Context

**Language/Version**: TypeScript 5.9+, Vue 3.5+ (Composition API with `<script setup>`)

**Primary Dependencies**: `reka-ui` (v2.11), shadcn-vue `dialog` components, `@lucide/vue`, Tailwind CSS v4, Vue Router 4

**Storage**: REST API `/api/courses` & `/api/schedules` (cached via `useCatalog`)

**Testing**: Vitest (`jsdom`), `@vue/test-utils`, vue-tsc, oxlint

**Target Platform**: Mobile-first web application (baseline viewport 390px, responsive to tablet/desktop)

**Project Type**: Web application UI component and view enhancement

**Performance Goals**: Dialog open/close animations in < 150ms; instant course selection feedback; zero layout shift

**Constraints**: Mobile touch target height >= 48px; no extra npm dependencies (Ponytail minimalism); ASD-STE100 terminology; strict adherence to `DESIGN.md` (rounded-2xl card container, parchment background, cyan accents)

**Scale/Scope**: 1 new modal component (`CoursePickerDialog.vue`), schedule formatting helper, `NoteEditor.vue` integration, unit tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evaluation |
|---|---|---|
| I. Virtual Study Plan and Tri-State Planning | PASS | UI selection dialog only; does not alter virtual study plan derivation logic. |
| II. Course Anchor and Single Parentage | PASS | Enforces explicit course selection; notes cannot be saved without an anchor course. |
| III. Grounded Uncertainty Preservation | PASS | Uses genuine schedule days from catalog; displays "No set schedule" when unassigned. |
| IV. Non-Destructive Additive Planning | PASS | Preserves all user notes and catalog state without mutating existing titles or content. |
| V. Strict Architectural Layer Isolation | PASS | Uses existing `useCatalog()` cached DTOs; no direct database or foreign API coupling. |
| VI. Canonical Error Strategy | PASS | Gracefully handles empty course catalog state with clear user guidance. |
| VII. Ponytail Minimalism and Native Features | PASS | Uses standard shadcn/reka-ui dialog already installed in project; no Pinia or heavy dependencies. |
| VIII. Evidence-First Verification and Surgical Edits | PASS | Unit tested with Vitest, type-checked with vue-tsc, linted with oxlint. |

## Project Structure

### Documentation (this feature)

```text
specs/003-course-picker-modal/
├── plan.md              # Implementation plan (/speckit-plan output)
├── research.md          # Phase 0 architecture research and decisions
├── data-model.md        # Phase 1 data entities and validation flows
├── quickstart.md        # Phase 1 validation guide
├── contracts/           # Phase 1 component contracts
│   └── course-picker-dialog.contract.md
└── checklists/
    └── requirements.md  # Requirements quality checklist
```

### Source Code Organization

```text
frontend/src/
├── components/
│   ├── editor/
│   │   ├── CoursePickerDialog.vue       # New course picker modal component
│   │   └── __tests__/
│   │       └── CoursePickerDialog.spec.ts
│   └── ui/
│       └── dialog/                       # Installed shadcn dialog primitives
├── utils/
│   ├── scheduleFormat.ts                # Schedule day aggregation helper ("Mo, We, Th")
│   └── __tests__/
│       └── scheduleFormat.spec.ts
└── views/
    ├── NoteEditor.vue                   # Integrate modal trigger & course/date required validation
    └── __tests__/
        └── NoteEditor.spec.ts           # Update tests for modal trigger & save gating
```

## Implementation Phases

### Phase 0: Research & Component Foundation
- [x] Investigate shadcn-vue `Dialog` integration with existing Vue 3 and `reka-ui` setup.
- [x] Verify design tokens in `DESIGN.md` (colors `#F6F7EE`, `#00A4C8`, `#334155`, `#7B8B97`, radius `rounded-2xl`).
- [x] Formulate schedule day abbreviation aggregation strategy.
- [x] Document decisions in `specs/003-course-picker-modal/research.md`.

### Phase 1: Design & Contracts
- [x] Create `data-model.md` defining course option presentation shape and state transitions.
- [x] Create `contracts/course-picker-dialog.contract.md` defining props, emits, slots, and WAI-ARIA compliance.
- [x] Create `quickstart.md` defining verification commands and test criteria.

### Phase 2: Implementation (Scheduled for `/speckit-tasks` & execute)
1. Implement `formatCourseSchedule` in `src/utils/scheduleFormat.ts` with unit tests.
2. Build `CoursePickerDialog.vue` using shadcn `Dialog` primitives, matching reference prototype.
3. Wire `CoursePickerDialog` into `NoteEditor.vue` replacing `<select>`.
4. Update `isSaveDisabled` logic to enforce `selectedCourseId` AND `entryDate` required.
5. Add comprehensive unit tests in Vitest and verify with oxlint and vue-tsc.
