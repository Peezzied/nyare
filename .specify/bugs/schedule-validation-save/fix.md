# Bug Fix: Preserve Saved Course on Discard and Stop Spurious Discard Prompt

- **Slug**: schedule-validation-save
- **Fixed**: 2026-10-17T17:46:38Z
- **Assessment**: ./assessment.md
- **Status**: applied

## Summary

`handleDiscard()` now restores the last saved snapshot instead of blanking the form. The week preview combines the active draft with all staged courses. `stageCourse()` updates an existing draft when the `tempId` matches.

## Changes

| File | Change | Notes |
|------|--------|-------|
| `frontend/src/views/CreateScheduleView.vue` | modified | `handleDiscard` restores snapshot or staged draft. `previewBlocks` includes staged courses. `loadCourseDraft` added. `hasUnsavedChanges` ignores the untouched pending slot. Debug `console.log` removed. Snapshot typed as `SavedSnapshot` (no `any`). |
| `frontend/src/composables/useCourseDrafts.ts` | modified | `stageCourse()` updates an existing draft and replaces its schedules when `tempId` matches. |
| `frontend/src/views/__tests__/CreateScheduleView.spec.ts` | modified | Added discard/save regression tests. Mocked `vue-sonner`. Fixed discard emission. Debug `console.log` removed. |
| `frontend/src/composables/__tests__/useCourseDrafts.spec.ts` | modified | Added `stageCourse()` update test. |
| `frontend/src/components/WeekPreview.vue` | modified (reverted) | Restored the `#headerContent` blanking that was in HEAD. See Deviations. |

## Diff Highlights

```ts
function handleDiscard() {
  discardPendingSlot()
  const staged = currentDraftTempId.value
    ? draftCourses.value.find((c) => c.tempId === currentDraftTempId.value)
    : undefined
  if (isSaved.value && lastSavedSnapshot.value) {
    const saved = JSON.parse(lastSavedSnapshot.value) as SavedSnapshot
    courseName.value = saved.name || ''
    // rebuild blocks from saved.blocks, state 'saved'
  } else if (staged) {
    loadCourseDraft(staged)
  } else {
    resetFormState()
  }
  showDiscardDialog.value = false
  closeImmediately()
}
```

```ts
function stageCourse(course: DraftCourse) {
  const existingIndex = draftCourses.value.findIndex((c) => c.tempId === course.tempId)
  if (existingIndex >= 0) {
    draftCourses.value[existingIndex] = course
    draftSchedules.value = draftSchedules.value.filter((s) => s.tempId !== course.tempId)
  } else {
    draftCourses.value.push(course)
  }
  // ...
}
```

## Tests Added or Updated

- `frontend/src/views/__tests__/CreateScheduleView.spec.ts::reverts to saved snapshot on discard without clearing course from week view` — discard restores the saved form and keeps the course in the preview.
- `frontend/src/views/__tests__/CreateScheduleView.spec.ts::does not show discard dialog when opening and dismissing saved course without edits` — no prompt after a clean save.
- `frontend/src/views/__tests__/CreateScheduleView.spec.ts::includes other staged courses from useCourseDrafts in week preview blocks` — staged courses render in the preview.
- `frontend/src/composables/__tests__/useCourseDrafts.spec.ts::updates an existing course and replaces its schedules when tempId matches` — no duplicate drafts.

## Local Verification

- Commands run:
  - `npx vitest run src/views/__tests__/CreateScheduleView.spec.ts` → 33 passed.
  - `npx vitest run src/composables/__tests__/useCourseDrafts.spec.ts src/components/__tests__/TimeBlockCard.spec.ts src/components/__tests__/WeekPreview.spec.ts` → 17 passed.
  - `npx vitest run` → 43 files, 449 passed.
  - `npm run type-check` → exit 0, no type errors.
  - `npm run lint:oxlint` → 0 errors, 0 warnings.
  - `npx eslint --no-cache src/views/CreateScheduleView.vue src/composables/useCourseDrafts.ts src/components/WeekPreview.vue` → 0 errors.
- Manual checks: none beyond the automated tests.

## Deviations from Assessment

1. **WeekPreview header restored.** The working tree had removed `<template #headerContent><span /></template>` from `WeekPreview.vue`. That line exists in HEAD and the CSS already hides `.sx__calendar-header`, so removal was redundant. It exposed a schedule-x date input that made `input[type="text"]` match the wrong element and broke 14 tests. Restored the line to fix them. `WeekPreview.vue` now matches HEAD.
2. **Leftover debug removed.** A `console.log` in `submit()` and one in the spec were removed.
3. **Test emit fixed.** The new discard test emitted `confirm`, an event the dialog does not define. Changed to `discard`.
4. **Staged-course preview lives in `CreateScheduleView`.** The assessment item 4 named `WeekPreview`, but the preview blocks are computed in `CreateScheduleView.previewBlocks`. Applied there.
5. **Snapshot typed.** Added a `SavedSnapshot` interface to remove a new `@typescript-eslint/no-explicit-any` error introduced by the fix.
6. **Pre-existing lint debt.** `src/**/__tests__/*` already had `no-explicit-any` errors at HEAD (8 in `CreateScheduleView.spec.ts`). New tests follow the file convention (`as any`). Not fixed here.

## Follow-ups

- Run `/speckit-bug-test slug=schedule-validation-save` to validate the resolution.
- Resolve the repository-wide `no-explicit-any` lint failures in test files, or disable the rule for `__tests__`.
