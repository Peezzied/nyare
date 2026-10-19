# Bug Verification: Saved Course Survives Discard and No Spurious Discard Prompt

- **Slug**: schedule-validation-save
- **Tested**: 2026-10-17T17:53:30Z
- **Assessment**: ./assessment.md
- **Fix**: ./fix.md
- **Result**: verified

## Summary

The fix holds. Discarding edits on a saved course restores the saved snapshot and keeps the course in the week preview. Dismissing a clean saved draft shows no discard dialog. No regressions found.

## Checks Performed

| Check | Command / Action | Result | Notes |
|-------|------------------|--------|-------|
| Reproduction (post-fix) | `npx vitest run src/views/__tests__/CreateScheduleView.spec.ts` | pass | Automated equivalent of steps 1-7: saved course retained after discard, no dialog on clean dismiss. |
| New / updated tests | `npx vitest run src/views/__tests__/CreateScheduleView.spec.ts src/composables/__tests__/useCourseDrafts.spec.ts` | pass | 37 passed across both files. |
| Regression suite | `npx vitest run` | pass | 43 files, 449 tests passed. |
| Type-check | `npm run type-check` | pass | `vue-tsc --build` exit 0. |
| Lint (fast) | `npm run lint:oxlint` | pass | exit 0. |

## Output Excerpts

```
Test Files  2 passed (2)
     Tests  37 passed (37)
```

```
Test Files  43 passed (43)
     Tests  449 passed (449)
```

## Residual Risks

- Verification is at component-test level (Vue Test Utils + jsdom). No manual browser run was performed. The tests mount `CreateScheduleView`, exercise the save, edit, go-back, and discard paths, and assert on real `useCourseDrafts` state and `WeekPreview` props.
- `npm run lint:eslint` still reports pre-existing `no-explicit-any` errors in `src/**/__tests__/*` (present at HEAD). Not caused by this fix.

## Recommendation

Close the bug — verified end-to-end at the component-test level with the full regression suite green. Optional follow-up: confirm the flow once in a real browser, and clear the pre-existing test lint debt.
