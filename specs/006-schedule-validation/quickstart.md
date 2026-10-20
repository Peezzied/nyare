# Quickstart: Schedule Creation Validation

## Prerequisites

- Node per `frontend/package.json` engines (22.18+ or 24.12+).
- Run commands inside `frontend/`.
- The backend on port 8080 is optional for the pure helper tests.
- The stored catalog must hold one course with one class time for the manual checks.

## 1. Unit Tests (smallest scope first)

The checks derive from pure helpers. Test the helpers first.

```bash
npx vitest run src/utils/__tests__/scheduleValidation.spec.ts
```

Expected cases:

- `timeToMinutes`:
  1. `"09:00"` yields `540`.
  2. `"09:00:00"` yields `540`.
  3. `""` and `"bad"` yield `NaN`.
- `rangesOverlap`:
  1. `09:00-10:00` against `09:30-10:30` yields `true`.
  2. `09:00-10:00` against `10:00-11:00` yields `false` (adjacent).
  3. `09:00-10:00` against `14:00-15:00` yields `false`.
- `findDuplicateName`:
  1. `"cs 101"` matches a known `"CS 101"`.
  2. `"CS 101 "` matches a known `"CS 101"`.
  3. `"Math 201"` against a known `"CS 101"` yields `null`.
- `findClash`:
  1. A Monday `09:30-10:30` candidate clashes with a Monday `09:00-10:00` known class.
  2. A Tuesday candidate does not clash with a Monday known class.
- `unavailableDaysFor`:
  1. A `09:30-10:30` block marks Monday unavailable when a Monday `09:00-10:00` class exists.
  2. A sibling block that overlaps on Wednesday marks Wednesday unavailable.
  3. An empty start time yields `[]`.

## 2. Component Tests

```bash
npx vitest run src/components/__tests__/DiscardDraftConfirmDialog.spec.ts src/components/__tests__/TimeBlockCard.spec.ts
```

Expected cases:

- The dialog shows the two actions and emits `keepEditing` and `discard`.
- `TimeBlockCard` disables a weekday in `unavailableDays` and emits no `toggleDay` for it.

## 3. View Tests

```bash
npx vitest run src/views/__tests__/CreateScheduleView.spec.ts
```

Expected cases:

- A duplicate title blocks the save with the duplicate message.
- A clashing block blocks the save and names the clash.
- All seven weekdays clashing disables add-another-time.
- A close with unsaved work shows the dialog. "Discard" resets the form and closes.

## 4. Inner-Loop Lint and Type Check

```bash
npx oxlint src/ --fix
npm run type-check
```

## 5. Manual Mobile Check

1. Run `npm run dev`.
2. Stored catalog has `CS 101` at Monday 09:00-10:00.
3. Open the create schedule sheet. Enter the title `cs 101`. Confirm the save is blocked with the duplicate message.
4. Change the title to `Math 201`. Select Monday. Set 09:30-10:30. Confirm Monday is unavailable and cannot be selected.
5. Set 10:00-11:00. Confirm Monday is selectable (adjacent times do not clash).
6. Add another time. Set 09:30-10:30. Confirm Monday is unavailable in the second block (cross-block overlap).
7. Set the second block to a time that clashes on all seven weekdays. Confirm add-another-time is disabled.
8. Enter a valid title and time. Save. Confirm the draft is staged and the known set now includes it.
9. Type a title, then close the sheet with the X button. Confirm the keep-editing or discard dialog appears.
10. Choose "Keep editing". Confirm the sheet stays open with the draft intact.
11. Close again. Choose "Discard". Confirm the sheet closes and the form is blank.

## Expected Outcomes

- Every duplicate-name save is blocked with a clear message (SC-001).
- Every same-weekday overlap across known courses is caught before a save (SC-002).
- No valid schedule is blocked: adjacent times and shared weekdays pass (SC-003).
- Every unavailable weekday is visible before the save (SC-004).
- The student finishes a valid setup with no reload (SC-005).
- Every close with unsaved work shows the dialog. An untouched or saved close shows none (SC-006).
