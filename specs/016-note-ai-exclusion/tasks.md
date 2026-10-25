---

description: "Task list for Exclude Note From AI Processing"
---

# Tasks: Exclude Note From AI Processing

**Input**: Design documents from `/specs/016-note-ai-exclusion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/note-api.contract.md, quickstart.md

**Tests**: Included. The plan and constitution require evidence-first verification. Write each test before its code and see it fail.

**Organization**: Tasks group by user story. Paths come from `plan.md`. Backend root: `app/src/main/java/group/four/nyare/nyare/`. Frontend root: `frontend/src/`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on open tasks)
- **[Story]**: US1, US2, US3

---

## Phase 1: Setup

- [x] T001 Add the shadcn-vue `Switch` component. Run `npx shadcn-vue@latest add switch` in `frontend/`. Confirm `frontend/src/components/ui/switch/` exists and uses `reka-ui`. Do not add other components.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: Carry the flag through entity, DTOs, service, and client types.

- [x] T002 Add field `excludedFromAi` to `app/src/main/java/group/four/nyare/nyare/model/Note.java`. Use `@Column(name = "excluded_from_ai", nullable = false, columnDefinition = "BOOLEAN NOT NULL DEFAULT 0")`. Type `boolean`, default `false`. Add `isExcludedFromAi()` and `setExcludedFromAi(boolean)` with the existing Javadoc style.
- [x] T003 [P] Add `private Boolean excludedFromAi` (nullable, no validation annotation) with getter and setter to `app/src/main/java/group/four/nyare/nyare/dto/NoteRequest.java`. Do not change existing constructors.
- [x] T004 [P] Add `private boolean excludedFromAi` with getter and setter to `app/src/main/java/group/four/nyare/nyare/dto/NoteResponse.java`. Keep all existing constructors. Make the full 8-argument constructor delegate to a new 9-argument constructor that adds `boolean excludedFromAi` (default `false`). Do not touch `NoteSummaryResponse`.
- [x] T005 Update `app/src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java` (depends on T002, T003, T004). In `createNote`, call `note.setExcludedFromAi(Boolean.TRUE.equals(request.getExcludedFromAi()))`. In `updateNote`, call `note.setExcludedFromAi(...)` only when `request.getExcludedFromAi() != null` (null keeps the stored value). In `toResponse`, pass `note.isExcludedFromAi()` to the new `NoteResponse` constructor.
- [x] T006 [P] Update `frontend/src/types/api.ts`. Add `readonly excludedFromAi: boolean` to `NoteResponse`. Add `readonly excludedFromAi?: boolean | null` to `NoteRequest`. Add a one-line doc comment on each. Do not change `NoteSummaryResponse`.
- [x] T007 Fix compile and fixture breaks from T006. Add `excludedFromAi: false` to each `NoteResponse` literal in `frontend/src/views/__tests__/NoteEditor.spec.ts` and `frontend/src/composables/__tests__/useNotes.spec.ts`. Run `npm run type-check` in `frontend/` and confirm no error.

**Checkpoint**: Run `./gradlew compileJava` in `app/`. It must pass.

---

## Phase 3: User Story 1 - Exclude a note from processing (Priority: P1) MVP

**Goal**: The student turns on "Skip AI processing" and Process ignores the note.

**Independent Test**: Quickstart scenarios 1 to 4. Pending count and Process skip the excluded note.

### Tests for User Story 1 (write first, confirm they fail)

- [x] T008 [P] [US1] Add repository tests to `app/src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`. Name them `findDirtyNotes_excludedNote_isNotReturned` and `findDirtyNotes_byDate_excludedNote_isNotReturned`. Save one excluded and one included unprocessed note. Assert both `findDirtyNotes(userId, false)` and `findDirtyNotes(userId, date, false)` return only the included note. Use `// given/when/then` and AssertJ.
- [x] T009 [P] [US1] Add service tests to `app/src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java` (create the file if it does not exist, following the Mockito `@Mock` + `@InjectMocks` style of other `*ImplTest` files). Cases: `createNote_excludedTrue_persistsFlag`, `createNote_excludedNull_defaultsFalse`, `updateNote_excludedNull_keepsStoredValue`, `updateNote_excludedTrue_setsFlag`, `updateNote_otherUsersNote_throwsResourceNotFound`.
- [x] T010 [P] [US1] Add editor tests to `frontend/src/views/__tests__/NoteEditor.spec.ts`. Cases: toggle renders with `data-testid="skip-ai-switch"`, turning it on enables Save, and Save sends `excludedFromAi: true` in the update payload. Also test that the toggle is disabled for an archived course.

