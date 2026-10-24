# Implementation Plan: Manage Courses Page

**Branch**: `004-manage-courses-page` | **Date**: 2026-10-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-manage-courses-page/spec.md`

## Summary

Add a Manage Courses page reached from the hamburger panel. The page lists courses with their class times. Students add and edit courses in the same drawer that Create Schedule uses. Students delete courses through a confirmation dialog.

Approach (YAGNI):

1. Extract the Create Schedule drawer into `CourseEditorDrawer.vue`. Create Schedule keeps its behavior.
2. Add `PUT /api/courses/{id}` so a rename keeps notes, tasks, and events.
3. Save class-time edits as a small diff (update, create, delete) against the catalog cache.
4. Hide the color picker in Manage Courses. Color is derived from the course id and the backend stores none (research R3).

## Technical Context

**Language/Version**: TypeScript (Vue 3.5, Vite), Java 25 (Spring Boot 4.1.1)

**Primary Dependencies**: Existing only. shadcn-vue `Drawer`, `Button`, `Card`, `Popover`. `vue-sonner`. No new packages.

**Storage**: SQLite. No schema change.

**Testing**: Vitest (jsdom) for frontend. JUnit 5, Mockito, `@WebMvcTest` for backend.

**Target Platform**: Mobile-first web, 390 px width.

**Project Type**: Web application (`frontend/` + `app/`).

**Performance Goals**: A save shows on the calendar with no list refetch.

**Constraints**: 44 px touch targets. Day-level data only. No Pinia or Axios. No new exception classes.

**Scale/Scope**: One user, tens of courses.

## Constitution Check

| Principle | Status |
|-----------|--------|
| I, III, IV (planner rules) | Pass. Feature does not touch tasks or the planner. |
| II Course anchor | Pass. Rename keeps the same row. Delete cascades as before. |
| V Layer isolation | Pass. New method goes controller -> service interface -> impl. DTOs only. |
| VI Canonical errors | Pass. 404 uses `ResourceNotFoundException`. No new classes. |
| VII Ponytail | Pass. No new dependencies. No new shadcn components. One extracted component. One pure helper. |
| VIII Surgical edits | Pass with care. Drawer extraction is a structural change. Run `CreateScheduleView.spec.ts` before and after. |
| IX Domain alignment | Pass. |
| X Pure views | Pass. No dev flags in views. |
| Data flow: "Courses provide create and delete endpoints only" | **Violation. Justified below.** |
| Data flow: trust mutation responses, no list refetch | Pass. Apply each response through `useCatalog`. |
| Mobile design system | Pass. Reuse bevel buttons and font rules. |

Post-design re-check: same result. One justified violation.

## Project Structure

### Documentation

```text
specs/004-manage-courses-page/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/manage-courses.contract.md
└── tasks.md            # created by /speckit-tasks
```

### Source Code

```text
app/src/main/java/group/four/nyare/nyare/
├── controller/CourseController.java          # + PUT /{id}
├── service/CourseService.java                # + updateCourse
└── service/impl/CourseServiceImpl.java       # + updateCourse (@Transactional)
app/src/test/java/group/four/nyare/nyare/
├── controller/CourseControllerTest.java      # + update cases
└── service/impl/CourseServiceImplTest.java   # + update cases

frontend/src/
├── api/courses.ts                            # + update()
├── api/mocks/adapter.ts                      # + PUT /api/courses/{id}
├── composables/useCatalog.ts                 # + applyCourseUpdated
├── utils/scheduleDiff.ts                     # new, pure diff
├── utils/scheduleValidation.ts               # + findEditorConflict
├── components/CourseEditorDrawer.vue         # new, extracted from CreateScheduleView
├── components/HamburgerMenu.vue              # + "Manage courses" item
├── views/CreateScheduleView.vue              # use CourseEditorDrawer
├── views/ManageCoursesView.vue               # new
└── router/index.ts                           # + manage-courses route (AppShell child)
```

Tests (frontend): `utils/__tests__/scheduleDiff.spec.ts`, `views/__tests__/ManageCoursesView.spec.ts`, updates to `HamburgerMenu.spec.ts` and `services.spec.ts`. Existing `CreateScheduleView.spec.ts` stays green.

**Structure Decision**: Web application. Changes stay inside existing folders. No new top-level folders.

## Delivery Order

1. Backend `PUT /api/courses/{id}` with tests (unblocks rename).
2. Frontend API, mock adapter, and catalog `applyCourseUpdated`.
3. `scheduleDiff.ts` and `findEditorConflict` with unit tests.
4. Extract `CourseEditorDrawer.vue`. Prove `CreateScheduleView.spec.ts` passes unchanged.
5. `ManageCoursesView.vue`, route, and menu item.
6. Constitution amendment (MINOR) for the course update endpoint.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Add course update endpoint, against "create and delete endpoints only" | FR-012: rename must keep notes, tasks, events | Delete and recreate cascades and destroys the course's notes, tasks, and events |
| Extract drawer from a 1,612-line view | User asked to reuse the drawer | Copy-paste creates two drawers that drift. Mounting the whole view drags in onboarding and drafts |
