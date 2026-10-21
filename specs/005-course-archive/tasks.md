# Tasks: Course Archive

**Input**: Design documents from `/specs/005-course-archive/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/archive.contract.md

**Organization**: Tasks are grouped by user story. Each story is independently testable.

## Format: `[ID] [P?] [Story] Description`

Paths: `backend/src/`, `frontend/src/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema field, DTO shape, governance amendment.

- [x] T001 Amend `.specify/memory/constitution.md` to version 1.4.0: in Principle II note that `Course` has a non-destructive archived state alongside cascade delete; in Frontend Data Flow note that courses expose create, update, delete, archive, and unarchive endpoints. Add a sync impact report entry.
- [x] T002 Add field `private LocalDateTime archivedAt` to `backend/src/main/java/group/four/nyare/nyare/model/Course.java` mapped as `@Column(name = "archived_at")` (nullable), with `getArchivedAt()`/`setArchivedAt()`. Prod `ddl-auto=update` adds the column; no migration file.
- [x] T003 [P] Add `private LocalDateTime archivedAt` with getter/setter to `backend/src/main/java/group/four/nyare/nyare/dto/CourseResponse.java`. Extend the full constructor to include `archivedAt`. Keep existing constructors delegating with `null`.
- [x] T004 [P] Create `backend/src/main/java/group/four/nyare/nyare/dto/UnarchiveRequest.java`: field `courseIds` of type `List<Long>` with `@NotEmpty` and elements `@NotNull`, plus getter/setter.
- [x] T005 [P] Add `archivedAt: string | null` to `CourseResponse`, add `UnarchiveRequest { courseIds: number[] }`, and add `archived?: boolean` to the list params types of courses, tasks, notes, schedules, and academic events in `frontend/src/types/api.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend archive state, server-side hiding, and write guards. All stories depend on this.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Add `archived` filtering to `findAllFiltered` in `backend/src/main/java/group/four/nyare/nyare/repository/{TaskRepository,NoteRepository,ScheduleRepository,AcademicEventRepository}.java`: add `@Param("archived") Boolean archived` and predicate `(:archived = true AND c.archivedAt IS NOT NULL) OR (:archived = false AND c.archivedAt IS NULL)` via the existing course join (use the entity's own `x.course` path when no join exists). Add the same predicate to `NoteRepository.findDirtyNotes` (both overloads). In `backend/src/main/java/group/four/nyare/nyare/repository/CourseRepository.java` add `List<Course> findByUserIdAndArchivedAtIsNull(Long userId)` and `List<Course> findByUserIdAndArchivedAtIsNotNull(Long userId)`. Note: `NoteServiceImpl` uses `courseRepository.existsById` in one check (line ~79); do not change that call site now.
- [x] T007 Thread `archived` through service interfaces and impls: in `backend/src/main/java/group/four/nyare/nyare/service/` and `service/impl/` for Task, Note, Schedule, and AcademicEvent, add a `Boolean archived` parameter to the list method and pass it to `findAllFiltered`. Pass `false` in `StudyPlannerServiceImpl` at every `findAllFiltered` and `findDirtyNotes` call (`backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`).
- [x] T008 Add `archived` query param (optional `Boolean`, default false) to the list endpoints of `backend/src/main/java/group/four/nyare/nyare/controller/{Task,Note,Schedule,AcademicEvent}Controller.java` and pass it to the service.
- [x] T009 Implement archive state in `backend/src/main/java/group/four/nyare/nyare/service/impl/CourseServiceImpl.java` and interface `CourseService.java`: `archiveCourse(id, userId)`, `unarchiveCourse(id, userId)`, `archiveAllCourses(userId)` (one shared `LocalDateTime.now()` for all courses), `unarchiveCourses(List<Long> courseIds, userId)` (all-or-nothing; any unknown or foreign ID throws `ResourceNotFoundException`, transaction rolls back). Single archive/unarchive are idempotent no-ops when the state already matches. `listCourses(userId)` returns only active courses (use `findByUserIdAndArchivedAtIsNull`); add `listArchivedCourses(userId)` using `findByUserIdAndArchivedAtIsNotNull`. `updateCourse` throws `BadRequestException("Course is archived")` when the course is archived. `deleteCourse` stays allowed for archived courses.
- [x] T010 Add write guards in `backend/src/main/java/group/four/nyare/nyare/service/impl/{Task,Note,Schedule,AcademicEvent}ServiceImpl.java`: where the impl looks up the parent course for a create or update, throw `BadRequestException("Course is archived")` when `course.getArchivedAt() != null`; where the impl mutates an item (update, status change, delete), apply the same check on `item.getCourse().getArchivedAt()`. Skip `NoteServiceImpl`'s internal `existsById` validation used only for the planner unless it is a write entry point.
- [x] T011 Wire `backend/src/main/java/group/four/nyare/nyare/controller/CourseController.java`: `POST /{id}/archive`, `POST /{id}/unarchive`, `POST /archive-all`, `POST /unarchive` with `@Valid @RequestBody UnarchiveRequest`, and `GET` with optional `archived` param defaulting to false (false → `listCourses`, true → `listArchivedCourses`).
- [x] T012 Update the mock adapter `frontend/src/api/mocks/adapter.ts`: honor `archived` on `GET /api/courses` and on schedules, notes, tasks, and academic-events lists (filter by parent course's `archivedAt`); implement `POST /api/courses/{id}/archive`, `/{id}/unarchive`, `/archive-all`, `/unarchive` mirroring backend semantics (atomic; unknown ID → 404; write on archived course → 400).

**Checkpoint**: Run `./gradlew compileJava` and `npx vitest run src/api/mocks/__tests__/adapter.spec.ts`. Backend exposes archive state; all user stories can start.

---

## Phase 3: User Story 1 - Archive a Course (Priority: P1) 🎯 MVP

**Goal**: Student archives one course from Manage Courses with a confirmation. The course and its items leave all active views; data is kept.

**Independent Test**: Archive a course with class times, notes, and tasks. Verify it leaves Manage Courses, calendar, Tasks, Notes, and the course picker, and that `GET /api/courses/{id}` still returns it.

- [x] T013 [P] [US1] Add API methods to `frontend/src/api/courses.ts`: `archive(id)` → `POST /api/courses/{id}/archive`; `list(params?)` gets optional `archived?: boolean`. Update `frontend/src/api/__tests__/services.spec.ts` with cases for `archive` and the `archived` list param.
- [x] T014 [US1] Extend `frontend/src/composables/useCatalog.ts`: `archiveCourse(id)` calls `coursesApi.archive`, then `applyCourseArchived(id)` which removes the course and its schedules from the cache and resets the tasks, events, notes, and planner-status caches (same rule as `applyCourseDeleted`; add `useNotes().resetNotes()` to match). No course list refetch.
- [x] T015 [US1] Add archive action to `frontend/src/views/ManageCoursesView.vue`: per-course icon button (44 px touch target, `Archive` lucide icon) that opens a confirm dialog via `DialogShell` stating the course name; confirm calls `useCatalog().archiveCourse(id)`; on `ApiError` show an error toast. Cancel leaves the course unchanged.
- [x] T016 [P] [US1] Backend unit tests: add archive cases to `backend/src/test/java/group/four/nyare/nyare/controller/CourseControllerTest.java` (`@WebMvcTest`, `@MockitoBean` on `CourseService`): `POST /{id}/archive` → 200 with `archivedAt`; unknown ID → 404. Add service tests in `backend/src/test/java/group/four/nyare/nyare/service/CourseServiceTest.java` (new file, JUnit 5 + Mockito, `@Mock` repos, `@InjectMocks CourseServiceImpl`): archive sets `archivedAt`, archive on already-archived is a no-op, update on archived throws `BadRequestException`, `listCourses` excludes archived.
- [x] T017 [P] [US1] Add archive-hiding coverage to repository or service tests: verify `findAllFiltered` and `findDirtyNotes` exclude archived courses (extend existing `NoteRepositoryTest`/service test files per `backend/docs/conventions/testing-standards.md`).
- [x] T018 [US1] Add view tests to `frontend/src/views/__tests__/ManageCoursesView.spec.ts`: archive button opens confirm dialog, confirm calls the API and removes the course from the list, cancel changes nothing.

**Checkpoint**: `./gradlew test --tests "*CourseServiceTest*"` and `npx vitest run src/views/__tests__/ManageCoursesView.spec.ts src/api/__tests__/services.spec.ts` pass.

---

## Phase 4: User Story 2 - View Archived Courses (Priority: P1)

**Goal**: Archive menu item in the hamburger panel opens an Archive page listing archived courses; each course opens a read-only detail view.

**Independent Test**: Archive two courses, open the Archive page from the hamburger panel, verify both appear with name, color, and archive date; open one and verify read-only content and an unarchive action.

- [x] T019 [P] [US2] Add an Archive menu item to `frontend/src/components/HamburgerMenu.vue` after the Manage courses item: same button classes, `Archive` lucide icon, `data-testid="archive-item"`, `goToArchive()` that closes the menu and pushes route name `archive`.
- [x] T020 [US2] Create `frontend/src/composables/useArchive.ts` (module-level refs like `useCatalog`, registered with `createCache`): `archivedCourses`, `loaded`, `loadArchive()` (`coursesApi.list({ archived: true })`), `isArchived(courseId)`, `loadCourseContent(courseId)` (one `Promise.all` for schedules, notes, tasks, and events with `{ courseId, archived: true }` through the existing api services), `deleteArchivedCourse(id)` (`coursesApi.delete` then drop from `archivedCourses`). Exported getters keep the cache the single source.
- [x] T021 [US2] Extend the four list services `frontend/src/api/{tasks,notes,schedules,academicEvents}.ts` to pass the new `archived` list param.
- [x] T022 [US2] Create `frontend/src/views/ArchiveView.vue` (`<script setup lang="ts">`, mobile-first, DESIGN.md tokens): header with back navigation to the previous page (same pattern as `ManageCoursesView`), list rows with course color swatch, name, and archive date; empty state explaining how to archive; row tap opens route `archived-course`. Per-row unarchive and delete buttons are added in T028 and T032.
- [x] T023 [US2] Create `frontend/src/views/ArchivedCourseView.vue` for route `/archive/:courseId` (name `archived-course`): loads via `useArchive().loadCourseContent`; read-only sections for class times, notes, tasks, and events reusing existing row components; where a row component lacks a `readonly` prop add one defaulting to `false` that hides edit, status, and delete controls; unarchive action in the header area; `404` handling shows a not-found state.
- [x] T024 [US2] Register routes in `frontend/src/router/index.ts`: `/archive` (name `archive`) and `/archive/:courseId` (name `archived-course`) as children of the shell like `manage-courses`, with dynamic imports. Do not add them to `GATED_WHEN_NOT_ONBOARDED` (matches `manage-courses`).
- [x] T025 [US2] Read-only label for direct links: in the note and task detail views (`NoteEditor.vue`, `TaskDetailView.vue`), when `useArchive().isArchived(courseId)` is true (load archive if the course is missing from the active catalog), render read-only with an "Archived course" label. If a detail view today only supports edit, add the smallest guard: display content and hide save/edit controls.
- [x] T026 [P] [US2] View tests: `frontend/src/views/__tests__/ArchiveView.spec.ts` (list, empty state, navigation) and `ArchivedCourseView.spec.ts` (read-only rendering, unarchive action present); extend `HamburgerMenu.spec.ts` for `archive-item`.

**Checkpoint**: `npx vitest run src/views/__tests__/ArchiveView.spec.ts src/views/__tests__/ArchivedCourseView.spec.ts src/components/__tests__/HamburgerMenu.spec.ts` passes.

---

## Phase 5: User Story 3 - Unarchive a Course (Priority: P1)

**Goal**: Student unarchives a course from the Archive page; the course and its data return to active views unchanged.

**Independent Test**: Unarchive an archived course; verify it appears again in Manage Courses, calendar, Tasks, and Notes with the same task fields.

- [x] T027 [P] [US3] Backend tests for unarchive and bulk unarchive in `CourseServiceTest.java` and `CourseControllerTest.java`: unarchive clears `archivedAt`; batch unarchive returns DTOs; batch with an unknown or foreign ID → 404 and no change; `POST /unarchive` with empty `courseIds` → 400.
- [x] T028 [US3] Add `coursesApi.unarchive(id)` and `coursesApi.unarchiveMany(ids)` to `frontend/src/api/courses.ts` and extend `useCatalog` with `unarchiveCourses(ids)`: calls the batch endpoint, inserts returned courses into the cache sorted by id, calls `loadCatalog(true)` to restore schedules (cache does not have them), and resets tasks/events/notes caches so next loads re-fetch. Per-row unarchive on `ArchiveView` calls `unarchiveCourses([id])` and drops the course from `useArchive().archivedCourses`. Same on `ArchivedCourseView` header action, which then navigates back.
- [x] T029 [US3] Tests: `services.spec.ts` cases for `unarchive`/`unarchiveMany`; `ArchiveView.spec.ts` unarchive flow updates both caches.

**Checkpoint**: Quickstart manual steps 3, 5, 6 pass.

---

## Phase 6: User Story 4 - Archive All Active Courses at Once (Priority: P2)

**Goal**: "Archive all" on Manage Courses archives every active course in one atomic call; an 8-second Undo toast reverses exactly that set.

**Independent Test**: Archive all four courses; all appear on the Archive page with the same archive date; Undo restores them.

- [x] T030 [P] [US4] Backend tests: `archiveAllCourses` sets one shared `archivedAt` on all active courses and returns them; no active courses → `[]`; failure mid-operation rolls back (mock repository to throw). Controller test for `POST /archive-all`.
- [x] T031 [US4] Add `coursesApi.archiveAll()` and `useCatalog.archiveAllCourses()` (apply all returned courses via `applyCourseArchived` each, keep the returned IDs). `ManageCoursesView`: show "Archive all" only when `courses.length > 0`; confirm dialog states the count; on success call `toast('Archived N courses', { action: { label: 'Undo', onClick: () => void catalog.unarchiveCourses(ids) }, duration: 8000 })` (vue-sonner, already imported); on error show an error toast; dismiss the toast on `onBeforeRouteLeave`.
- [x] T032 [US4] Tests: `ManageCoursesView.spec.ts` cases — hidden with zero courses, dialog shows count, confirm archives all, Undo restores the exact set, error path leaves state unchanged. `services.spec.ts` case for `archiveAll`.

**Checkpoint**: Quickstart manual steps 7 and 8 pass.

---

## Phase 7: User Story 5 - Delete an Archived Course (Priority: P3)

**Goal**: Student permanently deletes an archived course from the Archive page after a cascade warning.

**Independent Test**: Delete an archived course; confirm the warning; verify it is gone from the Archive page.

- [x] T033 [US5] Add per-row delete to `frontend/src/views/ArchiveView.vue`: confirm dialog (`DialogShell`) states that all notes, tasks, events, and class times are deleted; confirm calls `useArchive().deleteArchivedCourse(id)`; backend delete endpoint already exists (no backend change).
- [x] T034 [US5] Tests: `ArchiveView.spec.ts` delete flow (dialog text, confirm removes the row, cancel keeps it).

**Checkpoint**: Quickstart manual step 9 passes.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T035 Create `frontend/src/__flow__/flows/04-archive.flow.spec.ts`: archive → hidden in active lists → Archive page → read-only content → unarchive, using the mock adapter (mirrors `01-session-catalog.flow.spec.ts` conventions).
- [ ] T036 Run targeted verification per `quickstart.md`: backend `./gradlew test --tests "*CourseServiceTest*" --tests "*CourseControllerTest*"`; frontend `npx vitest run` on all touched spec files; `npm run type-check`; `npm run lint:oxlint`. Integration tests one at a time, ask the user first.
- [x] T037 [P] Update `frontend/src/views/__tests__/` and `backend/src/test/.../SessionEnforcementControllerTest.java` only if session enforcement matrix lists each endpoint — add the new `/api/courses` routes if the matrix requires it.

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup) → Phase 2 (Foundational) → all story phases.
- US1, US2 (P1) can proceed in parallel after Phase 2; US3 needs the catalog unarchive path (T028 builds on T014); US4 needs T014 and T031 sequencing; US5 needs T020.
- MVP: complete US1 + US2 + US3 together — archive is useless without a way to see and restore archived courses.

### Within Each User Story

- API service methods → composable → view → tests.
- Backend test tasks marked [P] can run parallel to frontend tasks.

### Parallel Opportunities

- T003, T004, T005 (Setup).
- T013/T016/T017/T018 within US1.
- T019 and T026 within US2.
- T027, T030 (backend tests) against frontend work.

## Implementation Strategy

### MVP First (User Stories 1–3)

1. Phase 1 + Phase 2 (backend archive mechanics).
2. US1: archive one course.
3. US2: view archived courses.
4. US3: unarchive.
5. **STOP and VALIDATE**: quickstart steps 1–6.

### Incremental Delivery

US4 (bulk + undo) and US5 (delete) land independently on top of the MVP.
