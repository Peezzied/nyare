# Implementation Plan: Schedule Creation Validation

**Branch**: `006-schedule-validation` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-schedule-validation/spec.md`.

## Summary

Add validation to the create schedule form. The form blocks a duplicate course name. The form blocks a class time that overlaps a known class on the same weekday. The form marks unavailable weekdays inside each block. The form disables the add-another-time action when every weekday clashes at the block time. A close with unsaved work shows a keep-editing or discard dialog.

All checks run in the client. The backend keeps only its existing start-before-end rule (FR-019).

The feature reads one known-course set: the stored catalog plus the courses encoded in the current session. It adds a small session store, `useCourseDrafts`, as the encoded set. The save action stages a course into that store. The existing `coursesApi.create` and `schedulesApi.create` calls move behind the store boundary so a later bulk-freeze action can flush them.

## Technical Context

**Language/Version**: TypeScript 5.9+, Vue 3.5+ (Composition API with `<script setup>`)

**Primary Dependencies**: Existing `reka-ui` `Drawer` and dialog primitives, Tailwind CSS 4, `lucide-vue-next`. No new dependency.

**Storage**: No new database entity. The encoded set lives in a session composable. The persisted catalog stays in `useCatalog`.

**Testing**: Vitest (`jsdom`), `@vue/test-utils`, `vue-tsc`, oxlint

**Target Platform**: Mobile-first web application (baseline viewport 390px)

**Project Type**: Frontend view, component, and composable enhancement

**Performance Goals**: Duplicate and overlap checks complete in the same frame as the input change. The checks compare an in-memory list. No network call is added.

**Constraints**: Minimum 44px touch targets. Day-level granularity only. No time-blocking and no priority values. No new npm dependency. Client-side enforcement only (FR-019). No backend edit in this feature.

**Scale/Scope**: One new util (`scheduleValidation.ts`), one new composable (`useCourseDrafts.ts`), one new dialog component, edits to `TimeBlockCard.vue` and `CreateScheduleView.vue`, and unit tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evaluation |
|---|---|---|
| I. Virtual Study Plan and Tri-State Planning | PASS | The feature changes only schedules. It derives no study plan and stores no task data. |
| II. Course Anchor and Single Parentage | PASS | Every encoded course and class time keeps one course parent. The feature creates no orphan record. |
| III. Grounded Uncertainty Preservation | PASS | The feature compares entered values only. It invents no time and no deadline. |
| IV. Non-Destructive Additive Planning | PASS | The feature adds no AI write. It changes no task title. |
| V. Strict Architectural Layer Isolation | PASS | The feature touches the frontend only. It adds no controller, service, or repository. |
| VI. Canonical Error Strategy | PASS | The feature shows client messages. It adds no exception class and no backend error path. |
| VII. Ponytail Minimalism and Native Features | PASS | The feature adds pure helpers and reuses the existing confirm-dialog pattern. It adds no dependency. |
| VIII. Evidence-First Verification and Surgical Edits | PASS | Unit tests cover the pure helpers. `vue-tsc` and oxlint verify the edits. |
| IX. Frontend-Backend Domain Rule Alignment | PASS | The feature keeps day-level granularity. It adds no hourly planner control and no priority score. |
| X. Separation of Development Environment Rules from Presentation Components | PASS | The new components hold no dev flag and no mock branch. |

No violations. The Complexity Tracking table stays empty.

## Cross-Feature Dependency

The spec states that Save stages a course and a separate bulk-freeze action persists it. No bulk-freeze action exists in the frontend today. This plan introduces `useCourseDrafts` as the staging seam. The create view writes to the seam instead of calling `coursesApi.create` directly.

- **Blocking risk**: until the bulk-freeze feature lands, a staged course is not stored on the backend.
- **Mitigation**: keep the existing API calls as the store's flush method. The store exposes `stageCourse` and `flush`. The create view calls `stageCourse`. The freeze feature calls `flush`.

## Project Structure

### Documentation (this feature)

```text
specs/006-schedule-validation/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── schedule-validation.contract.md
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/src/
├── utils/
│   ├── scheduleValidation.ts            # New: normalizeTime, rangesOverlap, findClash, findDuplicateName, unavailableDaysFor
│   └── __tests__/
│       └── scheduleValidation.spec.ts   # New: pure helper unit tests
├── composables/
│   ├── useCourseDrafts.ts               # New: session encoded-course set (stageCourse, stageSchedule, flush)
│   └── useCatalog.ts                    # Reuse: stored courses and schedules
├── components/
│   ├── DiscardDraftConfirmDialog.vue    # New: keep editing / discard dialog
│   ├── DeleteScheduleConfirmDialog.vue  # Reuse: dialog pattern reference (overlay, Escape, focus)
│   ├── TimeBlockCard.vue                # Edit: add unavailableDays prop; disable those weekday items
│   └── __tests__/
│       ├── DiscardDraftConfirmDialog.spec.ts  # New: dialog action tests
│       └── TimeBlockCard.spec.ts        # Extend: unavailable-day disable tests
└── views/
    ├── CreateScheduleView.vue           # Edit: known set, validation, close guard, staging
    └── __tests__/
        └── CreateScheduleView.spec.ts   # Extend: validation and close-guard tests
```

**Structure Decision**: Keep one frontend project. Keep the pure compare helpers in `src/utils/scheduleValidation.ts` for direct unit tests. Keep the encoded set in a dedicated composable so the read (validation) and the write (freeze) share one source.

## Implementation Phases

### Phase 0: Research & Foundation
- [ ] Confirm the current save path in `CreateScheduleView.vue` and the `useCatalog` cache shape.
- [ ] Decide the known-course set source and the staging seam.
- [ ] Decide time normalization and the overlap predicate.
- [ ] Decide the weekday-availability derivation and the add-another-time rule.
- [ ] Decide the close-confirmation trigger set and the dialog reuse.
- [ ] Record the decisions in `research.md`.

### Phase 1: Design & Contracts
- [ ] Define `KnownCourse`, `KnownSchedule`, `ScheduleCandidate`, and the encoded draft types in `data-model.md`.
- [ ] Define the `scheduleValidation.ts` API, the `TimeBlockCard` `unavailableDays` prop, and the dialog contract in `contracts/schedule-validation.contract.md`.
- [ ] Write `quickstart.md` with the run and test steps.

### Phase 2: Implementation (Scheduled for `/speckit-tasks` and execute)
1. Add the pure helpers in `src/utils/scheduleValidation.ts`.
2. Add unit tests for every helper.
3. Add the `useCourseDrafts` composable with `stageCourse`, `stageSchedule`, and `flush`.
4. Add the `unavailableDays` prop to `TimeBlockCard.vue` and disable those weekday items.
5. Add `DiscardDraftConfirmDialog.vue` from the `DeleteScheduleConfirmDialog.vue` pattern.
6. Wire the known set, the clash and duplicate checks, and the close guard into `CreateScheduleView.vue`.
7. Stage a save into `useCourseDrafts` instead of calling the API directly.
