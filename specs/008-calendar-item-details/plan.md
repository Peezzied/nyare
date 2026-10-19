# Implementation Plan: Calendar Item Details and Week-View Category Markers

**Branch**: `008-calendar-item-details` | **Date**: 2026-10-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-calendar-item-details/spec.md`

## Summary

Add a category marker to every week-view item so a class, an academic event, and an academic task are told apart at a glance. Fill the calendar item detailed view with the fields the spec requires: a linked source note with navigation, a mark-complete control for tasks, the time window, and the duration for tasks. Replace the two separate detail content components (`CourseBlockDetail.vue`, `UntimedBlockDetail.vue`) with one shared `CalendarItemDetail.vue` driven by a single discriminated view model. Ship mock data that exercises every detail state, including the hide states from FR-018 through FR-020, and expose the states through Histoire stories and the offline mock adapter.

The detailed-view host (`EventDetailModal.vue`) and the calendar click wiring exist on `feat/calendar-improvements`. This feature treats that host as a prerequisite, then consolidates its two content components into the shared one.

## Technical Context

**Language/Version**: TypeScript 5.8+, Vue 3.5+ with `<script setup lang="ts">`

**Primary Dependencies**: Vue 3, Vite, Vue Router 4, Tailwind CSS 4, `@lucide/vue` (already installed), Histoire (already configured)

**Storage**: N/A. Presentation only. The mark-complete control writes through the existing `tasksApi.updateStatus`.

**Testing**: Vitest with `jsdom`. Unit tests in `src/**/__tests__/*.spec.ts`.

**Target Platform**: Mobile-first web application, baseline viewport 390px

**Project Type**: Single-page web application frontend

**Performance Goals**: The shared detail component renders within one frame after open. Mark-complete reflects the new state within 1 second. Nothing new blocks the existing 60 fps container transform.

**Constraints**: Zero new npm dependencies. Reuse `getCourseDotStyle`, `formatTimeRange`, `formatDuration`, and `getPlanCategory`. Do not refetch the full task list after mark-complete.

**Scale/Scope**: The day view and the week view. One shared detail content component, one shared marker, one view-model module, one mock fixture module, one Histoire story.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
| :--- | :--- | :--- |
| **I. Virtual Study Plan and Tri-State Planning** | PASS | The task category comes from `getPlanCategory`. No stored plan and no time-blocking are added. |
| **II. Course Anchor and Single Parentage** | PASS | Every detail item carries its course id. Marking a task complete changes only the task status. |
| **III. Grounded Uncertainty Preservation** | PASS | The shared component hides a missing duration and never invents a value. FR-019 and edge cases enforce this. |
| **IV. Non-Destructive Additive Planning** | PASS | Mark-complete changes only the task status. No title, deadline, or description changes. |
| **V. Strict Architectural Layer Isolation** | PASS | Frontend-only. No backend change. |
| **VI. Canonical Error Strategy** | PASS | A failed mark-complete shows the existing API error and keeps the prior state. |
| **VII. Ponytail Minimalism and Native Features** | PASS | Zero new dependencies. Two detail components collapse into one. Native Vue reactivity and existing helpers. |
| **VIII. Evidence-First Verification and Surgical Edits** | PASS | Backed by targeted Vitest runs and the quickstart guide. One shared component removes duplicate markup. |
| **IX. Frontend-Backend Domain Rule Alignment** | PASS | Mark-complete uses the existing status endpoint. The client updates local state from the saved DTO and does not refetch. Day-level granularity holds. |
| **X. Separation of Development Environment Rules** | PASS | Mock data and preview helpers stay in `src/api/mocks/`. Views and components stay pure. |

No violations. Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/008-calendar-item-details/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── calendar-item-detail.contract.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/day-view/
│   ├── CalendarItemDetail.vue        # NEW: one shared detail content for class, task, event
│   ├── CategoryMarker.vue            # NEW: one shared week-view marker (flag / check / none)
│   ├── CalendarItemDetail.story.vue  # NEW: Histoire story over all mock states
│   ├── EventDetailModal.vue          # MODIFY: host renders CalendarItemDetail (from feat/calendar-improvements)
│   ├── WeekPill.vue                  # MODIFY: class marker, open detail on tap
│   ├── WeekHeaderRow.vue             # MODIFY: task/event markers on untimed chips
│   ├── ScheduleCalendar.vue          # MODIFY: open detail from course cards and untimed pills
│   └── DayViewContainer.vue          # MODIFY: own modal state and the complete handler
├── types/
│   └── calendarItemDetail.ts         # NEW: shared discriminated view model
├── utils/
│   ├── calendarItemDetail.ts         # NEW: build the view model from calendar items
│   └── courseColors.ts               # REUSE getCourseDotStyle
└── api/mocks/
    ├── calendarItemDetailFixtures.ts # NEW: every detail and marker state
    └── fixtures.ts                   # REUSE and extend task/event fixtures with note ids
```

**Structure Decision**: The collapsed pair `CourseBlockDetail.vue` and `UntimedBlockDetail.vue` become one `CalendarItemDetail.vue` in `components/day-view/`. The view model and its builders live in `types/calendarItemDetail.ts` and `utils/calendarItemDetail.ts` so the day view, the week view, the modal, and the story share one mapping. Mock data lives in `api/mocks/` to keep views pure.

## Phase 0: Research

See [research.md](research.md). All technical unknowns are resolved.

## Phase 1: Design and Contracts

- Data model: [data-model.md](data-model.md)
- UI contract: [contracts/calendar-item-detail.contract.md](contracts/calendar-item-detail.contract.md)
- Validation guide: [quickstart.md](quickstart.md)

## Constitution Check (post-design)

Re-evaluated after Phase 1. No new violations. The shared component and the mock module stay inside the pure presentation and mock boundaries. Mark-complete keeps the single-status-write rule.

## Complexity Tracking

*No violations. The design complies with the Nyare Constitution and Ponytail Minimalism.*
