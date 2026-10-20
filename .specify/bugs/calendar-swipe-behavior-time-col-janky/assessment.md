# Bug Assessment: Time Column and Grid Line Shutter in Calendar Day and Week Swiping

- **Slug**: calendar-swipe-behavior-time-col-janky
- **Created**: 2026-10-17T11:23:00+08:00
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> "the patch kind of worked but the problem still exists but subtly. i want you to eradicate that problem completely. do not apply bandaid solution"

## Symptom

When swiping between days or weeks, a subtle shutter or twitch remains visible in the time label column and intersecting horizontal lines as the swipe gesture concludes. The transition fails to produce a completely smooth, continuous handoff.

## Reproduction

1. Open the day view or week view on a mobile viewport (390px width) or via `DayViewContainer.story.vue`.
2. Slowly drag horizontally to trigger the peek preview.
3. Observe the subtle subpixel offset between the peek preview elements and the Schedule-X grid elements.
4. Release the pointer to complete the swipe.
5. Observe the micro-stutter / jump at the moment the `covering` phase completes and the peek overlay unmounts to reveal the live Schedule-X instance.

## Suspected Code Paths

- `frontend/src/components/day-view/DaySwiper.vue:26,69-71,159-178` — Manages the state transition cycle: `dragging` → `settling` → `covering` → `idle`. The `covering` phase snaps `dragX` to 0, sets `peekLeft` to 0, and unmounts the preview upon `day-ready` via a delayed frame, creating an abrupt DOM swap.
- `frontend/src/components/day-view/DayPeek.vue:20-65` & `frontend/src/components/day-view/WeekPeek.vue:20-75` — Hand-crafted mock HTML/CSS templates that approximate Schedule-X's internal Preact DOM. Differences in font baseline, box-sizing, line-height, and flex vs. absolute positioning create unavoidable subpixel deviations (0.5px to 1.5px) from the real Schedule-X calendar.
- `frontend/src/components/day-view/ScheduleCalendar.vue:148-175` & `frontend/src/components/day-view/WeekCalendar.vue:135-150` — Mutation of `gutterLeft` via `ResizeObserver` and `settle(15)` re-triggers layout shifts and re-renders during the critical handoff window.
- `frontend/src/assets/main.css:184-219` — Schedule-X custom styling rules define `--sx-time-axis-line-length: 7px;` and `--sx-time-axis-label-width: 48px;`.

## Root Cause Hypothesis

High confidence. The root problem is an architectural mismatch caused by "double-swapping" two distinct DOM implementations. `DaySwiper` moves a mock preview component (`DayPeek` / `WeekPeek`) during the drag/settle animation, then unmounts it to reveal the real Preact Schedule-X engine underneath. Because the mock preview uses synthetic absolute positioning and hardcoded pixel approximations while Schedule-X uses dynamic flexbox, custom properties, and Preact virtual DOM rendering, subpixel rounding differences cannot be eliminated through cosmetic CSS tweaks. The handoff between the two implementations invariably causes a subtle visual twitch.

## Proposed Remediation

**Preferred**:
1. Eradicate the structural discrepancy between preview and live calendar. Refactor `DayPeek.vue` and `WeekPeek.vue` to adopt Schedule-X's exact class hierarchy (`.sx__week-grid`, `.sx__week-grid__time-axis`, `.sx__week-grid__hour`, `.sx__week-grid__hour-text`, `.sx__time-grid-day`) and CSS variable bindings so they inherit the exact same stylesheet rules and flexbox geometry as the live calendar.
2. Fix the handoff lifecycle in `DaySwiper.vue`. Avoid the jarring delayed unmount that causes the pop. Transition seamlessly from `settling` to `idle` in the exact paint cycle where the updated calendar matches the preview coordinates.
3. Lock `gutterLeft` to a stable constant derived from `--sx-calendar-week-grid-padding-left` (55px) to prevent `ResizeObserver` measurement jitter during swipe transitions.

**Alternatives**:
- Continue tweaking pixel offsets in `DayPeek.vue`: Rejected as an ineffective band-aid that will continually drift across screen densities and browser zoom levels.

**Files likely to change**:
- `frontend/src/components/day-view/DaySwiper.vue`
- `frontend/src/components/day-view/DayPeek.vue`
- `frontend/src/components/day-view/WeekPeek.vue`
- `frontend/src/components/day-view/ScheduleCalendar.vue`
- `frontend/src/components/day-view/WeekCalendar.vue`
- `frontend/src/components/day-view/__tests__/DaySwiper.spec.ts`

**Tests to add or update**:
- Unit tests in `DaySwiper.spec.ts` verifying gesture transitions, transform cleanup, and smooth completion.

## Risks & Considerations

- Performance during gesture tracking must maintain 60fps on mobile viewports.
- Scroll synchronization (`scrollTop`) must remain intact between transitions.

## Open Questions

- None.
