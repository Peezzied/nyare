# Research: Exclude Note From AI Processing

## Decision 1: Store a boolean on `Note`

- **Decision**: Add `excludedFromAi` (`excluded_from_ai`, `BOOLEAN NOT NULL DEFAULT 0`) to the `Note` entity.
- **Rationale**: The flag belongs to one note. `Note` already follows this pattern with `title` (`columnDefinition` with `DEFAULT`). The default lets `ddl-auto=update` add the column to existing SQLite rows without failure (FR-010).
- **Alternatives**: A separate table (rejected: no second owner of the data). Reuse `lastProcessedAt` as a sentinel (rejected: it hides meaning and breaks re-enable).

## Decision 2: Filter in the two `findDirtyNotes` queries

- **Decision**: Add `AND n.excludedFromAi = false` to both `@Query` methods in `NoteRepository`. The date helper reuses the second query.
- **Rationale**: `StudyPlannerServiceImpl` reads dirty notes only through these queries (status, `processNotes(userId)`, `processNotes(date, userId)`). One filter point covers FR-003 and FR-004. The service needs no change.
- **Alternatives**: Filter in the service stream (rejected: duplicates logic in three places).

## Decision 3: Carry the flag in the existing note DTOs

- **Decision**: Add `Boolean excludedFromAi` to `NoteRequest` (null means keep the stored value) and `boolean excludedFromAi` to `NoteResponse`. `NoteSummaryResponse` stays unchanged.
- **Rationale**: `PUT /api/notes/{id}` is a full update that the editor already calls on save. A nullable request field keeps older clients safe. The list indicator is deferred (YAGNI).
- **Alternatives**: A dedicated `PATCH` endpoint (rejected: a second save path, and the toggle would save apart from the title and content).

## Decision 4: Toggle saves with the note

- **Decision**: The toggle is part of the editor form state. The existing Save button persists it. The change marks the editor dirty.
- **Rationale**: This matches how title, course, and date behave. Saving updates `updatedAt`. A note that was processed before becomes pending once after re-enable. The planner already cleans prior uncompleted entities for edited notes, so a re-run is safe.
- **Alternatives**: Auto-save on toggle (rejected: no existing editor field does it).

## Decision 5: UI components

- **Decision**: Add shadcn-vue `Switch` (`npx shadcn-vue@latest add switch`). Add a third row to the existing "Plan zone" card in `NoteEditor.vue`, below the date row. Extend `noteStatus.ts` with a `skipped` status for the existing status badge.
- **Rationale**: The card already holds course and date rows (`min-h-11`, divider). A row keeps the 44-pixel touch target and the 8-pixel rhythm. `reka-ui` is installed, and `Switch` builds on it. The status badge already exists, so "Skipped by AI" needs no new component.
- **Alternatives**: An item in the actions menu (rejected: it hides the state). A `Badge` in the list (deferred).

## Decision 6: Status precedence

- **Decision**: `getNoteProcessingStatus` returns `skipped` when `excludedFromAi` is true and the note is saved. It checks this before `unprocessed` and `dirty`.
- **Rationale**: A skipped note never becomes pending. Showing "Unprocessed" or "Pending update" would mislead the student.

## Open items

None. All unknowns resolved.
