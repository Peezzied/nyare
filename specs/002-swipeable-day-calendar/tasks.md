# Tasks: Swipeable Day Calendar with Untimed Top Section

**Input**: Design documents from `specs/002-swipeable-day-calendar/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/day-view-api.md, quickstart.md
**Tests**: Included only as focused Vitest unit specs for pure helpers (date keys, swipe resolution, untimed derivation) per the spec's Independent Test criteria; no rendering mocks, no new test infra.
**Organization**: Grouped by user story. Paths are relative to `frontend/` unless noted.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Web app: `frontend/src/`, backend untouched by this feature
- Unit tests: `frontend/src/**/__tests__/*.spec.ts`, run with `npx vitest run <file>`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline evidence + shared fixtures before any implementation

- [X] T001 [P] Record baseline verification evidence by running `npm run type-check` in `frontend/` and confirming zero errors before edits
- [X] T002 [P] Add untimed fixtures (2 date-only tasks + 1 deadline-date event for 2026-10-14, 1 task for 2026-10-15) to `frontend/src/mocks/calendarData.ts`

**Checkpoint**: Baseline green; fixtures available for US2/US3 independent tests

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure helpers + data wiring that all user stories depend on. MUST complete before any story phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 [P] Write failing unit spec for date-key helpers (`toDateKey`, `addDays`, `isSameDay`, local-parts only, never `toISOString`) in `frontend/src/utils/__tests__/dayKey.spec.ts`
- [X] T004 [P] Write failing unit spec for untimed derivation (task included when `scheduledDate` day equals active day; event included when `deadline` day equals active day; `category` is `"task"` or `"event"` verbatim; `completed` is `status === 'COMPLETED'` for tasks and `false` for events) in `frontend/src/utils/__tests__/untimedItems.spec.ts`
- [X] T005 Implement date-key helpers in `frontend/src/utils/dayKey.ts` until `frontend/src/utils/__tests__/dayKey.spec.ts` passes
- [X] T006 Implement `deriveUntimedItems` in `frontend/src/utils/untimedItems.ts` until `frontend/src/utils/__tests__/untimedItems.spec.ts` passes
- [X] T007 Load tasks once per intent via `tasksApi.list()` from `frontend/src/api/tasks.ts` and events once per intent via `academicEventsApi.list()` from `frontend/src/api/academicEvents.ts` in `frontend/src/components/day-view/DayViewContainer.vue` (local refs; no store; no re-fetch on swipe; filter active day locally with helpers from `frontend/src/utils/dayKey.ts`)

**Checkpoint**: Foundation ready — helpers tested, lists load once, user stories can begin

---

## Phase 3: User Story 1 — Swipe to Navigate Previous and Next Days (Priority: P1) ⭐ MVP

**Goal**: Horizontal swipe moves `selectedDate` by exactly ±1 day; Schedule-X rebuilds natively; header follows.

**Independent Test**: On a pointer-enabled viewport, swipe left → date advances one day with that day's grid; swipe right → returns; sub-threshold release changes nothing; vertical drag scrolls without changing day.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T008 [P] [US1] Write failing unit spec for `resolveSwipe` (`|dx| >= 30` within 300ms commits `targetDayOffset` of `-1` for left or `+1` for right; sub-threshold returns `0`; `|dy| > |dx|` returns `0` for vertical passthrough) in `frontend/src/utils/__tests__/swipeGesture.spec.ts`

### Implementation for User Story 1

- [X] T009 [US1] Implement `resolveSwipe` in `frontend/src/utils/swipeGesture.ts` until `frontend/src/utils/__tests__/swipeGesture.spec.ts` passes
- [X] T010 [US1] Wire PointerEvents swipe on the day-view column in `frontend/src/components/day-view/DayViewContainer.vue` (axis-lock on first decisive displacement; commit calls `addDays` from `frontend/src/utils/dayKey.ts`; existing `calendarKey` rebuild in `frontend/src/components/day-view/ScheduleCalendar.vue` must not be duplicated)
- [X] T011 [US1] Set `touch-action: pan-y` on the swipe surface and confirm `.sx__view-container` native vertical scroll is untouched in `frontend/src/components/day-view/ScheduleCalendar.vue`
- [X] T012 [US1] Verify header updates from `selectedDate` via existing `formatDateHeader` in `frontend/src/utils/scheduleExpander.ts` and swipe-to-render completes under 300ms per SC-001

**Checkpoint**: US1 independently testable — swipe navigates days, vertical scroll unaffected

---

## Phase 4: User Story 2 — View Untimed Tasks and Events in Top All-Day Section (Priority: P2)

**Goal**: Date-matching tasks/events render in Schedule-X's native `.sx__date-grid` all-day row via `#dateGridEvent`; never as midnight time-grid blocks.

**Independent Test**: With dated fixtures for the active day, untimed items appear in the all-day row with course color + task/event distinction; timed blocks stay on the time axis; switching days refreshes the row.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US2] Write failing unit spec asserting untimed mapping emits `Temporal.PlainDate` start/end (same date) while timed mapping keeps `Temporal.ZonedDateTime`, in `frontend/src/utils/__tests__/untimedItems.spec.ts` (extend T004 spec file, new `describe` block)

### Implementation for User Story 2

- [X] T014 [P] [US2] Create `UntimedPill.vue` in `frontend/src/components/day-view/UntimedPill.vue` (single-item pill: truncated title, `courseId % 24` color, task checkbox affordance vs event flag; receives item via `#dateGridEvent` slot scope)
- [X] T015 [US2] Branch event mapping in `frontend/src/components/day-view/ScheduleCalendar.vue` (timed `DayEvent` → existing `ZonedDateTime` path; `deriveUntimedItems` output → `Temporal.PlainDate` start/end with `_raw` passthrough) and register the `#dateGridEvent` slot rendering `frontend/src/components/day-view/UntimedPill.vue`
- [X] T016 [US2] Cap the native all-day row at ≤25% viewport height with existing 8px rhythm in `frontend/src/components/day-view/ScheduleCalendar.vue` (`<style scoped>` `:deep(.sx__date-grid)` rules only; do not restyle the time grid)
- [X] T017 [US2] Verify empty-day collapse (no untimed items → row contributes no height, no console warnings) in `frontend/src/components/day-view/DayViewContainer.vue` wiring

**Checkpoint**: US1 + US2 both work — swipe navigates, untimed items render exclusively in the native all-day row (SC-002)

---

## Phase 5: User Story 3 — Expand Multiple Untimed Items (Priority: P3)

**Goal**: 4+ untimed items stay compact by default with an expand toggle revealing all, without overflowing the viewport.

**Independent Test**: Load a day with four untimed items including one long title; pills truncate with ellipsis; toggle expands to show all; toggle collapses back.

### Implementation for User Story 3

- [X] T018 [P] [US3] Implement title ellipsis truncation inside bounded pills in `frontend/src/components/day-view/UntimedPill.vue` (CSS `text-overflow: ellipsis`; no viewport overflow on 390px baseline)
- [X] T019 [US3] Implement expand/collapse toggle for the native all-day row in `frontend/src/components/day-view/ScheduleCalendar.vue` (collapsed shows compact pills within the ≤25% cap; expanded reveals all items; `aria-expanded` managed; keyboard-focusable)
- [X] T020 [US3] Verify toggle with 4+ fixtures from `frontend/src/mocks/calendarData.ts` and confirm tri-state display still derives via `getPlanCategory` in `frontend/src/utils/planCategory.ts` (no recomputation in the pill)

**Checkpoint**: All user stories independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation + constitution sweeps, no new scope

- [X] T021 [P] Run all 8 `specs/002-swipeable-day-calendar/quickstart.md` validation scenarios and record pass/fail evidence
- [X] T022 [P] Verify Constitution I–V on the final diff (tri-state derived locally; every item carries `courseId`; no invented times/durations/scores; no title rewrites; native fetch only, no new endpoint/package/store)
- [X] T023 Run `npm run type-check` in `frontend/` and `npx vitest run src/utils/__tests__/dayKey.spec.ts src/utils/__tests__/untimedItems.spec.ts src/utils/__tests__/swipeGesture.spec.ts` in `frontend/` and record fresh passing output
- [X] T024 Run `npm run lint:oxlint` in `frontend/` and fix only violations introduced by this feature's files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational — no dependencies on other stories
- **User Story 2 (P2)**: Starts after Foundational — integrates with US1's `selectedDate` but independently testable via fixtures
- **User Story 3 (P3)**: Starts after Foundational + US2's slot/pill (extends US2 rendering; independently testable)

### Within Each User Story

- Specs (T003/T004/T008/T013) written FIRST and confirmed FAIL before implementation
- Helpers before component wiring (`frontend/src/utils/` before `frontend/src/components/day-view/`)
- `UntimedPill.vue` before slot registration that renders it
- Story complete before moving to next priority

### Parallel Opportunities

- T001 + T002 (different files, no dependencies)
- T003 + T004 (different spec files, no dependencies)
- T008 + T013 (different spec files; T013 extends the T004 file but in a new `describe` block — coordinate to avoid edit conflicts, or run sequentially)
- T014 (new file) can start once T006's `UntimedDayItem` shape is fixed, in parallel with T010/T011 (different files)
- T018 (pill file) in parallel with T019 (calendar file) within US3
- T021 + T022 (evidence gathering + diff review, different concerns)

---

## Parallel Example: Foundational Specs

```bash
# Launch both foundation specs together (different files, no dependencies):
Task: "Write failing unit spec for date-key helpers in frontend/src/utils/__tests__/dayKey.spec.ts"
Task: "Write failing unit spec for untimed derivation in frontend/src/utils/__tests__/untimedItems.spec.ts"
```

## Parallel Example: US2 Pill + US1 Swipe

```bash
# Once T006 fixes the UntimedDayItem shape, these run together (different files):
Task: "Create UntimedPill.vue in frontend/src/components/day-view/UntimedPill.vue"
Task: "Wire PointerEvents swipe in frontend/src/components/day-view/DayViewContainer.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T007) — **CRITICAL, blocks all stories**
3. Complete Phase 3: User Story 1 (T008–T012)
4. **STOP and VALIDATE**: Swipe navigates ±1 day, header follows, vertical scroll clean, <300ms
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → helpers tested, lists load once
2. Add US1 → swipe works → Deploy/Demo (MVP!)
3. Add US2 → native all-day row renders untimed → Deploy/Demo
4. Add US3 → overflow toggle + truncation → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T008–T012)
   - Developer B: User Story 2 (T013–T017)
   - Developer C: joins US3 after US2's slot exists (T018–T020)
3. Polish (T021–T024) runs after all desired stories validate

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- YAGNI exclusions (do NOT build): `GET /api/day-view`, `GET /api/schedule-x/validate`, schema mapper, date-picker wiring, event-modal/drag plugins, gesture/animation library, new store/composable
- Field constraints quoted verbatim from `frontend/src/types/api.ts`: `scheduledDate?: string | null`, `duration?: string | null`, `status: TaskStatus`, `deadline: string`, `category` is `"task"` or `"event"`
- Verify specs fail before implementing; commit after each task or logical group
- Stop at any checkpoint to validate the story independently
