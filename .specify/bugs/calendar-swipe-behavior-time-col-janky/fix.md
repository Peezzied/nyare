# Bug Fix: Course Block Flicker and Week Row Spacing Jitter in Calendar Swiping

- **Slug**: calendar-swipe-behavior-time-col-janky
- **Status**: applied
- **Completed**: 2026-10-17T12:02:00+08:00

## Root Cause

1. **Course Block Flicker**:
   - Schedule-X attaches `.is-event-new` to updated events, triggering `sx-grow-event` keyframe animation (starts at `opacity: 0, scale: 0`).
   - `@schedule-x/vue` uses Vue `<Teleport>` to render custom slot elements, taking an asynchronous render tick to mount targets after `events.set()`.
   - `DaySwiper` unmounted the preview before Vue finished mounting the Teleport nodes.
2. **Week Row Spacing Jitter**:
   - `WeekCalendar.vue` executed a 15-frame RAF loop (`settle(15)`) recalculating `colsWidth` dynamically via `getBoundingClientRect()`.
   - Fractional subpixel coordinate drift during active transforms forced `WeekHeaderRow` to re-layout 15 times over 250ms.
   - The grid container `.sx__view-container` had a vertical scrollbar track that reduced column widths by 8px, whereas the week header had no scrollbar.

## Changes Made

1. **`frontend/src/assets/main.css`**:
   - Disabled `.is-event-new` entrance animation (`animation: none !important; opacity: 1 !important; transform: none !important;`).
   - Disabled slide transition classes (`.sx__slide-left`, `.sx__slide-right`).
   - Set Schedule-X background color `#f5f6ee` globally.

2. **`frontend/src/components/day-view/ScheduleCalendar.vue` & `WeekCalendar.vue`**:
   - Made date/event watch handlers async and added `await nextTick()` before `requestAnimationFrame` to ensure Vue Teleports finish mounting before dispatching `day-ready`.
   - Removed dynamic `colsWidth` measurement loop and `settle(15)` from `WeekCalendar.vue`.
   - Added `scrollbar-width: none` and hidden WebKit scrollbars on `.sx-nyare-week :deep(.sx__view-container)`.
   - Passed `:cols-width="0"` to `<WeekHeaderRow>` so it fills 100% of the space, matching `.sx__week-grid` columns with 100% mathematical consistency.

3. **`frontend/src/components/day-view/DayPeek.vue` & `WeekPeek.vue`**:
   - Refactored DOM hierarchy to mirror Schedule-X flex layout and CSS classes.
   - Set `scrollbar-width: none` on `WeekPeek.vue` so preview columns exactly match live columns.
   - Bound `:cols-width="0"` to `<WeekHeaderRow>`.

4. **`frontend/src/components/day-view/DaySwiper.vue`**:
   - Set full slide distance across the entire viewport width.
   - Added `bg-[#F5F6EE]` to the viewport container.
   - Removed delayed frame in `onDayReady()`, ending cover directly when `day-ready` arrives.

5. **`frontend/src/components/day-view/__tests__/DaySwiper.spec.ts`**:
   - Added unit test asserting `gutterLeft` is measured and passed to the peek slot during drag.

## Verification

- `npm run lint:oxlint`: 0 warnings, 0 errors.
- `npm run type-check`: 0 errors.
- `npx vitest run src/components/day-view/__tests__/DaySwiper.spec.ts`: 5 passed.
- `npx vitest run src/components/day-view/__tests__/WeekPill.spec.ts src/components/day-view/__tests__/CourseCard.spec.ts`: 4 passed.
