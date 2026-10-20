# Data Model: Swipeable Day Calendar (Schedule-X + YAGNI)

Presentation-only model. No DB changes, no new DTOs. All fields derive from existing `frontend/src/types/api.ts` DTOs filtered locally.

## Entity: DayCalendarView (presentation derivation, not persisted)

- `selectedDate: Date` — single source of truth, owned by `DayViewContainer.vue` (`ref(new Date())`). Swipe writes ±1 day; Schedule-X `selectedDate: Temporal.PlainDate` derives from its local parts.
- `timedEvents: DayEvent[]` — schedules expanded for `selectedDate` via existing `expandSchedulesForDate()`; passed to Schedule-X through existing `toSxEvents()` as `Temporal.ZonedDateTime` ranges.
- `untimedItems: UntimedDayItem[]` — tasks + events whose date equals `selectedDate`, computed locally (see below). Mapped to Schedule-X `PlainDate` full-day events and rendered in the native `.sx__date-grid` row via the `#dateGridEvent` slot — never as midnight time-grid events.
- `swipeGestureState: SwipeGestureState` — transient pointer state, reset on `pointerup`.

## Entity: UntimedDayItem (derived)

Source DTOs (verbatim field constraints from `src/types/api.ts`):
- `TaskResponse`: `scheduledDate?: string | null` (date only, day granularity), `duration?: string | null`, `status: TaskStatus`, `courseId: number`, `title: string`.
- `AcademicEventResponse`: `deadline: string` (date only), `courseId: number`, `title: string`.

Derivation rules:
- Include a task when `task.scheduledDate` is set and its calendar day equals `selectedDate`. All such tasks are untimed by definition (no hour field exists — never invent one per Constitution III).
- Include an event when its `deadline` calendar day equals `selectedDate`.
- Map each item to a Schedule-X event with `start`/`end` as `Temporal.PlainDate` (same date) → native `_isSingleDayFullDay` → `.sx__date-grid` row. Timed items keep `Temporal.ZonedDateTime` mapping; the two types cannot mix grids by construction.
- `category`: `"task"` for tasks, `"event"` for events (drives pill styling in the `#dateGridEvent` slot: tasks white card + checkbox affordance; events solid course fill + flag — per plan constraints).
- `courseColor`: deterministic `palette[courseId % 24]`; no override layer (YAGNI).
- Tri-state display uses existing `getPlanCategory(task)`: `scheduledDate` → `SCHEDULED`; else `duration` → `LATER`; else `BACKLOG`. The strip does not recompute or store it.

## Entity: SwipeGestureState (transient)

- `isActive: boolean`, `startX/startY`, `currentX/currentY`, `displacementX/displacementY`
- `directionLocked: 'horizontal' | 'vertical' | null` — locked on first decisive displacement; `|dy| > |dx|` yields to native vertical scroll (FR-009).
- `thresholdMet: boolean` — `|dx| ≥ 30px` within 300ms commits the navigation; otherwise snap back with no date change (acceptance scenarios 3–4).
- `targetDayOffset: -1 | 0 | +1` — exactly one day per gesture (Assumptions).

## Entity: SwipeThresholdConfig (constants, not user settings)

- `minimumDisplacement: 30` (px), `timeoutMs: 300`, `verticalPriority: true`. Hardcoded per YAGNI; no settings UI.

## Validation Rules (from spec requirements)

| Requirement | Rule |
|-------------|------|
| FR-001/002/003 | Horizontal swipe past threshold moves exactly ±1 day via `selectedDate` |
| FR-004 | Header title derives from `selectedDate` via existing `formatDateHeader()` |
| FR-005/006 | Untimed items map to `PlainDate` full-day events in the native `.sx__date-grid` row above the hourly grid; only date-matching items lacking time-of-day |
| FR-007 | Render untimed tasks/events with course context indicators distinct from hourly class blocks (via `#dateGridEvent` slot) |
| FR-008 | Native row recomputes on `selectedDate` change via existing `calendarKey` rebuild; no stale day data |
| FR-009 | Vertical-dominant gestures scroll natively; no date change |
| FR-010 | Native `.sx__date-grid` row capped at ≤25% viewport via CSS; overflow behind expand toggle (US3) |

## State Transitions

- `pointerdown` → capture start, `isActive: true`.
- `pointermove` → update displacement; lock axis once decisive.
- Horizontal + threshold on `pointerup` → `selectedDate ±= 1` → existing `calendarKey` rebuild + strip recompute.
- Sub-threshold or vertical-dominant → reset state, no date change.

## Explicit Non-Entities (YAGNI removals)

Earlier revisions of this file described `ScheduleXEvent.validation_status`, `ScheduleXValidationResult`, and a validation pipeline. Those do not exist in this codebase and are removed: Schedule-X is the grid renderer, not a schema authority; no conformance objects are built or stored.
