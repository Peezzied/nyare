# Quickstart: Validate Exclude Note From AI Processing

## Prerequisites

- Backend and frontend run as in `AGENTS.md` (`./gradlew bootRun` in `app/`, `npm run dev` in `frontend/`).
- One user with one active course and two unprocessed notes.

## Automated checks (narrowest first)

1. Backend repository: `./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest"`
2. Backend service: `./gradlew test --tests "group.four.nyare.nyare.service.NoteServiceImplTest"`
3. Frontend unit: `npx vitest run src/utils/__tests__/noteStatus.spec.ts src/views/__tests__/NoteEditor.spec.ts` (in `frontend/`)
4. Frontend static: `npm run type-check` and `npm run lint:oxlint`

Run one integration test at a time and ask before more.

## Manual scenarios

1. Open a saved note. Turn on "Skip AI processing". Save. Reload.
   Expected: toggle is on. Badge reads "Skipped by AI". (US2)
2. Open the Process dialog.
   Expected: the pending count excludes that note. (US1, SC-003)
3. Run Process.
   Expected: no task, event, or context links to the excluded note. (SC-002)
4. Edit the excluded note content. Save.
   Expected: still excluded. Pending count unchanged. (FR-005)
5. Turn the toggle off. Save.
   Expected: note counts as pending again. (US3)
6. Restart the backend against an existing database.
   Expected: old notes load with the toggle off. (FR-010)
