# Bug Assessment: Janky Swiping and Entry Animation in Calendar Day and Week Views

- **Slug**: calendar-swiping-behavior
- **Created**: 2026-10-17T11:00:00+08:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> "remove the entry swipe animation of the calendar in day/week. swiping should include the entire calendar including the time label column like google calendar mobile behavior. currently, the behavior is working but janky"

## Symptom

Horizontal swiping in day and week views feels janky. The calendar holds the time label column stationary, clips the grid, and triggers a secondary entry slide animation on date change. Expected Google Calendar mobile behavior slides the entire calendar surface including the time label column without entry animations.

## Reproduction

1. Open the schedule view or `DayViewContainer.story.vue` in day or week view.
2. Drag horizontally with a pointer to swipe to the next or previous day or week.
3. Observe that only the event grid slides while a duplicate time axis overlays the left edge.
4. Release the drag to commit the swipe.
5. Observe the delayed covering phase and the Schedule-X entry animation (`.sx__slide-left` or `.sx__slide-right`) firing when the new date renders.

## Suspected Code Paths

- `frontend/src/components/day-view/DaySwiper.vue:29,51-54,106-112,230-274` — Clips the track with `clipPath: inset()`, calculates `slideDistance` minus `peekGutter`, and renders a duplicate fixed time axis overlay.
- `frontend/src/components/day-view/DaySwiper.vue:179-200` — Uses a `covering` phase and waits for `day-ready` event before unmounting the peek preview, causing visual stutter.
- `frontend/src/components/day-view/ScheduleCalendar.vue:71-91` — Omits `skipAnimations: true` in `createCalendar` options, causing Schedule-X to run a 300ms slide-and-blur entry animation on date change.
- `frontend/src/components/day-view/DayPeek.vue:46-50` — Offsets the preview with `left: ${gutterLeft}px` and omits the time label column.
- `frontend/src/components/day-view/WeekPeek.vue:52-56` — Offsets the preview with `left: ${gutterLeft}px` and omits the time label column.

## Root Cause Hypothesis

High confidence. `DaySwiper.vue` pins the time axis column stationary by applying `clipPath: inset(...)` and rendering a separate fixed time axis overlay. When the swipe commits, `ScheduleCalendar.vue` updates `selectedDate` without `skipAnimations: true`, causing Schedule-X to run its built-in slide animation (`.sx__slide-left` or `.sx__slide-right`) while `DaySwiper` holds an artificial covering phase.

## Proposed Remediation

**Preferred**:
1. In `DaySwiper.vue`, slide the entire viewport width (`slideDistance = vp.width`). Remove `clipPath`, remove `peekGutter` subtraction, and delete the duplicate fixed time axis overlay.
2. In `ScheduleCalendar.vue`, add `skipAnimations: true` to the `createCalendar` configuration (matching `WeekCalendar.vue`). Add CSS to suppress `.sx__slide-left` and `.sx__slide-right` animations.
3. In `DayPeek.vue` and `WeekPeek.vue`, render the full calendar width (time labels plus event columns) so the preview slides in as a complete surface.
4. Streamline the settle and finish sequence in `DaySwiper.vue` to eliminate jank from the delayed `covering` phase.

**Alternatives**:
- Keep fixed time axis and optimize clip-path: Rejected because user explicitly requested Google Calendar mobile behavior where swiping includes the entire calendar including the time label column.

**Files likely to change**:
- `frontend/src/components/day-view/DaySwiper.vue`
- `frontend/src/components/day-view/ScheduleCalendar.vue`
- `frontend/src/components/day-view/WeekCalendar.vue`
- `frontend/src/components/day-view/DayPeek.vue`
- `frontend/src/components/day-view/WeekPeek.vue`
- `frontend/src/components/day-view/__tests__/DaySwiper.spec.ts`

**Tests to add or update**:
- Unit test in `DaySwiper.spec.ts` checking that swipe slide distance spans the full viewport width and emits `changeDate`.
- Unit test verifying `ScheduleCalendar.vue` configures `skipAnimations: true`.

## Risks & Considerations

- Time label column alignment in `DayPeek` and `WeekPeek` must match Schedule-X column dimensions to prevent layout jumps.
- Touch action pan-y must remain configured so vertical scrolling continues to work without conflicting with horizontal swiping.

## Open Questions

- None.
