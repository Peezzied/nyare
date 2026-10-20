# Quickstart: Create Schedule Week Calendar Preview

## Prerequisites

- Node per `frontend/package.json` engines (22.18+ or 24.12+).
- Run commands inside `frontend/`.
- The backend on port 8080 is optional for the pure helper tests.

## 1. Unit Tests (smallest scope first)

The preview derives from pure helpers. Test the helpers first.

```bash
npx vitest run src/components/__tests__/week-preview.spec.ts
```

Expected cases:

- `derivePreviewBlocks`:
  1. One block with Monday and Wednesday and valid times yields two preview blocks.
  2. A block with no weekday yields no preview block.
  3. An empty start time, an empty end time, or a start time that is not before the end time yields no preview block.
  4. A whitespace-only name yields a block with an empty title.
  5. The empty name is trimmed for a normal name.
  6. The block color equals the passed `solid` value.
- `slotFromOffset`:
  1. A tap in column 2 at the second hour yields `day: TUESDAY`, `startTime: '02:00'`, `endTime: '03:00'` (with `HOUR_HEIGHT = 80`).
  2. A tap at the last hour clamps the start hour to 23 and yields `endTime: '24:00'`.
  3. A tap outside the grid returns `null`.

## 2. Component Test (optional)

```bash
npx vitest run src/components/__tests__/WeekPreview.spec.ts
```

Expected cases:

- The header shows the seven weekday labels and no date.
- A `PreviewBlock` shows its title in its column.
- A tap on empty space emits `selectSlot` with the tapped day and time.
- A tap on a block emits `selectBlock` with the block id.

## 3. Inner-Loop Lint and Type Check

```bash
npx oxlint src/ --fix
npm run type-check
```

## 4. Manual Mobile Check

1. Run `npm run dev`.
2. Open the create schedule sheet.
3. Enter the name `CS 101` and pick a color.
4. Select Monday and set 09:00 to 10:00. Confirm one block on Monday, from 09:00 to 10:00, in the chosen color.
5. Change the end time. Confirm the block resizes.
6. Add Wednesday. Confirm a second block.
7. Confirm the header shows the seven weekday names and no date.
8. Tap an empty slot. Confirm the slot outline covers one hour. Confirm the sheet opens prefilled with the tapped day and time.
9. Tap an existing block. Confirm the sheet opens to edit that block and starts no new class time.
10. Close the sheet without a save. Confirm the outline clears and the form adds no class time.

## Expected Outcomes

- The preview shows the weekly shape of the draft course before the save (SC-001).
- Every form change appears in the preview with no save and no reload (SC-002).
- Every block shows the name only. No header cell shows a date (SC-003).
- The preview adds no save delay and changes no stored schedule (SC-005).
