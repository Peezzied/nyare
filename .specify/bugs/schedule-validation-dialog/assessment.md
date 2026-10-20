# Bug Assessment: Discard Changes Dialog Displays Without User Edits

- **Slug**: schedule-validation-dialog
- **Created**: 2026-10-18T00:00:00Z
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: medium

## Report (verbatim or summarized)

> "the discard changes dialog still shows even tho there's no changes has been made yet slug=\"schedule-validation-dialog\""

## Symptom

The application shows the "Discard changes?" confirmation dialog when a user dismisses the schedule creation drawer immediately after opening it. The system must close the drawer without a confirmation prompt when the user has not edited the draft.

## Reproduction

1. Open the schedule creation view or calendar preview.
2. Click an empty time slot on `WeekPreview` to open the drawer.
3. Click the close button `X` or drag down to dismiss the drawer without typing or editing fields.
4. Observe the unexpected "Discard changes?" modal dialog.

## Suspected Code Paths

- `frontend/src/views/CreateScheduleView.vue:356-362` — `hasUnsavedChanges` returns `true` because slot prefill marks days and times as populated.
- `frontend/src/views/CreateScheduleView.vue:252-292` — `handleSelectSlot()` copies slot day, start time, and end time directly into `blocks.value[0]`.
- `frontend/src/views/CreateScheduleView.vue:209-228` — `onOpenChange()` inspects `hasUnsavedChanges` and displays `DiscardDraftConfirmDialog`.
- `frontend/src/views/CreateScheduleView.vue:443-449` — `goBack()` inspects `hasUnsavedChanges` and displays `DiscardDraftConfirmDialog`.
- `frontend/src/views/CreateScheduleView.vue:451-462` — `closeImmediately()` discards `pendingSlot` but the flow never executes it when `hasUnsavedChanges` evaluates to `true`.

## Root Cause Hypothesis

`CreateScheduleView` pre-populates block values when a user selects a calendar slot. `hasUnsavedChanges` checks if any block contains selected days or time values (`blocks.value.some((b) => b.selectedDays.length > 0)`). Because calendar slot selection immediately fills these fields, `hasUnsavedChanges` becomes `true` before the user edits any data. Confidence: high.

## Proposed Remediation

**Preferred**: Update `hasUnsavedChanges` in `CreateScheduleView.vue`. Check whether populated values originate only from an unedited `pendingSlot`. If `courseName` remains empty, the block list contains only the single pending slot block, and no save errors exist, evaluate `hasUnsavedChanges` to `false`. When the user closes the view, `closeImmediately()` will invoke `discardPendingSlot()` and close cleanly.

**Alternatives**:
- Track a dedicated `isUserDirty` boolean ref that toggles `true` only when the user manually modifies inputs. Trade-off: Requires manual event listeners on all input fields.

**Files likely to change**:
- `frontend/src/views/CreateScheduleView.vue`
- `frontend/src/views/__tests__/CreateScheduleView.spec.ts`

**Tests to add or update**:
- Assert that selecting a calendar slot on an empty form leaves `hasUnsavedChanges` false until manual edits occur.
- Assert that closing the drawer after selecting an untouched slot does not show `DiscardDraftConfirmDialog`.

## Risks & Considerations

- Ensure intentional user modifications to the selected time block still trigger the confirmation prompt.
- Ensure adding a second block or typing a course title triggers the confirmation prompt.

## Open Questions

- None. The issue reproduces consistently from static code analysis and tests.
