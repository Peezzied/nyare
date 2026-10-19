# Bug Fix: Exclude Untouched Pending Slot from Discard Confirmation

- **Slug**: schedule-validation-dialog
- **Fixed**: 2026-10-18T00:05:00Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

Updated `hasUnsavedChanges` to recognize unedited prefilled slots. The schedule creation view now closes without prompting when users dismiss an untouched slot.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/views/CreateScheduleView.vue` | modified | Exclude untouched single `pendingSlot` block from `hasUnsavedChanges`. |
| `frontend/src/views/__tests__/CreateScheduleView.spec.ts` | modified | Assert dialog stays closed on untouched slot and opens on edited slot. |

## Diff Highlights

```ts
  if (
    pendingSlot.value &&
    pendingBlockId.value &&
    blocks.value.length === 1 &&
    blocks.value[0]?.id === pendingBlockId.value
  ) {
    const block = blocks.value[0]
    const matchesPendingDays =
      block.selectedDays.length === 1 && block.selectedDays[0] === pendingSlot.value.day
    const matchesPendingTimes =
      block.startTime === pendingSlot.value.startTime &&
      block.endTime === pendingSlot.value.endTime
    if (matchesPendingDays && matchesPendingTimes) {
      return false
    }
  }
```

## Tests Added or Updated

- `frontend/src/views/__tests__/CreateScheduleView.spec.ts::clears pendingSlot and discards pending draft when drawer closes without saving` — Verifies dialog stays closed and pending slot clears on exit.
- `frontend/src/views/__tests__/CreateScheduleView.spec.ts::shows discard dialog when closing after user modified a prefilled slot` — Verifies dialog opens if the user alters prefilled slot times.

## Local Verification

- Commands run:
  - `npx vitest run src/views/__tests__/CreateScheduleView.spec.ts` → 30 tests passed.
  - `npm run lint:oxlint` → 0 errors, 0 warnings.
  - `npm run type-check` → exited 0 with no type errors.
- Manual checks: Verified `hasUnsavedChanges` returns `false` on untouched slots and `true` when edited.

## Deviations from Assessment

None.

## Follow-ups

- Run `/speckit-bug-test slug=schedule-validation-dialog` to validate the resolution.
