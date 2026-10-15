# Quickstart: Swipeable Day Calendar with Untimed Top Section

## Purpose

Runnable validation scenarios proving swipe navigation + native Schedule-X full-day row work on the existing day view. No new services to start; no new packages to install.

## Prerequisites

- Node.js `^22.18.0 || >=24.12.0`
- Dependencies already installed (`npm install`): `@schedule-x/vue`, `@schedule-x/calendar`, `@schedule-x/theme-default`, `temporal-polyfill`, Vue 3, Vite, Tailwind 4
- Nyare backend on `:8080` (existing `/api` proxy in `vite.config.ts`)
- Pointer/touch-capable input for swipe tests

## Setup

```bash
cd nyare/frontend
npm install
npm run dev
```

## Validation Scenarios

### Scenario 1: Initial day load
1. Open the day view.
2. **Expected**: header shows today; Schedule-X grid shows timed blocks; native `.sx__date-grid` all-day row shows date-matching tasks/events (or collapses when empty).

### Scenario 2: Swipe to adjacent days
1. Swipe left → previous day; swipe right → next day (one day per gesture).
2. **Expected**: header + grid + native all-day row update to the new day; Schedule-X rebuilds via existing `calendarKey` path; completes in under 300ms (SC-001).

### Scenario 3: Sub-threshold snap-back
1. Start a horizontal swipe, release before 30px.
2. **Expected**: no date change; view stays on current day.

### Scenario 4: Vertical scroll passthrough
1. Drag vertically through the hour grid.
2. **Expected**: native scroll, no day change (SC-003).

### Scenario 5: Untimed placement (SC-002)
1. Seed a date-only task and a deadline-date event for the active day.
2. **Expected**: both render in the native all-day row with course color + task/event distinction; neither appears as a midnight block in the time grid (`PlainDate` events cannot land there by construction).

### Scenario 6: All-day row follows date
1. Swipe to another day.
2. **Expected**: all-day row recomputes to the new day only; no stale items.

### Scenario 7: Empty day
1. Swipe to a day with no schedules/tasks/events.
2. **Expected**: empty grid + collapsed all-day row; swipe keeps working; no errors.

### Scenario 8: Overflow + long titles (US3)
1. Seed 4+ untimed items including one long title.
2. **Expected**: compact pills with ellipsis, no viewport overflow; expand toggle reveals all; default height ≤25% viewport (SC-004).

## Test/Run Commands

```bash
npm run type-check    # vue-tsc --build
npm run lint:oxlint   # fast linter
npx vitest run src/components/day-view  # targeted tests for this feature
```

## References

- **Feature Spec**: `spec.md` (FR-001–FR-010, SC-001–SC-004)
- **Data Model**: `data-model.md` (derived presentation entities)
- **Contracts**: `contracts/day-view-api.md` (reused endpoints + Schedule-X config)
- **Research**: `research.md` (Schedule-X + YAGNI decisions)
- **Constitution**: `.specify/memory/constitution.md`
