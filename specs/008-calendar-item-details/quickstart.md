# Quickstart Validation Guide: Calendar Item Details and Week-View Category Markers

**Feature**: Calendar Item Details and Week-View Category Markers
**Target Views**: `/calendar` (day and week modes), Histoire preview
**Date**: 2026-10-18

---

## Prerequisites

1. Install dependencies and start the component preview:
   ```bash
   cd frontend
   npm install
   npm run story
   ```
2. Open the Histoire page for `CalendarItemDetail` and `CategoryMarker`.
3. For the live view, start the dev server and open `/calendar`:
   ```bash
   npm run dev
   ```
   Use a mobile viewport of 390px width.

---

## Validation Scenarios

### Scenario 1: Shared detail component — all states (Priority P1)

1. Open the `CalendarItemDetail` story.
2. **Verify** each state:
   - `task-with-note-and-duration`: note control, complete control, time window, duration.
   - `task-without-note`: no note control (FR-018).
   - `task-without-duration`: no duration field (FR-019).
   - `task-without-scheduled-date`: the plan-category label replaces the time window.
   - `task-completed`: the complete control shows the completed state and is disabled.
   - `class-with-window`: color dot, title, time window, no note, no duration, no complete control.
   - `event-with-note`: note control, time window, no duration (FR-017).
   - `event-without-note`: no note control, no duration.
3. **Verify** that one component renders all three kinds. Confirm no separate task or event component exists.

---

### Scenario 2: Week-view category markers (Priority P1)

1. Open the `CategoryMarker` story and the week view on `/calendar`.
2. **Verify**:
   - A class item shows no indicator and a lower-contrast fill.
   - An event item shows the flag indicator.
   - An open task shows the empty completion box.
   - A completed task shows the checked box.
   - Every item exposes an accessible name that includes the category.
   - A day with more items than the visible limit shows the overflow count and keeps each visible marker.

---

### Scenario 3: Task detail — mark complete from the calendar (Priority P1)

1. In the day view, tap a task in the top strip.
2. **Verify** the modal opens with the shared detail content.
3. Tap the linked note. **Verify** the note editor route opens for that note.
4. Return, then activate the complete control.
5. **Verify**:
   - The task status becomes complete and the calendar reflects the change within 1 second.
   - The client does not refetch the full task list.
   - The control shows the completed state.

---

### Scenario 4: Event detail from the calendar (Priority P2)

1. In the day view, tap an academic event in the top strip.
2. **Verify** the modal shows the linked note and the time window.
3. **Verify** no duration appears.
4. Tap the linked note. **Verify** the note editor route opens.

---

### Scenario 5: Failure and empty states (Priority P2)

1. In the offline mock run, force the task status update to fail.
2. Activate the complete control.
3. **Verify** the control keeps the prior state and an error message appears.
4. Open a task with no source note. **Verify** the note control is absent and the view stays usable.

---

## Code Quality Verification Commands

Run from `frontend/`:

```bash
npm run lint:oxlint
npm run type-check
npx vitest run src/components/day-view/__tests__/CalendarItemDetail.spec.ts
npx vitest run src/components/day-view/__tests__/CategoryMarker.spec.ts
npx vitest run src/utils/__tests__/calendarItemDetail.spec.ts
```

Expected outcome: all commands exit clean. The unit tests cover the builder hide rules (FR-018, FR-019), the event no-duration rule (FR-017), and the marker category mapping (FR-001 through FR-005).
