# Implementation Plan: Course Archive

**Branch**: `005-course-archive` | **Date**: 2026-10-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/005-course-archive/spec.md`

## Summary

A student archives a course from Manage Courses (one course or all). The course and its items leave every active view and the planner. The student opens the Archive page from a new hamburger menu item, reads archived items read-only, unarchives, or deletes.

Approach (ponytail):

1. Backend: one nullable column `courses.archived_at`. No new table. A course is archived when the column is set.
2. Backend: list queries get one extra predicate through an `archived` query param (default `false`). No new list endpoints.
3. Backend: write paths reject items of archived courses with `BadRequestException`.
4. Frontend: `coursesApi` and `useCatalog` mirror the backend. The catalog cache holds active courses only. A new `useArchive` composable holds archived courses.
5. Frontend: two new views (`ArchiveView`, `ArchivedCourseView`), one hamburger item, and archive actions on `ManageCoursesView`.

Application and presentation layers connect in one direction: view -> composable -> `src/api` service -> backend. Views never call `fetch`. Views never filter archived state themselves. Composables apply mutation responses locally (no list refetch).

## Technical Context

**Language/Version**: TypeScript (Vue 3.5, Vite), Java 25 (Spring Boot 4.1.1)

**Primary Dependencies**: Existing only. shadcn-vue `Button`, `Card`, `Badge`, `Alert`, `Dialog` (via `DialogShell`). `vue-sonner` for the Undo toast (supports `action` and `duration`). `@lucide/vue` icons. No new packages. No new shadcn components.

**Storage**: SQLite. One new nullable column `archived_at` on `courses`. Prod uses `ddl-auto=update`, which adds it. Existing rows stay `NULL` (active).

**Testing**: Backend: JUnit 5 + Mockito (service), `@WebMvcTest` (controller). Frontend: Vitest (jsdom) for composables, API service, views, and the mock adapter. One flow spec in `src/__flow__/flows/`.

**Target Platform**: Mobile-first web, 390 px width.

**Project Type**: Web application (`frontend/` + `app/`).

**Performance Goals**: Archive and unarchive show in the UI with no list refetch of courses.

**Constraints**: 44 px touch targets (FR-012). Day-level data only. No Pinia or Axios. No new exception classes. Views stay free of dev flags (Principle X).

**Scale/Scope**: One user, tens of courses.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I, III, IV (planner rules) | Pass. The planner excludes archived courses. It does not change its write rules. |
| II Course anchor, cascade delete | **Amendment needed.** Archive adds a non-destructive state. Delete cascade stays unchanged. |
| V Layer isolation | Pass. Controller -> service interface -> impl -> repository. DTOs only. |
| VI Canonical errors | Pass. 404 `ResourceNotFoundException`. 400 `BadRequestException` for writes on archived courses. |
| VII Ponytail | Pass. One column, no new table, no new dependency, no new shadcn component. |
| VIII Surgical edits | Pass with care. Run `HamburgerMenu.spec.ts` and `ManageCoursesView.spec.ts` before and after. |
| IX Domain alignment | Pass. Tri-state derivation unchanged. Archived tasks keep status, date, and duration. |
| X Pure views | Pass. Read-only mode comes from route and data, not from env flags. |
| Data flow: "Courses provide create, update, and delete endpoints" | **Amendment needed.** Add archive, archive-all, and unarchive endpoints. |
| Data flow: trust mutation responses | Pass. Archive endpoints return DTOs. The cache applies them. |
| Data flow: filter on server | Pass. `archived` is a server query param. |
| Mobile design system | Pass. Reuse tactile buttons and touch standards. |

Amendment: constitution 1.3.0 -> 1.4.0 (MINOR). Update Principle II and "Frontend Data Flow". This is task T001. Post-design re-check: same result.

## Design Decisions

### D1. Query contract (server-side filtering)

`archived` is an optional boolean on `GET /api/courses`, `/api/schedules`, `/api/notes`, `/api/tasks`, `/api/academic-events`. Default `false`.

- `false`: only rows whose course has `archived_at IS NULL`.
- `true`: only rows whose course has `archived_at IS NOT NULL`.

Each `findAllFiltered` JPQL gets one predicate: `(:archived = true AND c.archivedAt IS NOT NULL) OR (:archived = false AND c.archivedAt IS NULL)`. Internal callers (planner, `NoteRepository.findDirtyNotes`, `CourseServiceImpl.listCourses`) pass `false`. This covers FR-004 and FR-005 with one rule in one place per repository.

### D2. Write guards (FR-018)

A private helper `requireActiveCourse` in each service impl throws `BadRequestException("Course is archived")`. Create and update paths call it through the existing `findByIdAndUserId` lookup. Update, status change, and delete of an item check `item.getCourse().getArchivedAt()`. `CourseServiceImpl.updateCourse` also rejects archived courses. `deleteCourse` stays allowed (FR-010).

### D3. Archive endpoints

- `POST /api/courses/{id}/archive` -> `200 CourseResponse`. Idempotent on an archived course.
- `POST /api/courses/{id}/unarchive` -> `200 CourseResponse`. Idempotent on an active course.
- `POST /api/courses/archive-all` -> `200 List<CourseResponse>`. One transaction. One shared `archivedAt` value (FR-016). Returns `[]` when no active course exists.
- `POST /api/courses/unarchive` with body `{ "courseIds": [..] }` -> `200 List<CourseResponse>`. One transaction. Used by Undo (FR-019). An unknown or foreign ID rolls back the whole call with 404.

Path `archive-all` does not collide with `/{id}` because `{id}` is `Long` and the literal path wins. No endpoint for "unarchive all" (FR-020).

### D4. Frontend data flow

- `CourseResponse` gains `archivedAt: string | null`.
- `coursesApi`: `list(params?: { archived?: boolean })`, `archive(id)`, `unarchive(id)`, `archiveAll()`, `unarchiveMany(ids)`.
- `tasksApi`, `notesApi`, `schedulesApi`, `academicEventsApi` list params gain `archived?: boolean`.
- `useCatalog` keeps active courses only. New methods: `archiveCourse(id)`, `archiveAllCourses()`, `unarchiveCourses(ids)`. Each calls the API, then `applyCourseArchived(...)` or `applyCourseUnarchived(...)`.
- `applyCourseArchived` removes the course and its schedules from the cache and resets the tasks, events, notes, and planner-status caches. Same invalidation rule as `applyCourseDeleted`. `applyCourseUnarchived` inserts the returned courses, sorts by id, and reloads schedules through `loadCatalog(true)` (the cache lacks them).
- `useArchive` (new composable, module-level refs like `useCatalog`): `archivedCourses`, `loadArchive()`, `loadCourseContent(courseId)` (one call each for schedules, notes, tasks, events with `courseId` and `archived: true`, via `Promise.all`), `deleteArchivedCourse(id)`. It registers with `createCache` so logout resets it. Unarchive goes through `useCatalog().unarchiveCourses` and removes the course from `archivedCourses`.
- `archivedCourses` also answers "is this course archived?" for a direct link to a note or task (spec edge case). The note and task detail views call `useArchive().isArchived(courseId)` and render read-only with an "Archived course" label.

### D5. Presentation

- `HamburgerMenu.vue`: new item `data-testid="archive-item"` after Manage courses, same classes, `Archive` icon, `goToArchive()` pushes route `archive`. No new component.
- `ManageCoursesView.vue`: add an archive icon action per course (44 px) with a confirm dialog (reuse `DialogShell`). Add an "Archive all" button shown when `courses.length > 0` with a confirm dialog stating the count. After success, call `toast('Archived N courses', { action: { label: 'Undo', onClick }, duration: 8000 })`. Undo calls `useCatalog().unarchiveCourses(ids)`. On failure, show an error toast. The Archive link on the Manage Courses page is not added (clarification 2026-10-21).
- `ArchiveView.vue` (route `/archive`, name `archive`, child of the shell like `manage-courses`): list rows (name, color swatch, archive date), empty state, per-row open, unarchive, and delete (confirm dialog states the cascade). No "Unarchive all".
- `ArchivedCourseView.vue` (route `/archive/:courseId`, name `archived-course`): read-only sections for class times, notes, tasks, events. Unarchive action in the header. Task and note rows render without edit, status, or delete controls. Prefer existing row components with a `readonly` prop over copies. If a component has no `readonly` prop, add one with a default of `false`.
- Design per `frontend/DESIGN.md` and the `impeccable` skill: reuse tokens, bevel buttons, Quicksand controls, 8 px rhythm. Empty state teaches the next action. Archived rows use the same course color swatch as active rows so color stays a stable identity cue.
- Router: both routes need a session. Add `archive` and `archived-course` to the gated list only if `manage-courses` is gated (it is not today, so do not add).

### D6. Mock adapter and tests

`src/api/mocks/adapter.ts` mirrors the new endpoints and the `archived` param so dev preview and flow tests behave like the backend. Contract tests: `services.spec.ts` for the new `coursesApi` methods. A new flow `04-archive.flow.spec.ts` covers archive -> hidden in active lists -> Archive page -> read-only content -> unarchive.

## Project Structure

### Documentation

```text
specs/005-course-archive/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/archive.contract.md
└── checklists/requirements.md
```

### Source Code

```text
app/src/main/java/group/four/nyare/nyare/
├── model/Course.java                          # + archivedAt
├── dto/CourseResponse.java                    # + archivedAt
├── dto/UnarchiveRequest.java                  # new: courseIds
├── controller/CourseController.java           # + 4 endpoints
├── controller/{Task,Note,Schedule,AcademicEvent}Controller.java   # + archived param
├── service/CourseService.java, impl/CourseServiceImpl.java
├── service/impl/{Task,Note,Schedule,AcademicEvent}ServiceImpl.java # guard + param
├── service/impl/StudyPlannerServiceImpl.java  # pass archived=false
└── repository/{Course,Task,Note,Schedule,AcademicEvent}Repository.java

frontend/src/
├── api/{courses,tasks,notes,schedules,academicEvents}.ts, mocks/adapter.ts
├── types/api.ts
├── composables/{useCatalog,useArchive}.ts
├── components/HamburgerMenu.vue
├── views/{ManageCoursesView,ArchiveView,ArchivedCourseView}.vue
├── router/index.ts
└── __flow__/flows/04-archive.flow.spec.ts
```

**Structure Decision**: Existing web-app split. One new DTO, one new composable, two new views. No new packages.

## Complexity Tracking

| Item | Why needed | Simpler option rejected |
|------|-----------|------------------------|
| `archived` param on 5 list endpoints | Archived page must read items; active views must hide them | A separate `/api/archive/**` tree doubles controllers and services |
| Constitution amendment | Principle II and Data Flow list a fixed endpoint set | Silent drift between code and constitution |
| `archive-all` / batch `unarchive` endpoints | FR-015 and FR-019 need one atomic operation | N single calls break atomicity on failure |
