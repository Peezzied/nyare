# Implementation Plan: Swipeable Day Calendar with Untimed Top Section

**Branch**: `002-swipeable-day-calendar` | **Date**: 2026-10-14 | **Spec**: `specs/002-swipeable-day-calendar/spec.md`

**Input**: Feature specification from `specs/002-swipeable-day-calendar/spec.md`

## Summary

Extend the existing Schedule-X day calendar (`frontend/src/components/day-view/ScheduleCalendar.vue`, `DayViewContainer.vue`) with horizontal swipe day navigation and native Schedule-X full-day rendering for untimed items. Swipe changes `selectedDate` by ±1 day; the existing `calendarKey` rebuild path re-creates the Schedule-X instance natively. Timed class blocks map to `Temporal.ZonedDateTime` events (time grid); date-only tasks (`TaskResponse.scheduledDate`) and deadline-date events (`AcademicEventResponse.deadline`) map to `Temporal.PlainDate` start/end, which Schedule-X classifies as `_isSingleDayFullDay` and renders in its native `.sx__date-grid` all-day row above the time grid (customized via the `#dateGridEvent` slot, same pattern as the existing `#timeGridEvent` slot). Tri-state (`SCHEDULED`/`LATER`/`BACKLOG`) derives locally via `getPlanCategory()`. No new backend endpoint, no new npm package, no validation layer, no custom sibling strip component (YAGNI).

## Technical Context

**Language/Version**: TypeScript ~6.0, Vue 3.5, Vite 8

**Primary Dependencies** (all already installed — no new packages per YAGNI):
- `@schedule-x/vue` ^4.1.0 + `@schedule-x/calendar` ^4.9.1 (`ScheduleXCalendar`, `createCalendar`, `createViewDay`)
- `@schedule-x/theme-default` ^4.9.1 (calendar CSS; Nyare overrides via `:deep()` in `ScheduleCalendar.vue`)
- `temporal-polyfill` ^1.0.6 (`Temporal.PlainDate` for `selectedDate`, `Temporal.ZonedDateTime` for events)
- Tailwind CSS 4, native `fetch`, Vue Composition API `<script setup>`

**Storage**: N/A (frontend-only; data from existing `/api` list endpoints via proxy to :8080)

**Testing**: Vitest + jsdom + Vue Test Utils; `npm run type-check`, `npm run lint:oxlint`

**Target Platform**: Mobile-first 390px viewport, responsive desktop

**Project Type**: Frontend feature on existing Schedule-X day view

**Performance Goals**:
- Swipe-to-render completes in under 300ms (SC-001)
- Untimed strip ≤25% viewport height in default state (SC-004)
- Vertical scroll disambiguation ≥98% (SC-003)

**Constraints**:
- Schedule-X owns the time grid AND the all-day row: `createViewDay()` renders `.sx__date-grid` (aria-label 'Full day- and multiple day events') above the time grid; full-day status derives from `Temporal.PlainDate` start/end (`_isSingleDayFullDay`); custom rendering via `#dateGridEvent` slot. Do not build a custom grid or a custom sibling strip.
- Schedule-X cannot change `dayBoundaries` after creation → reuse existing `calendarKey` rebuild on `selectedDate`/boundary change
- Day-level granularity only; tasks/events carry dates, never invented times (Constitution I, III)
- 44px touch targets, 8px rhythm, 24-color palette (`courseId % 24`), DynaPuff/Quicksand/Inter
- No Pinia, no Axios; `useCatalog()` cache rules apply
- YAGNI: no `GET /api/day-view`, no `GET /api/schedule-x/validate`, no mapping/validation layer, no date-picker/event-modal/drag-plugin wiring, no gesture/animation library

**Scale/Scope**: One strip component + swipe handling in existing day-view components; part of Nyare academic planner

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Virtual Study Plan and Tri-State Planning** — Untimed strip shows date-matching tasks regardless of tri-state; `getPlanCategory()` in `src/utils/planCategory.ts` stays the single derivation point. No time-blocking added.
- [x] **II. Course Anchor and Single Parentage** — Every strip item renders from a DTO carrying `courseId`; color via `courseId % 24`. No orphans.
- [x] **III. Grounded Uncertainty Preservation** — Date-only items render as untimed; no invented times/durations/scores. `scheduledDate`/`deadline` shown as dates only.
- [x] **IV. Non-Destructive Additive Planning** — Read-only view; no title/description mutation.
- [x] **V. Strict Architectural Layer Isolation** — Frontend-only; existing list endpoints only; `ref`/`computed` state; no N+1 reads.
- [x] **VII. Ponytail Minimalism and Native Features (YAGNI)** — Reuse installed Schedule-X + native PointerEvents; zero new dependencies/endpoints. Out of scope explicitly excluded below.
- [x] **VIII. Evidence-First Verification and Surgical Edits** — Edits confined to `day-view/` components + narrow unit tests; `type-check` + `lint:oxlint` + targeted vitest before/after.

Post-design re-check: PASS — Phase 1 artifacts introduce no new endpoints, packages, or stores.

## Project Structure

### Documentation (this feature)

```text
specs/002-swipeable-day-calendar/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── day-view-api.md  # reused list endpoints + Schedule-X config contract
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── day-view/
│   │       ├── DayViewContainer.vue   # owns selectedDate; hosts header + calendar
│   │       ├── DayViewHeader.vue      # date title (existing)
│   │       ├── ScheduleCalendar.vue   # Schedule-X day view (existing; swipe target; #timeGridEvent + #dateGridEvent slots)
│   │       ├── UntimedPill.vue        # NEW (YAGNI-minimal): pill rendered inside native #dateGridEvent slot
│   │       ├── CourseCard.vue         # timed event card (existing, reused)
│   │       └── TimeIndicator.vue      # now-line overlay (existing, untouched)
│   ├── composables/
│   │   └── useCatalog.ts              # courses/schedules cache (existing, reused)
│   ├── utils/
│   │   ├── planCategory.ts            # getPlanCategory() (existing, reused)
│   │   └── scheduleExpander.ts        # grid boundaries + DayEvent mapping (existing)
│   ├── types/
│   │   └── api.ts                     # TaskResponse / AcademicEventResponse DTOs
│   └── mocks/
│       └── calendarData.ts            # dev fixtures
└── package.json                       # Schedule-X deps already present; no additions
```

**Structure Decision**: Frontend-only change inside existing `frontend/src/components/day-view/`. One new pill component (`UntimedPill.vue`) rendered through Schedule-X's native `#dateGridEvent` slot; `DayViewContainer.vue` + `ScheduleCalendar.vue` edited surgically. No backend changes.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | No violations. No new backend endpoint, package, or store. |