### Implementation for User Story 1

- [x] T011 [US1] Add `AND n.excludedFromAi = false` to both `findDirtyNotes` `@Query` strings in `app/src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`. Update the two Javadoc `@return` lines to say "dirty, non-excluded notes". Do not edit the default date helper.
- [x] T012 [US1] In `frontend/src/views/NoteEditor.vue`, add `excludedFromAi` state. Add `const excludedFromAi = ref(false)`. Include it in `getCurrentState()`, `initialState`, and `isEqualState` so `isDirty` covers it. Set it in `loadNote` from `note.excludedFromAi`. Send it in the `payload` object in `saveNote`. Reset `initialState` after save as the existing code does.
- [x] T013 [US1] In `frontend/src/views/NoteEditor.vue`, add the toggle row to the "Plan zone" card, below the date row and after a `<div class="h-px bg-ghost" />` divider. Import `Switch` from `@/components/ui/switch` and `Label` from `@/components/ui/label`. Use a lucide icon (`Sparkles`) in `text-text-muted`, `data-testid="skip-ai-row"`, `min-h-11`, label "Skip AI processing", helper text "Nyare ignores this note when you process." Bind `v-model="excludedFromAi"` to the `Switch` with `data-testid="skip-ai-switch"` and `:disabled="isArchivedCourse"`. Wire `Label` `for` to the switch `id` so the whole row is the touch target. Follow `DESIGN.md` tokens. Do not add colors outside existing tokens.
- [x] T014 [US1] Run T008, T009, and T010. All must pass: `./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest"`, `./gradlew test --tests "group.four.nyare.nyare.service.NoteServiceImplTest"`, and `npx vitest run src/views/__tests__/NoteEditor.spec.ts`.

**Checkpoint**: US1 works alone. The student can exclude a note and Process ignores it.

---

## Phase 4: User Story 2 - See the exclusion state (Priority: P2)

**Goal**: The editor status badge reads "Skipped by AI" for a saved excluded note.

**Independent Test**: Quickstart scenario 1. Reopen the editor and read the badge.

### Tests for User Story 2

- [x] T015 [P] [US2] Add cases to `frontend/src/utils/__tests__/noteStatus.spec.ts`. Test that `getNoteProcessingStatus({ isSaved: true, excludedFromAi: true, lastProcessedAt: null })` returns `skipped`. Test that `excludedFromAi: true` wins over `dirty` and `unprocessed`. Test that an unsaved note with `excludedFromAi: true` still returns `draft`. Test that `getNoteStatusConfig('skipped').label` is `Skipped by AI`.

### Implementation for User Story 2

- [x] T016 [US2] Update `frontend/src/utils/noteStatus.ts`. Add `'skipped'` to `NoteProcessingStatus`. Add `readonly excludedFromAi?: boolean` to `NoteStatusInput`. In `getNoteProcessingStatus`, return `'skipped'` after the `!isSaved` check and before the `lastProcessedAt` check. Add a `skipped` case to `getNoteStatusConfig` with label `Skipped by AI` and a neutral class set (`border-[#CBD5E1] bg-[#F1F5F9] text-[#527A8C]`, the existing slate pair). Update the JSDoc list.
- [x] T017 [US2] In `frontend/src/views/NoteEditor.vue`, pass `excludedFromAi: excludedFromAi.value` into `getNoteProcessingStatus`. Add the `skipped` case to the `statusIcon` switch (use `EyeOff` from lucide). Confirm the footer badge renders the label.
- [x] T018 [US2] Add an editor test in `frontend/src/views/__tests__/NoteEditor.spec.ts` that loads an excluded note and expects the toggle on and the badge text "Skipped by AI". Run `npx vitest run src/utils/__tests__/noteStatus.spec.ts src/views/__tests__/NoteEditor.spec.ts`.

