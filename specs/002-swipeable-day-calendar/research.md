# Research: Swipeable Day Calendar with Untimed Top Section (Schedule-X + YAGNI)

## Decision: Drive day navigation through Schedule-X `selectedDate`, not a custom grid

- **Decision**: Swipe left/right changes the `selectedDate` prop by ±1 day. `ScheduleCalendar.vue` already rebuilds the calendar via `calendarKey` when `selectedDate`/boundaries change (Schedule-X cannot mutate `dayBoundaries` post-creation). Keep that path; do not build a parallel grid or date state.
- **Rationale**: `ScheduleCalendar.vue:57-77` already owns the only correct Schedule-X lifecycle (`createCalendar({ views: [createViewDay()], defaultView: 'day', timezone, selectedDate: Temporal.PlainDate, dayBoundaries, weekOptions, events })` + `<ScheduleXCalendar :calendar-app :key>`). Reusing it preserves time-grid behavior, theming overrides, scroll/overlay measurement, and `timeGridEvent` slot rendering of `CourseCard`.
- **Alternatives considered**: Custom swipe container rendering its own day columns — rejected: duplicates Schedule-X layout/scroll, breaks `:deep()` theming and the now-line overlay math; violates VII/YAGNI.

## Decision: Native PointerEvents swipe with vertical-axis lock, no gesture library

- **Decision**: Attach `pointerdown`/`pointermove`/`pointerup` on the day-view column; lock axis on first decisive displacement; horizontal past threshold (30px, 300ms) commits ±1 day, otherwise snap back with no date change. If `|dy| > |dx|`, release to Schedule-X's native vertical scroll (`overscroll-behavior: contain` already set).
- **Rationale**: Zero new dependencies; matches SC-001 (<300ms) and SC-003 (≥98% vertical fidelity). Constitution VII requires platform APIs before libraries.
- **Alternatives considered**: Hammer.js / VueUse `useDrag` — rejected: new dependency for a threshold + axis-lock that is ~30 lines; YAGNI.

## Decision: Untimed items as native Schedule-X full-day events, not a custom strip

- **Decision**: Map date-only tasks and deadline-date events to Schedule-X events with `Temporal.PlainDate` start/end (same date). Schedule-X classifies these as `_isSingleDayFullDay` (`core.js:511-517`: both ends `PlainDate`, same date) and sorts them into `dateGridEvents`, rendered in its native `.sx__date-grid` row (aria-label 'Full day- and multiple day events') above the time grid. Customize pill rendering through the `#dateGridEvent` slot — the `@schedule-x/vue` wrapper forwards all `$slots` as custom component fns and its types declare `dateGridEvent` alongside `timeGridEvent`, the same pattern `ScheduleCalendar.vue` already uses for `CourseCard`. Branch `toSxEvents()`: timed `DayEvent` → `Temporal.ZonedDateTime`; untimed → `Temporal.PlainDate`. Cap the native row at ≤25% viewport via CSS on `.sx__date-grid`; overflow goes behind the US3 expand toggle.
- **Rationale**: Verified in installed `@schedule-x/calendar@4.9.1`: `CalendarEventExternal.start/end` accept `Temporal.ZonedDateTime | Temporal.PlainDate` (`core.d.ts:768-771`); `_isSingleDayTimed` returns false for any `PlainDate` end (`core.js:503-510`), so untimed items cannot land in the time grid by construction (SC-002). `createViewDay()` reuses the week wrapper that renders the date grid (`core.js:2581`), and the existing stylesheet hides only `.sx__calendar-header` + `.sx__week-grid__date-axis` — not `.sx__date-grid`. Native row also means FR-008 comes free with the existing `calendarKey` rebuild on `selectedDate` change.
- **Alternatives considered**: Custom sibling `div` strip between header and calendar — rejected: duplicates the row Schedule-X already renders, splits date-change updates across two render paths, and hides untimed styling from Schedule-X's stacking (`positionInDateGrid`); more code for a worse result. Schedule-X event-modal plugin — rejected: not wired, adds surface for a read-only strip; YAGNI.

## Decision: No new backend endpoint, no validation/mapping layer (YAGNI)

- **Decision**: Reuse existing list endpoints with server-side filters (`TaskListParams`, `ScheduleListParams`, `AcademicEventListParams`, `courseId`, `upcoming`); filter the active calendar day locally; derive tri-state with `getPlanCategory()`; colors via `courseId % 24`. Explicitly out of scope: `GET /api/day-view`, `GET /api/schedule-x/validate`, any Nyare↔Schedule-X schema mapper, round-trip tests, date-picker wiring (`@schedule-x/date-picker` stays installed but unused).
- **Rationale**: Backend exposes no date-range params, so per-day filtering belongs client-side on the once-fetched cached lists (AGENTS.md roundtrip conventions). Prior plan artifacts describing a validation server/pipeline were incorrect for this codebase and are removed by this revision. Deleting them upholds VII (Ponytail Minimalism) and YAGNI: the feature needs a date shift + a filtered list, not a conformance service.
- **Alternatives considered**: New `GET /api/day-view` aggregation endpoint — rejected: backend has no derived-state endpoints by convention; adds server work for a client-side filter. New validation endpoint — rejected: Schedule-X is a renderer here, not a schema authority; validation errors would block nothing and cost a roundtrip per swipe.

## Decision: Minimal state — `selectedDate` ref + computed filters, no store

- **Decision**: `DayViewContainer.vue` keeps `selectedDate = ref(new Date())`; untimed list is a `computed` over cached tasks/events. No Pinia (banned), no new composable unless the swipe handler exceeds one component (extract only then).
- **Rationale**: Follows `useCatalog()` cache rules (refetch only after catalog mutations) and keeps swipe logic co-located with the view it drives.
- **Alternatives considered**: Dedicated swipe/calendar store — rejected: single-view state; YAGNI.

**Output**: All NEEDS CLARIFICATION resolved. No open research items; thresholds (30px/300ms), axis-lock rule, and strip placement are decided above.
