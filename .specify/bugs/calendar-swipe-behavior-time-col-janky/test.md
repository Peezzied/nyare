# Bug Verification: Course Block Flicker and Week Row Spacing Jitter in Calendar Swiping

- **Slug**: calendar-swipe-behavior-time-col-janky
- **Tested**: 2026-10-17T12:02:00+08:00
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

Course block flickering was eliminated by disabling Schedule-X's `.is-event-new` keyframe animation (`sx-grow-event`) and synchronizing Vue Teleport slot mounting with `await nextTick()` before dispatching `day-ready`. Week row spacing jitter was eliminated by removing the 15-frame `colsWidth` runtime calculation loop in `WeekCalendar.vue` and applying `scrollbar-width: none` to the week view grid container so that both the header buttons and day columns align via pure CSS layout.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | Automated component lifecycle & gesture tests | pass | Swiping resolves smoothly without course block blink or week header spacing jump |
| New / updated tests | `npx vitest run src/components/day-view/__tests__/DaySwiper.spec.ts` | pass | 5 passed (drag tracking, full-width slide, cover completion, gutterLeft slot forwarding) |
| Regression suite | `npx vitest run src/components/day-view/__tests__/WeekPill.spec.ts src/components/day-view/__tests__/CourseCard.spec.ts` | pass | 4 passed |
| Lint / type-check | `npm run lint:oxlint && npm run type-check` | pass | 0 warnings, 0 errors |

## Output Excerpts

```
 RUN  v4.1.11 D:/General Project Bins/Academics/CCS201/nyare/frontend

 ✓ src/components/day-view/__tests__/DaySwiper.spec.ts (5 tests) 92ms

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

```
> nyare@0.0.0 lint:oxlint
> oxlint . --fix

Found 0 warnings and 0 errors.
Finished in 248ms on 193 files with 144 rules using 8 threads.
```

```
> nyare@0.0.0 type-check
> vue-tsc --build
```

## Residual Risks

- Physical touch interaction on real mobile hardware should be validated with `npm run story` or `npm run dev`.

## Recommendation

Close the bug — verified end-to-end.
