# Bug Assessment: Discard Dialog Displays and Discarding Clears Saved Week Entries

- **Slug**: schedule-validation-save
- **Created**: 2026-10-18T01:15:00Z
- **Source**: pasted text
- **Verdict**: valid
- **Severity**: high

## Report (verbatim or summarized)

> "the discard dialog shows when opening the course block again after saving. slug=\"schedule-validation-save\""
> "another bug: editing and discarding an entry removes the entry out of the week view. im not sure if it's removed in the memory as well"

## Symptom

When a user edits an existing saved course block and discards changes, the system resets the entire draft to an empty block. The saved course disappears completely from `WeekPreview`. Additionally, dismiss events or outside clicks trigger the discard confirmation unexpectedly on saved drafts.

## Reproduction

1. Open the schedule creation view.
2. Enter a course name and one valid time block with day and time.
3. Click "Confirm" to save the course. The course stages in `useCourseDrafts`.
4. Open the course block again to edit it.
5. Modify a field and trigger dismiss or click "Go back".
6. Confirm "Discard" on the dialog.
7. Observe that the course disappears from `WeekPreview`. In-memory drafts retain the course, but the view erases it.

## Suspected Code Paths

- `frontend/src/views/CreateScheduleView.vue:480-496` — `handleDiscard()` resets `courseName` to `''` and `blocks` to `[createBlock()]` unconditionally, wiping saved entries from the view.
- `frontend/src/views/CreateScheduleView.vue:248-250` — `previewBlocks` computes only from `blocks.value` and active `courseName.value` instead of combining active draft blocks with already staged courses.
- `frontend/src/views/CreateScheduleView.vue:332-346` — `hasUnsavedChanges` compares `current` JSON string against `lastSavedSnapshot`. Any difference triggers the discard dialog on dismiss.
- `frontend/src/views/CreateScheduleView.vue:209-228` — `onOpenChange()` treats taps outside the partial drawer as close events, triggering discard prompts when uncommitted edits exist.
- `frontend/src/composables/useCourseDrafts.ts:23-30` — `stageCourse()` pushes duplicate items if the user edits and re-saves an existing `tempId`.

## Root Cause Hypothesis

`handleDiscard()` resets the active form to blank without checking if the course was already saved. When a user discards edits on an existing saved entry, the form resets to an empty block, which clears `previewBlocks` and removes the course from the week view. Furthermore, `WeekPreview` derives preview blocks only from the active form instead of including other staged courses. Confidence: high.

## Proposed Remediation

**Preferred**:
1. In `CreateScheduleView.vue`, update `handleDiscard()`: if `isSaved.value` is `true` and `lastSavedSnapshot.value` exists, parse `lastSavedSnapshot` and restore the saved form state instead of resetting to a blank form.
2. If `currentDraftTempId.value` matches a course in `draftCourses`, restore the form from that staged course draft.
3. Update `useCourseDrafts.ts` `stageCourse()` to update an existing course with matching `tempId` instead of pushing duplicate records.
4. Ensure `WeekPreview` includes all staged courses from `useCourseDrafts` so saved courses remain visible on the calendar during subsequent edits.

**Alternatives**:
- Require the drawer to close completely upon save, resetting the form for the next course, while `WeekPreview` renders all staged courses. Trade-off: Disallows immediate post-save editing within the same open sheet.

**Files likely to change**:
- `frontend/src/views/CreateScheduleView.vue`
- `frontend/src/composables/useCourseDrafts.ts`
- `frontend/src/views/__tests__/CreateScheduleView.spec.ts`
- `frontend/src/composables/__tests__/useCourseDrafts.spec.ts`

**Tests to add or update**:
- Test that discarding edits on an already saved course reverts to the saved snapshot without removing it from the view.
- Test that `stageCourse()` updates existing drafts when `tempId` matches.
- Test that saved courses remain visible in `WeekPreview` after discard.

## Risks & Considerations

- Restoring snapshots on discard must correctly re-sync schedule drafts and validation state.
- Updating `useCourseDrafts` must preserve schedule entries across multiple course saves.

## Open Questions

- None. The behavior directly traces to `handleDiscard` resetting `blocks.value` and `courseName.value`.
