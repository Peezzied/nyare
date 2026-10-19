# Research: Create Schedule Week Calendar Preview

## 1. Preview Component Boundary

### Decision
Build one new component, `src/components/WeekPreview.vue`. The component renders a seven-column grid and an hourly time axis. It draws one rectangle per `PreviewBlock`. It emits `selectSlot` on an empty tap and `selectBlock` on a block tap.

### Rationale
- The preview shows one course only. It shows no tasks, no untimed items, and no dates.
- The grid must accept tap coordinates. The tap maps to a weekday and a starting hour.
- The block color must use the student's selected palette color. The palette has 24 colors.

### Alternatives Considered
- **Reuse `WeekCalendar.vue` (schedule-x)**: Rejected. It renders dates in `WeekHeaderRow`, it binds `untimedFor` items, it carries tasks, and its `DayEvent.colorTheme` holds only four themes (`green`, `blue`, `purple`, `orange`). It also runs a swiper and drag-capable grid. The preview needs none of that, and the mismatch would force edits to the real calendar.
- **Reuse `WeekPill.vue` directly as the block**: Rejected. A pill is a flow-layout element. The preview needs absolute placement by start time and end time. Keep the pill's visual style instead: small radius, `border-[1.5px]`, and a truncated bold title.
- **Reuse native `<input type="time">` grid only**: Existing and kept. The time inputs stay in `TimeBlockCard.vue`. The preview is the visual layer above them.

---

## 2. Block Derivation

### Decision
Add one pure function, `derivePreviewBlocks(blocks, name, color)`, in `src/utils/weekPreview.ts`. Input: the form `TimeBlockDraft[]`, the course name, and the selected palette color. Output: `PreviewBlock[]`.

Rules:
- One `PreviewBlock` for each pair of (time block, selected weekday).
- Skip a time block with no selected weekday.
- Skip a time block with an empty start time, an empty end time, or a start time that is not before the end time.
- Trim the name. An empty or whitespace-only name yields an empty block title.
- The block title equals the trimmed name. Clip long names with CSS only.

### Rationale
- The function is pure. A unit test verifies every edge case with no DOM.
- The function keeps `CreateScheduleView.vue` free of derivation code.

### Alternatives Considered
- **Derive inside `WeekPreview.vue`**: Rejected. The component would then own form semantics. Keep the component presentational and the derivation shared.
- **Derive from `ScheduleResponse[]`**: Rejected. The form holds drafts before a save. No schedule records exist yet.

## 3. Tap to Time Mapping

### Decision
Add one pure function, `slotFromOffset(offsetX, offsetY, gridWidth)`, in `src/utils/weekPreview.ts`. It returns `{ day, startTime, endTime }` or `null`.
- The weekday index equals `floor(offsetX / (gridWidth / 7))`. Index 0 is Sunday, per `WEEKDAYS`.
- The start hour equals `floor(offsetY / HOUR_HEIGHT)`, snapped down.
- The end hour equals the start hour plus one. Clamp the start hour to 23, so the outline stays inside a 24-hour axis (FR-018).
- A tap outside the axis bounds returns `null` (spec edge case).

### Rationale
- `HOUR_HEIGHT` already equals 80 in `src/constants/calendar.ts`. The math needs no new constant.
- The tapped slot covers one hour. The outline reuses the same value. The form prefills the same value.

### Alternatives Considered
- **Snap up or to 30 minutes**: Rejected. The clarification states a one-hour slot snapped down to the tapped hour.
- **Reuse the schedule-x click handler**: Rejected. The schedule-x grid uses its own event model and no shared helper.

## 4. Color Source

### Decision
Use the selected `CoursePaletteColor.solid` value from `COURSE_PALETTE_24` as the block background. Read it from the existing `selectedColor` computed in `CreateScheduleView.vue`.

### Rationale
- The palette already holds all 24 colors with a `solid` hex value.
- The block uses the exact color the student picks. The schedule-x four-theme limit does not apply.

## 5. Bottom-Sheet Integration

### Decision
Replace the blank root background in `CreateScheduleView.vue` (`bg-[#F6F7EE]` at line 341) with `WeekPreview`. Keep the existing `Drawer`, the `partial` and `full` stages, and the save flow.
- On `selectSlot`: add a `TimeBlockDraft` with the tapped day and time, set `pendingSlot`, and set the stage to `partial`.
- On `selectBlock`: focus the matching time block and open the sheet. Start no new class time.
- On sheet close without a save: clear `pendingSlot` and discard the pending draft.

### Rationale
- `CreateScheduleView` is already a bottom sheet. It already switches between a partial and a full stage. The spec asks for the same behavior (FR-019).
- The other mount point in `DayViewContainer.vue` (line 165) keeps working. Both callers use the same component.

### Alternatives Considered
- **A new route or a new view**: Rejected. The route `/create-schedule` and the inline mount already exist.
- **A second bottom sheet over the form**: Rejected. The form is the bottom sheet. One sheet is enough.

## 6. Time Axis Range

### Decision
Render the full 24-hour axis. `HOUR_HEIGHT` fixes the row height. The grid scrolls vertically. On mount and on a tap, scroll the axis to the earliest block or the tapped slot.

### Rationale
- A full axis always covers every selected time and the tapped slot (FR-016).
- The real day and week calendars already use a full axis with vertical scroll.
- Vertical scroll is allowed. FR-014 forbids only horizontal scrolling.

### Alternatives Considered
- **A bounded school-day range with computed bounds**: Rejected. It adds boundary math and can clip an early or late class.

## 7. Header

### Decision
Render seven weekday labels from `WEEKDAYS` in `TimeBlockCard.vue`. Show the two-letter labels only. Show no date number.

### Rationale
- `WEEKDAYS` already holds the labels `Su` through `Sa` with `DayOfWeek` values.
- FR-006 forbids dates. `WeekHeaderRow.vue` shows dates. Do not reuse it.
