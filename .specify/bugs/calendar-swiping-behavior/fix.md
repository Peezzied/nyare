# Bug Fix: Janky Swiping and Entry Animation in Calendar Day and Week Views

- **Slug**: calendar-swiping-behavior
- **Fixed**: 2026-10-17T11:07:00+08:00
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Removed the fixed time axis overlay and clipping in `DaySwiper` so horizontal swiping moves the entire calendar surface across the viewport. Configured Schedule-X with `skipAnimations: true` and CSS overrides to eliminate entry slide transitions on day and week updates.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/components/day-view/DaySwiper.vue` | modified | Removed `clipStyle` and fixed overlay, set `slideDistance` to full viewport width, guarded `matchMedia`. |
| `frontend/src/components/day-view/ScheduleCalendar.vue` | modified | Added `skipAnimations: true` and suppressed `.sx__slide-left`/`.sx__slide-right` in CSS. |
| `frontend/src/components/day-view/WeekCalendar.vue` | modified | Suppressed `.sx__slide-left`/`.sx__slide-right` in CSS. |
| `frontend/src/components/day-view/DayPeek.vue` | modified | Added time label column on the left with unified continuous horizontal lines (starting 7px into the gutter, matching Schedule-X). |
| `frontend/src/components/day-view/WeekPeek.vue` | modified | Added time label column on the left with unified continuous horizontal lines (starting 7px into the gutter, matching Schedule-X). |
| `frontend/src/components/day-view/__tests__/DaySwiper.spec.ts` | added | Added unit tests verifying full-width swiping and date change emissions. |

## Diff Highlights

```vue
<!-- DaySwiper.vue: Entire calendar + peek preview slide together -->
<div class="absolute inset-0 flex flex-col" :style="trackStyle">
  <slot />

  <div
    v-if="peekDate"
    class="pointer-events-none absolute top-0 z-30 h-full w-full bg-[#F5F6EE]"
    :style="{ left: peekLeft }"
  >
    <slot name="peek" :date="peekDate" :scrollTop="peekScrollTop" :gutterLeft="peekGutter" />
  </div>
</div>
```

```ts
// ScheduleCalendar.vue
const calendarApp = shallowRef(
  createCalendar(
    {
      views: [createViewDay()],
      defaultView: 'day',
      timezone: TZ,
      skipAnimations: true,
      selectedDate: toPlainDate(props.selectedDate),
```

## Tests Added or Updated

- `frontend/src/components/day-view/__tests__/DaySwiper.spec.ts::slides the track and commits date change on drag exceeding threshold` — Verifies left drag commits date increment.
- `frontend/src/components/day-view/__tests__/DaySwiper.spec.ts::emits previous day on right swipe` — Verifies right drag commits date decrement.
- `frontend/src/components/day-view/__tests__/DaySwiper.spec.ts::does not emit changeDate when drag is under threshold and slow` — Verifies sub-threshold drag returns to idle without emitting date change.

## Local Verification

- Commands run:
  - `npx vitest run src/components/day-view/__tests__/DaySwiper.spec.ts` → 4 passed (100%)
  - `npm run type-check` → vue-tsc passed with 0 errors
  - `npm run lint:oxlint` → 0 warnings and 0 errors

## Deviations from Assessment

None.

## Follow-ups

- Run `/speckit-bug-test slug=calendar-swiping-behavior` to validate bug resolution.
