# Tasks: Manage Courses Page

**Input**: Design documents from `/specs/004-manage-courses-page/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/manage-courses.contract.md, quickstart.md

**Tests**: The spec does not ask for TDD. Test tasks are included because the drawer extraction (research R1) needs a regression net and backend rules require a test for new behavior. Write each test before its implementation task.

**Organization**: Tasks follow the story priorities in spec.md (US1 P1, US2 P1, US3 P2, US4 P2). Stories share one view file, so real independence is limited. See Dependencies.

## Phase 1: Setup

**Purpose**: Prepare the regression net and shared helpers.

- [x] T001 Run `npx vitest run src/views/__tests__/CreateScheduleView.spec.ts` in `frontend/` and record the passing baseline before any drawer extraction
- [x] T002 [P] Create `diffSchedules(existing, desired)` in `frontend/src/utils/scheduleDiff.ts`. Key each row as `day|start|end`. Return `{ keep, update: [{ id, next }], create: ScheduleRequest[], remove: number[] }`. Pair leftover removed rows with created rows in input order so ids stay stable
- [x] T003 [P] Add `findEditorConflict(editor, courses, schedules)` to `frontend/src/utils/scheduleValidation.ts`. Reuse `findDuplicateName`, `findClash`, `rangesOverlap`. Skip rows of the course being edited. Return the same message strings as `editorConflictError` in `CreateScheduleView.vue`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: US2 and US3 cannot work without the course update path and the extracted drawer.

- [x] T004 Add unit tests for `updateCourse` in `app/src/test/java/group/four/nyare/nyare/service/impl/CourseServiceImplTest.java`: happy path, name blank → `BadRequestException` via `@Valid`, other-user or missing id → `ResourceNotFoundException`. Confirm they fail before T005
- [x] T005 Add `updateCourse(Long id, CourseRequest request, Long userId)` to `CourseService` and `CourseServiceImpl` in `app/src/main/java/group/four/nyare/nyare/service/`. Reuse `findByIdAndUserId` for scoping. Class stays `@Transactional(readOnly = true)`. Add `@Transactional` on the method. Map name and description. Return `CourseResponse`
- [x] T006 Add `PUT /{id}` `updateCourse` to `app/src/main/java/group/four/nyare/nyare/controller/CourseController.java`. `@Valid @RequestBody`, `sessionContext.requireUserId()`, return 200 + body. Add matching `@WebMvcTest` cases in `CourseControllerTest.java` (200, 400, 404)
- [x] T007 [P] Add `coursesApi.update(id, request)` to `frontend/src/api/courses.ts` (`PUT /api/courses/{id}`) and remove the "no update endpoint" comment
- [x] T008 [P] Add `PUT /api/courses/{id}` handling to `frontend/src/api/mocks/adapter.ts` (update name/description, scope to current user, 404 when missing)
- [x] T009 [P] Add `applyCourseUpdated(course)` to `frontend/src/composables/useCatalog.ts`. Replace by id, no refetch
- [x] T010 Extract the drawer from `CreateScheduleView.vue` into `frontend/src/components/CourseEditorDrawer.vue` per `contracts/manage-courses.contract.md`: props `editor`, `open`, `stage`, `saving`, `showColor` (default true), `portal`, `unavailableDays`. Events `update:open`, `update:stage`, `save`, `close`. Named slot `footer`. Move all snap-point, touch, and click-to-expand logic. Keep every `data-testid`. `CreateScheduleView.vue` uses the new component and keeps its own chip dock, week preview, and dialogs
- [x] T011 Re-run `npx vitest run src/views/__tests__/CreateScheduleView.spec.ts` plus `npm run lint:oxlint` and `npm run type-check` in `frontend/`. All must pass unchanged before continuing

**Checkpoint**: Rename path exists end to end, and the drawer is a shared component with no regression.

---

## Phase 3: User Story 1 - View All Courses and Their Class Times (P1) 🎯 MVP

**Goal**: A Manage Courses page lists every course with color, name, and weekday-sorted class times. It opens from the hamburger panel.

**Independent Test**: Open the hamburger panel, tap "Manage courses", verify all courses render with correct times, empty state when no courses, back returns to calendar.

- [x] T012 [US1] Add route `path: '/manage-courses'`, `name: 'manage-courses'` as a child of the `AppShell` route in `frontend/src/router/index.ts`, lazy `component: () => import('@/views/ManageCoursesView.vue')`
- [x] T013 [US1] Add the "Manage courses" item to `frontend/src/components/HamburgerMenu.vue` above "Select Account" with `data-testid="manage-courses-item"`. On tap: `closeMenu()` then `router.push({ name: 'manage-courses' })`. Match the existing item style
- [x] T014 [US1] Create `frontend/src/views/ManageCoursesView.vue`: header with back (`router.back()` or `router.push({ name: 'calendar' })`) and "Add course" button; course cards from `useCatalog()` showing `getCourseColor(course.id)` dot, name, and class times grouped by day-of-week order Mon–Sun with start–end; "No class times" label; `manage-empty-state` with add action when `courses.length === 0`; `data-testid` per contract. Load via `loadCatalog()` on mount; show loading and error toast states. Follow `DESIGN.md` (Quicksand controls, 44 px targets, 8 px rhythm)
- [x] T015 [US1] Add spec `frontend/src/views/__tests__/ManageCoursesView.spec.ts`: lists courses, sorts times by weekday, empty state, menu item navigation covered in `HamburgerMenu.spec.ts` (update it for the new item)

**Checkpoint**: US1 works: navigate in, see the timetable, navigate out. MVP deliverable.

---

## Phase 4: User Story 2 - Edit, Add, and Remove Class Times (P1)

**Goal**: The shared drawer opens pre-filled for a course and saves class-time changes as a diff.

**Independent Test**: Change one class time, save, and confirm the calendar shows the change with no list refetch.

- [x] T016 [US2] In `ManageCoursesView.vue`, open `CourseEditorDrawer` in edit mode: build `DraftCourse { tempId: 'course-<id>', name, schedules, courseId }` from catalog data, `createCourseEditor(draft)`, `showColor=false`, `initialStage='full'` or partial per UX call. Provide `unavailableDays` excluding this course's schedules
- [x] T017 [US2] Implement drawer Save in `ManageCoursesView.vue`: if name changed → `coursesApi.update` + `applyCourseUpdated`; then `diffSchedules` → `schedulesApi.update/create/delete` and `applySchedule*` per response; order: updates, creates, deletes; stop at first error, toast via `errorMessage`, keep drawer open with values (FR-014); on success close drawer, `captureSnapshot`, toast success
- [x] T018 [US2] Wire `findEditorConflict` (from T003) to block saves on duplicate name or cross-course clash before any request
- [x] T019 [US2] Reuse `DiscardDraftConfirmDialog` in `ManageCoursesView.vue` for the close-with-unsaved-edits guard using `isEditorDirty`

**Checkpoint**: US1 + US2 work: view, edit times, add/remove times, calendar updates live.

---

## Phase 5: User Story 3 - Edit Course Details (P2)

**Goal**: Rename a course; every view shows the new name; links to notes/tasks/events preserved.

**Independent Test**: Rename, then check calendar, notes list, and course picker show the new name; notes/tasks still attached.

- [x] T020 [US3] Ensure the drawer's course-name field saves through `coursesApi.update` only when `editor.name.trim() !== course.name` (blank name blocked by `isEditorValid`); confirm name edits alone (no schedule change) save cleanly in `ManageCoursesView.vue`
- [x] T021 [US3] Extend `ManageCoursesView.spec.ts`: rename updates list display without refetch; renamed course keeps `persistedId` and id stability

**Checkpoint**: US1–US3 all pass.

---

## Phase 6: User Story 4 - Add and Delete Courses (P2)

**Goal**: Add a course through the blank drawer; delete a course through a cascade warning dialog.

**Independent Test**: Add → appears in list and calendar. Delete → confirm dialog names cascades; confirm removes everywhere; cancel keeps.

- [x] T022 [US4] Wire "Add course" in `ManageCoursesView.vue` to open `CourseEditorDrawer` with a blank `createCourseEditor()`, `showColor=false`. On save: `coursesApi.create` + `applyCourseCreated`, then create each schedule + `applyScheduleCreated`. Reuse conflict check against the full catalog
- [x] T023 [US4] Delete flow: reuse `DiscardDraftConfirmDialog` (title `Delete course?`, message naming notes, tasks, events, class times, `confirm-label="Delete"`). On confirm: `useCatalog().deleteCourse(id)`. On error: toast and keep the row
- [x] T024 [US4] Extend `ManageCoursesView.spec.ts` for add and delete paths

**Checkpoint**: All four stories work.

---

## Phase 7: Polish & Cross-Cutting

- [x] T025 Amend `.specify/memory/constitution.md` (MINOR): change "Courses provide create and delete endpoints only" to include update; bump version to 1.3.0 and update `Last Amended`
- [x] T026 [P] Update `frontend/AGENTS.md` roundtrip note that courses expose `create()`/`update()`/`delete()`
- [x] T027 Run full quickstart validation in `specs/004-manage-courses-page/quickstart.md` (manual scenarios 1–9)

---

## Dependencies & Execution Order

- Setup (T001–T003) → Foundational (T004–T011) blocks everything
- T010→T011 is the risky pair: extraction before all UI work
- US2/US3/US4 all depend on T014 (the view) — so they are sequential in practice, not parallel. T016–T019 then T020–T021 then T022–T024
- Parallel: T002, T003 (T001 baseline may run alongside); T007, T008, T009; T026 anytime

## Parallel Example

```bash
# Foundational, after T004–T006:
Task: "coursesApi.update + mock adapter + useCatalog" (T007–T009, three files)
# Polish:
Task: "AGENTS.md update" (T026) alongside spec edits
```

## Implementation Strategy

**MVP**: Phases 1–3 (T001–T015) — page opens and lists courses; drawer extracted with zero regression. US2–US4 layer on top. Stop after each phase to validate.
