# Implementation Plan: Create Schedule Week Calendar Preview

**Branch**: `007-schedule-week-preview` | **Date**: 2026-10-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-schedule-week-preview/spec.md`.

## Summary

Add a week calendar preview to the create schedule form. The preview draws the draft course on a seven-column grid with an hourly time axis. Each block shows the course name only. The header shows weekday names only. A tap on empty grid space adds a one-hour class time and opens the form sheet with the tapped day and time prefilled. A tap on a block opens the form to edit that class time.

Reuse the existing draft model (`TimeBlockDraft`), the `Drawer` bottom sheet with its partial and full stages, the 24-color palette, `HOUR_HEIGHT`, `WEEKDAYS`, and `formatTime12h`. Do not reuse the schedule-x `WeekCalendar`. That component renders calendar dates, tasks, untimed items, and only four color themes. The preview needs names only, no dates, a full 24-color range, and tap coordinates.

## Technical Context

**Language/Version**: TypeScript 5.9+, Vue 3.5+ (Composition API with `<script setup>`)

**Primary Dependencies**: Existing `reka-ui` `Drawer` and `Popover`, Tailwind CSS 4, `lucide-vue-next`. No new dependency.

**Storage**: None for the preview. The preview derives from form state. The existing save path keeps `POST /api/courses` and `POST /api/schedules` through `useCatalog`.

**Testing**: Vitest (`jsdom`), `@vue/test-utils`, `vue-tsc`, oxlint

**Target Platform**: Mobile-first web application (baseline viewport 390px)

**Project Type**: Frontend view and component enhancement

**Performance Goals**: The preview repaints on each form change without visible lag. A tap opens the bottom sheet in under 150ms. The preview causes no layout shift.

**Constraints**: Minimum 44px touch targets. Day-level granularity only. No time-blocking, drag, or priority controls. No new npm dependency. Strict use of `DESIGN.md` tokens.

**Scale/Scope**: One new component (`WeekPreview.vue`), one new util (`weekPreview.ts`), edits to `CreateScheduleView.vue`, and unit tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evaluation |
|---|---|---|
| I. Virtual Study Plan and Tri-State Planning | PASS | The preview is a derived view. It stores no task or plan data. |
| II. Course Anchor and Single Parentage | PASS | The save flow keeps one course parent. Each class time keeps its course link. |
| III. Grounded Uncertainty Preservation | PASS | The preview shows only entered values. It invents no time or deadline. |
| IV. Non-Destructive Additive Planning | PASS | The feature adds no AI writes. It changes no task title. |
| V. Strict Architectural Layer Isolation | PASS | The feature uses only the frontend form and the existing API boundary. |
| VI. Canonical Error Strategy | PASS | The feature reuses the existing form error and retry flow. It adds no exception class. |
| VII. Ponytail Minimalism and Native Features | PASS | The feature reuses existing components, constants, and palette. It adds no dependency. |
| VIII. Evidence-First Verification and Surgical Edits | PASS | Unit tests cover the pure helpers. `vue-tsc` and oxlint verify the edits. |
| IX. Frontend-Backend Domain Rule Alignment | PASS | The preview shows exclusive day-level blocks. It adds no hourly planner control. |
| X. Separation of Development Environment Rules from Presentation Components | PASS | The new component holds no dev flag and no mock branch. |

No violations. The Complexity Tracking table stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/007-schedule-week-preview/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── week-preview.contract.md
├── checklists/
│   └── requirements.md  # Requirements quality checklist
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   ├── WeekPreview.vue                   # New: 7-column week grid with tap targets
│   ├── day-view/
│   │   ├── WeekPill.vue                  # Reuse: block visual reference (name only)
│   │   └── WeekCalendar.vue              # Read only: not reused (see research.md)
│   └── TimeBlockCard.vue                 # Reuse: TimeBlockDraft, WEEKDAYS, helpers
├── utils/
│   ├── weekPreview.ts                    # New: derivePreviewBlocks, slotFromOffset
│   └── scheduleExpander.ts              # Reuse: formatTime12h
├── constants/
│   ├── calendar.ts                       # Reuse: HOUR_HEIGHT
│   └── palette.ts                        # Reuse: COURSE_PALETTE_24
├── views/
│   └── CreateScheduleView.vue            # Edit: mount preview, handle taps
└── components/__tests__/
    └── week-preview.spec.ts              # New: util unit tests
```

**Structure Decision**: Keep one frontend project. Add the preview as a sibling of `TimeBlockCard.vue`. Keep the pure helpers in `src/utils/weekPreview.ts` for direct unit tests.

## Implementation Phases

### Phase 0: Research & Foundation
- [ ] Confirm the existing `CreateScheduleView` draft model and partial/full sheet stages.
- [ ] Confirm the reusable tokens: `HOUR_HEIGHT`, `WEEKDAYS`, `COURSE_PALETTE_24`, `formatTime12h`.
- [ ] Decide the preview component boundary and the tap math.
- [ ] Record the decisions in `research.md`.

### Phase 1: Design & Contracts
- [ ] Define `PreviewBlock` and `PendingSlot` in `data-model.md`.
- [ ] Define the `WeekPreview` props and emits in `contracts/week-preview.contract.md`.
- [ ] Write `quickstart.md` with the run and test steps.

### Phase 2: Implementation (Scheduled for `/speckit-tasks` and execute)
1. Add `derivePreviewBlocks` and `slotFromOffset` in `src/utils/weekPreview.ts`.
2. Add unit tests for both helpers in `src/components/__tests__/week-preview.spec.ts`.
3. Build `WeekPreview.vue` from `PreviewBlock[]` with a weekday header and an hourly grid.
4. Replace the blank background in `CreateScheduleView.vue` with `WeekPreview`.
5. Handle `selectSlot` and `selectBlock`. Reuse the existing save flow.
