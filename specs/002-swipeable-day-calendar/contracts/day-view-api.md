# Contracts: Swipeable Day Calendar

No new backend endpoints. This feature reuses existing list endpoints and the existing Schedule-X calendar configuration already in `ScheduleCalendar.vue`.

## Reused backend endpoints (no changes)

- `GET /api/schedules` with `userId`, `upcoming` params → `ScheduleResponse[]` (`id`, `courseId`, `day`, `startTime`, `endTime`). Cached in `useCatalog()`; expanded per day via `expandSchedulesForDate()`.
- `GET /api/tasks` with `userId`, `courseId`, `upcoming` params → `TaskResponse[]` (`id`, `courseId`, `title`, `scheduledDate?: string | null`, `duration?: string | null`, `status`). Filter active day locally (backend has no date-range params).
- `GET /api/academic-events` with `userId`, `courseId`, `upcoming` params → `AcademicEventResponse[]` (`id`, `courseId`, `title`, `deadline: string`). Filter active day locally.
- `GET /api/study-planner/status` + `POST /api/study-planner/process` — untouched; after process, refetch only tasks + events for `affectedCourseIds` per roundtrip conventions.

Roundtrip rules applied: load each list once per intent; trust mutation responses (no re-`list()` after create/update/delete); never `get(id)` in a loop; derive tri-state and strip contents locally.

## Frontend contract: Schedule-X calendar configuration (existing, unchanged shape)

`ScheduleCalendar.vue` builds the instance as:

```typescript
createCalendar({
  views: [createViewDay()],
  defaultView: 'day',
  timezone: 'Asia/Manila',
  selectedDate: Temporal.PlainDate.from('YYYY-MM-DD'), // derived from selectedDate local parts (never toISOString — UTC shift)
  dayBoundaries: { start: 'HH:00', end: 'HH:00' },     // from calculateGridBoundaries()
  weekOptions: { gridHeight, gridStep: 60, timeAxisFormatOptions: { hour: 'numeric', hour12: true } },
  events: [...toSxEvents(timedEvents), ...toSxFullDayEvents(untimedItems)],
  // timed DayEvent -> Temporal.ZonedDateTime (time grid); untimed -> Temporal.PlainDate start/end (native .sx__date-grid row)
})
```

Constraints: `dayBoundaries` immutable post-creation → date/boundary change bumps existing `calendarKey` to rebuild. `timeGridEvent` slot keeps rendering `CourseCard` with `_raw: DayEvent`; new `dateGridEvent` slot renders `UntimedPill` with `_raw: UntimedDayItem`. Theming stays in existing `:deep()` overrides plus a ≤25%-viewport cap on `.sx__date-grid`.

## Frontend contract: `UntimedPill.vue` (new, minimal — rendered inside native `#dateGridEvent` slot)

```typescript
interface UntimedStripProps {
  item: UntimedDayItem  // one date-matching task/event; received via #dateGridEvent slot scope
  expanded: boolean     // US3 expand toggle state, owned by parent
}
```

Item shape (derived, not a DTO):

```typescript
interface UntimedDayItem {
  id: string
  title: string
  category: 'task' | 'event'
  courseId: number
  completed: boolean       // tasks: status === 'COMPLETED'; events: false (immutable)
  date: string             // 'YYYY-MM-DD' active-day key
}
```

Styling contract: title truncates with ellipsis in compact pills; course color via `courseId % 24`; default strip height ≤25% viewport; expand toggle reveals remainder.

## Removed (YAGNI)

- `GET /api/day-view` (invented aggregation endpoint — backend has no derived-state endpoints; deleted).
- `GET /api/schedule-x/validate` + `ValidationResult`/`scheduleXValidation` (invented conformance service — deleted; nothing consumes it and it costs a roundtrip per swipe).
