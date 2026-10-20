# Implementation Plan: Reusable Delete Schedule Confirmation Popup

**Branch**: `003-delete-schedule-confirmation-popup` | **Date**: 2026-10-14 | **Spec**: `specs/003-delete-schedule-confirmation-popup/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Implement one reusable Vue 3 confirmation dialog for schedule deletion. The component receives an open flag and a minimal selected schedule target, renders the required Nyare visual hierarchy over a dimmed overlay, calls `schedulesApi.delete` on CONFIRM with repeated-submission protection, reports existing errors, and notifies the parent through `deleted(id)` for `useCatalog().applyScheduleDeleted`. No parent UI, backend, API, or catalog implementation is changed.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript + Vue 3.5 (Vue SFC `<script setup lang="ts">`) under Vite

**Primary Dependencies**: Existing Nyare frontend stack only (Vue 3, Vite, Tailwind 4, Lucide/Phosphor conventions, existing API client); no new dependencies

**Storage**: N/A (uses existing schedule persistence through `schedulesApi.delete`)

**Testing**: Vitest (jsdom), Oxlint, vue-tsc

**Target Platform**: Mobile web, baseline 390px width

**Project Type**: Frontend feature within existing web application

**Performance Goals**: Dialog open/delete interactions should feel immediate with no repeated submission

**Constraints**: No new UI library, no Pinia/Axios, no parent UI ownership, no backend changes

**Scale/Scope**: One reusable component, one exported target type, colocated tests, and integration documentation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- I. Virtual Study Plan: The popup only derives the course-color indicator; it does not persist or alter planning state.
- II. Course Anchor: The target requires `courseId`; no schedule is represented without its parent course.
- III. Grounded Uncertainty: The displayed name and course color come from parent-supplied data or `getCourseColor`; no identity is invented.
- IV. Non-Destructive Additive Planning: Deletion is the only mutation and happens only after explicit CONFIRM through an existing endpoint.
- V. Strict Architectural Layer Isolation: Frontend-only boundary; schedules are accessed through `schedulesApi`, not backend internals.
- VI. Canonical Error Strategy: Failures use the existing `ApiError`/ProblemDetail representation.
- VII. Ponytail Minimalism and Native Features: No new dependencies, Pinia, or Axios; native fetch/Vue patterns only.
- VIII. Evidence-First Verification: Implementation must pass Oxlint, type-check, and targeted Vitest tests.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/src/components/DeleteScheduleConfirmDialog.vue
frontend/src/components/__tests__/DeleteScheduleConfirmDialog.spec.ts
frontend/src/api/schedules.ts
frontend/src/composables/useCatalog.ts
frontend/src/constants/palette.ts
frontend/src/assets/mascot/duckota_feedback.png
```

**Structure Decision**: Frontend-only feature. Add the reusable component and its colocated Vitest test only; reuse existing API, catalog, palette, and asset modules without changing them. No backend files are modified.

## Constitution Check (Post-Design)

Re-evaluated after research and data model. No new violations: the component still calls existing APIs, emits parent notifications instead of mutating shared state, uses only existing assets, and remains frontend-scoped.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