**Checkpoint**: US1 and US2 work.

---

## Phase 5: User Story 3 - Re-enable processing (Priority: P2)

**Goal**: Turning the toggle off makes a changed note pending again.

**Independent Test**: Quickstart scenario 5.

### Tests for User Story 3

- [x] T019 [P] [US3] Add `findDirtyNotes_afterExclusionCleared_returnsNote` to `app/src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`. Save an excluded unprocessed note, set the flag to `false`, save, and assert `findDirtyNotes(userId, false)` returns it. Add a second case where `lastProcessedAt` is later than `updatedAt` and the flag is cleared without an `updatedAt` change. Assert it is not returned. This documents that pending state follows the existing rule.
- [x] T020 [P] [US3] Add an editor test in `frontend/src/views/__tests__/NoteEditor.spec.ts`. Load an excluded note, turn the toggle off, Save, and assert the payload has `excludedFromAi: false` and the badge no longer reads "Skipped by AI".

### Implementation for User Story 3

- [x] T021 [US3] Run T019 and T020. Expect pass without new production code, because the T011 filter and the T012 payload already cover re-enable. If a test fails, fix the root cause in the file the test names. Do not add code for it otherwise.

**Checkpoint**: All three stories work.

---

## Phase 6: Polish

- [x] T022 [P] Run `npm run lint:oxlint` and `npm run type-check` in `frontend/`. Fix every error in files this feature touched.
- [x] T023 [P] Run `npm run format` in `frontend/` and confirm only touched files change.
- [x] T024 Run `./gradlew compileJava` in `app/`.
- [x] T025 Run the dev server and check the editor at a 390 px viewport and a desktop viewport once, following `quickstart.md` scenarios 1 to 5. Record any visual defect and fix it in one batch.
- [ ] T026 Ask the user before running any integration test. If approved, run exactly one: `StudyPlannerControllerIntegrationTest` with a test that excludes one of two pending notes.

---

## Dependencies & Execution Order

- Phase 1 has no dependency. Phase 2 follows Phase 1 for T006 and T007 only. T002 to T005 do not need T001.
- T005 needs T002, T003, T004. T007 needs T006.
- Phase 3 to 5 need Phase 2.
- US1 needs T011 to T013. US2 needs T012 (state) and T013 (UI) for T017. US3 needs T011 and T012.
- T014, T018, T021 are checkpoints and run after their phase tasks.
- Polish runs last.

## Parallel Opportunities

- T003, T004, T006 touch different files and run together after T002.
- T008, T009, T010 run together.
- T015, T019, T020 run together with other-phase work once Phase 2 ends.
- T022 and T023 run together.

```text
After T002:   T003 + T004 + T006
US1 tests:    T008 + T009 + T010
Polish:       T022 + T023
```

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 and Phase 2.
2. Phase 3 (US1). Stop and run quickstart scenarios 1 to 4.
3. Demo. The student can already exclude notes.

### Incremental Delivery

1. Add US2 (badge). Verify scenario 1 again.
2. Add US3 (re-enable tests). Verify scenario 5.
3. Polish.

## Notes

- Do not add an endpoint, a list indicator, or an "invalidate" path. They are out of scope.
- Follow `ponytail` rules. Reuse the existing status badge and Plan zone card.
- Run one Gradle test class at a time.
- Commit only on user request, with `git caveman-commit`.
