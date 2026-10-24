# Research: Course Archive

## R1. Archive state storage

- **Decision**: Nullable `archived_at` timestamp on `courses`. `NULL` means active.
- **Rationale**: One column gives both state and the archive date (FR-007). `archive-all` sets one value for all courses (FR-016). Prod `ddl-auto=update` adds the column. Existing rows stay active.
- **Alternatives**: Boolean plus date column (two columns, can disagree). Separate `archived_courses` table (breaks the single-parent cascade, Principle II).

## R2. Hiding archived data

- **Decision**: One `archived` predicate in each `findAllFiltered` query, default `false`, passed by internal callers.
- **Rationale**: Principle "filter on the server". The planner already calls the same queries, so FR-005 holds with no planner change except the explicit argument. `NoteRepository.findDirtyNotes` gets the same predicate.
- **Alternatives**: Filter in the service layer after load (N+1 risk, easy to miss a caller). Filter in the client (data leaks to views, violates data-flow rule).

## R3. Read-only enforcement

- **Decision**: Backend rejects writes with `BadRequestException`. Frontend shows no write controls and does not rely on the backend for UX.
- **Rationale**: Integrity needs a server check (FR-018). The UI check avoids dead buttons.
- **Alternatives**: UI only (a stale client or a direct API call could mutate archived data).

## R4. Atomic bulk operations

- **Decision**: `POST /api/courses/archive-all` and `POST /api/courses/unarchive` (body `courseIds`), each one `@Transactional` method.
- **Rationale**: FR-015 and FR-019 demand all-or-nothing. Undo must restore exactly the archived set, so it sends explicit IDs.
- **Alternatives**: Client loop of single calls (partial failure state). "Unarchive all" endpoint (forbidden by FR-020, and would also restore older archives).

## R5. Undo message

- **Decision**: `vue-sonner` toast with `action` and `duration: 8000`. `ManageCoursesView` already imports `toast` from `vue-sonner`.
- **Rationale**: No new component. Sonner closes at 8 s. Leaving the page does not need extra code: the toast is global, but Undo still works safely because it sends explicit IDs. Spec scenario 8 says the message closes when the student leaves the page, so the view calls `toast.dismiss(id)` in `onBeforeRouteLeave`.
- **Alternatives**: Extend `useToasts` with actions (more code, a second toast system).

## R6. Cache invalidation after archive

- **Decision**: Reuse the `applyCourseDeleted` pattern: drop the course and schedules from the catalog, reset tasks, events, notes, and planner-status caches.
- **Rationale**: Those caches hold items of the archived course. Resetting is simpler and safer than filtering them in place. Mutation responses still update the catalog directly (no `courses` refetch).
- **Alternatives**: Filter each cache by course ID (more code, more places to forget).

## R7. Direct link to a note or task of an archived course

- **Decision**: By-ID `GET` endpoints still return archived items. The detail views check `useArchive().isArchived(courseId)` and render read-only with a label.
- **Rationale**: Matches the spec edge case. Needs no new endpoint. `loadArchive()` runs once if the note or task course is missing from the active catalog.
- **Alternatives**: 404 for archived items (contradicts the spec).

## R8. UI components

- **Decision**: Reuse shadcn-vue `Button`, `Card`, `Badge`, `Alert` and `DialogShell`. Add no new shadcn component. Add a `readonly` prop to existing row components where needed.
- **Rationale**: User request: shadcn-vue only where applicable, ponytail. The hamburger panel uses plain tactile buttons, so the Archive item copies that pattern.
- **Alternatives**: Copies of read-only rows (duplicate code).

No `NEEDS CLARIFICATION` items remain.
