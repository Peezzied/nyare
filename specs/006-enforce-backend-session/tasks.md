---

description: "Task list for Enforce Backend Session"
---

# Tasks: Enforce Backend Session

**Input**: Design documents from `/specs/006-enforce-backend-session/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/session-enforcement.md, quickstart.md

**Tests**: Included. The constitution requires evidence-first verification. Write each test first and confirm it fails.

**Organization**: Tasks group by user story. Backend paths start with `app/src/main/java/group/four/nyare/nyare/` (shortened to `B/`) and `app/src/test/java/group/four/nyare/nyare/` (shortened to `BT/`). Frontend paths start with `frontend/src/` (shortened to `F/`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story label from spec.md

## Verification rules

- Run `./gradlew compileJava` and single test classes in `app/`. Run `./gradlew build` only at the end if needed.
- Run backend integration tests one at a time. Ask the user before the next one.
- Run `npm run type-check`, `npm run lint:oxlint`, and `npx vitest run <file>` in `frontend/`.
- Do not commit. Keep changes in the working tree.

---

## Phase 1: Setup

- [ ] T001 Confirm a clean baseline: run `./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"` in `app/` and `npx vitest run src/api src/router src/composables` in `frontend/`. Record the pass or fail result in the task notes.
- [x] T002 Add `spring.mvc.problemdetails.enabled=true` to the committed config template `app/src/main/resources/application.properties.example` (if it exists) and to the local `app/src/main/resources/application.properties`. Do not commit local `application*.properties` files.

---

## Phase 2: Foundational (blocks all stories)

**Purpose**: Session gate and the session user accessor. No story works without them.

- [x] T003 [P] Write failing test `BT/controller/SessionEnforcementControllerTest.java` (`@WebMvcTest` with `@MockitoBean` on service interfaces). For each path `GET /api/courses`, `/api/tasks`, `/api/notes`, `/api/schedules`, `/api/academic-events`, `/api/study-planner/status`, assert status 401 and content type `application/problem+json` with no session. Add a case that `GET /api/users/me` still answers 401 through its own handler, and that `POST /api/users/login` is not blocked by the gate (expect 400 on an empty body, not 401).
- [x] T004 Add `public Long requireUserId()` to `B/config/SessionContext.java`. Return `getUserId()` or throw `new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required")`. Keep `getUserId()` unchanged.
- [x] T005 Create `B/config/SessionInterceptor.java` (`@Component`, implements `HandlerInterceptor`). In `preHandle`, skip `OPTIONS`. Read `request.getSession(false)` and the `UserController.SESSION_USER_ID` attribute. Throw the same `ResponseStatusException` 401 when the attribute is not a `Long`. Do not use the request-scoped `SessionContext` here.
- [x] T006 Register the interceptor in `B/config/WebConfig.java` with `addInterceptors`. Apply to `/api/**`. Exclude `/api/users`, `/api/users/**` (open by decision, see research Decision 5). Verify T003 passes. If the body is not `application/problem+json`, add `@ExceptionHandler(ResponseStatusException.class)` to `B/controller/GlobalExceptionHandler.java` that returns `ProblemDetail.forStatusAndDetail(ex.getStatusCode(), ex.getReason())`.

**Checkpoint**: Anonymous calls to protected paths answer 401. Existing controller tests now fail until they set a session (fixed in US4).

---

## Phase 3: User Story 1 - Reject anonymous data access (Priority: P1) MVP

**Goal**: No protected request returns or changes data without a session.

**Independent Test**: Run `SessionEnforcementControllerTest` (T003) and the live `curl` check in quickstart scenario 3.

- [x] T007 [US1] Extend `BT/controller/SessionEnforcementControllerTest.java` with write calls: `POST /api/courses`, `POST /api/tasks`, `POST /api/notes`, `PUT /api/notes/{uuid}`, `DELETE /api/courses/{id}`, `PATCH /api/tasks/{uuid}/status`, `POST /api/study-planner/process`, `POST /api/images/**`. Each asserts 401 and `verifyNoInteractions` on the mocked service.
- [x] T008 [P] [US1] Update `B/controller/CourseController.java`: remove the `HttpServletRequest` session parsing and the `@RequestParam userId`. Inject `SessionContext`. Call `sessionContext.requireUserId()`.
- [x] T009 [P] [US1] Update `B/controller/TaskController.java`, `NoteController.java`, `ScheduleController.java`, `AcademicEventController.java`, and `StudyPlannerController.java`: replace `sessionContext.getUserId().orElse(null)` with `sessionContext.requireUserId()`.
- [x] T010 [P] [US1] Update `B/controller/ImageController.java` to receive `SessionContext` only if the image service needs the user. Otherwise rely on the gate. Confirm the gate covers `/api/images/**` in T007.
- [x] T011 [US1] Run `./gradlew test --tests "group.four.nyare.nyare.controller.SessionEnforcementControllerTest"` and confirm it passes.

**Checkpoint**: US1 verified. Anonymous access is closed.

---

## Phase 4: User Story 2 - Keep signed-in users working (Priority: P1)

**Goal**: A signed-in user keeps access to own data and never sees other users' data.

**Independent Test**: Service unit tests for owner and cross-user cases, then quickstart scenario 2.

### Tests first

- [x] T012 [P] [US2] Add failing tests to `BT/service/CourseServiceImplTest.java`: `getCourse_otherUser_throwsResourceNotFound`, `deleteCourse_otherUser_throwsResourceNotFound`, `createCourse_usesSessionUser_ignoresRequestUserId`. Use method names in the `method_condition_expected` style with `// given`, `// when`, `// then`.
- [x] T013 [P] [US2] Add failing tests to `BT/service/TaskServiceImplTest.java`: get, update, status update, delete with another user's ID throw `ResourceNotFoundException`. Add `createTask_courseOfOtherUser_throwsResourceNotFound`.
- [x] T014 [P] [US2] Add the same owner and cross-user tests to `BT/service/NoteServiceImplTest.java`.
- [x] T015 [P] [US2] Add the same tests to `BT/service/ScheduleServiceImplTest.java` and `BT/service/AcademicEventServiceImplTest.java`.

### Implementation

- [x] T016 [P] [US2] Add `Optional<Course> findByIdAndUserId(Long id, Long userId)` to `B/repository/CourseRepository.java`.
- [x] T017 [P] [US2] Add `Optional<Schedule> findByIdAndCourseUserId(Long id, Long userId)` to `B/repository/ScheduleRepository.java`.
- [x] T018 [P] [US2] Add `Optional<Task> findByIdAndCourseUserId(UUID id, Long userId)` to `B/repository/TaskRepository.java`. Add the same method (entity `Note`, `AcademicEvent`) to `NoteRepository.java` and `AcademicEventRepository.java`.
- [x] T019 [US2] Change `B/service/CourseService.java` and `B/service/impl/CourseServiceImpl.java`: `createCourse(CourseRequest, Long userId)`, `listCourses(Long userId)`, `getCourse(Long id, Long userId)`, `deleteCourse(Long id, Long userId)`. Use `findByIdAndUserId`. Throw `ResourceNotFoundException` on a miss. Remove the fallback to `request.getUserId()` and `queryUserId`.
- [x] T020 [US2] Remove the `userId` field and its getter and setter from `B/dto/CourseRequest.java`. Remove `userId` use from tests that build the request.
- [x] T021 [US2] Change `B/service/TaskService.java` and `B/service/impl/TaskServiceImpl.java`: `getTask`, `updateTask`, `updateTaskStatus`, `deleteTask` take `Long userId` and use `findByIdAndCourseUserId`. `createTask` takes `Long userId` and loads the course with `courseRepository.findByIdAndUserId`. Keep class-level `@Transactional(readOnly = true)` and explicit `@Transactional` on mutations.
- [x] T022 [P] [US2] Apply the same change to `B/service/NoteService.java` and `B/service/impl/NoteServiceImpl.java`.
- [x] T023 [P] [US2] Apply the same change to `B/service/ScheduleService.java` and `B/service/impl/ScheduleServiceImpl.java`.
- [x] T024 [P] [US2] Apply the same change to `B/service/AcademicEventService.java` and `B/service/impl/AcademicEventServiceImpl.java`.
- [x] T025 [US2] Check `B/service/impl/StudyPlannerServiceImpl.java` and `ImageServiceImpl.java` for by-ID access that skips the owner check. Fix any found with the same pattern. Record the result in the task notes.
- [x] T026 [US2] Update the controllers (`CourseController`, `TaskController`, `NoteController`, `ScheduleController`, `AcademicEventController`) to pass `sessionContext.requireUserId()` to the changed service methods. Run `./gradlew compileJava`.
- [x] T027 [US2] Run `./gradlew test --tests` for each of the five service test classes in T012-T015. Confirm they pass.

**Checkpoint**: US2 verified at the service layer.

---

## Phase 5: User Story 4 - Backend and frontend tests match the new contract (Priority: P2)

**Goal**: Existing tests log in first or expect 401. Placed before US3 so the suite is green when frontend handling lands.

**Independent Test**: Controller tests, adapter tests, and flow suite pass.

### Backend

- [x] T028 [P] [US4] Update `BT/controller/CourseControllerTest.java`: add `.sessionAttr(UserController.SESSION_USER_ID, 1L)` to each call. Stub service methods with the new signatures. Remove `userId` request parameter cases.
- [x] T029 [P] [US4] Apply the same session attribute and signature updates to `BT/controller/TaskControllerTest.java`, `NoteControllerTest.java`, `ScheduleControllerTest.java`, and `AcademicEventControllerTest.java`.
- [x] T030 [P] [US4] Apply the same updates to `BT/controller/StudyPlannerControllerTest.java` and `ImageControllerTest.java`.
- [x] T031 [US4] Run each controller test class from T028-T030 with `./gradlew test --tests`. Fix failures.
- [x] T032 [US4] Review the integration tests that call protected paths without a session: `BT/controller/StudyPlannerControllerIntegrationTest.java`, `StudyPlannerProcessCancellationIntegrationTest.java`, `UserSessionDomainIntegrationTest.java`, and the `BT/ai/*IntegrationTest.java` files. List which ones need a login step. Update them. Run ONE integration test, then ask the user before running the next.

### Frontend

- [x] T033 [P] [US4] Update `F/api/mocks/adapter.ts`: for protected routes (`/api/courses`, `/api/schedules`, `/api/tasks`, `/api/notes`, `/api/academic-events`, `/api/study-planner`, `/api/images`), return `{ status: 401, data: { title: 'Unauthorized', status: 401, detail: 'Authentication required' } }` when `state.currentUser` is null. Keep user routes open.
- [x] T034 [P] [US4] Update `F/api/mocks/__tests__/adapter.spec.ts`, `F/api/__tests__/services.spec.ts`, and `F/api/mocks/__tests__/notesPrototypePreview.spec.ts`: log in before protected calls. Add one test per area (course, task, note) that expects 401 with no login.
- [x] T035 [P] [US4] Update `F/__flow__/flows/01-session-catalog.flow.spec.ts`: add a step before register that expects `coursesApi.list()`, `tasksApi.list()`, and `notesApi.list()` to reject with `status: 401`. Keep the logout 401 check.
- [x] T036 [US4] Check `F/__flow__/flows/02-journal-planner.flow.spec.ts`, `03-failures-cancel.flow.spec.ts`, and `F/__flow__/harness/*` for calls made before login. Fix any found. Run `npx vitest run src/api` in `frontend/`.

**Checkpoint**: Backend controller tests and frontend unit tests pass under the new rule.

---

## Phase 6: User Story 3 - Frontend handles loss of session (Priority: P2)

**Goal**: A 401 during use returns the user to the account screen. Login restores the app.

**Independent Test**: Client and router unit tests, then quickstart scenario 6.

### Tests first

- [x] T037 [P] [US3] Add failing tests to `F/api/__tests__/client.spec.ts` (create the file if it does not exist, follow `services.spec.ts` setup): (a) a 401 on `/api/courses` calls the registered handler once and still rejects with `ApiError` status 401, (b) a 401 on `/api/users/me` does not call the handler, (c) a 401 on `/api/users/login` does not call the handler, (d) a 404 does not call the handler.
- [x] T038 [P] [US3] Add failing tests to `F/router/__tests__/index.spec.ts`: when the handler runs while on `calendar`, `useAuth().user.value` becomes `null` and the current route becomes `start`. When already on `start`, the router does not push again.

### Implementation

- [x] T039 [US3] In `F/api/client.ts`, add `let unauthorizedHandler: (() => void) | null`, an exported `setUnauthorizedHandler(handler: (() => void) | null): void`, and a check inside `request` after the call settles. On `ApiError` with `status === 401` and a path not equal to `/api/users/me` or `/api/users/login`, call the handler, then rethrow. Cover both the mock result branch and the `fetch` branch with one wrapper. Add a doc comment in the existing style.
- [x] T040 [US3] In `F/router/index.ts`, after the router is created, call `setUnauthorizedHandler(() => { clearSessionUser(); if (router.currentRoute.value.name !== 'start') void router.push({ name: 'start' }) })`. Import `clearSessionUser` from `@/composables/useAuth` and `setUnauthorizedHandler` from `@/api/client`. Keep views and components free of 401 logic.
- [x] T041 [US3] Update the stale comment in the `user === undefined` branch of `router.beforeEach` in `F/router/index.ts` only if it is now wrong. The comment says the backend rejects unauthenticated API calls, which is now true. Make no other guard change.
- [x] T042 [US3] Confirm dev auto-login still works: in `F/composables/__tests__/useAuth.spec.ts`, check an existing test covers `ensureSession` calling `authApi.login` with the dev user after a 401 from `/me`. Add one if missing.
- [x] T043 [US3] Run `npm run type-check`, `npm run lint:oxlint`, then `npx vitest run src/api src/router src/composables` in `frontend/`.

**Checkpoint**: All four stories work together.

---

## Phase 7: Polish and Cross-Cutting

- [x] T044 [P] Update `AGENTS.md` (repo root) and `app/AGENTS.md`: add one line that protected `/api/**` paths need a session and answer 401, and that services scope by session user ID.
- [x] T045 [P] Update `frontend/AGENTS.md` Backend Integration section with one line on the unauthorized handler in `client.ts` and the router.
- [x] T046 [P] Update `docs/system-workflows.md` and `app/docs/conventions/controllers-and-rest.md` status matrix: add 401 for protected calls and 404 for other-owner records.
- [x] T047 Write the breaking-change notes into `specs/006-enforce-backend-session/plan.md` under the existing table if implementation found extra changes (FR-013).
- [x] T048 Run `npm run lint` and `npm run format` in `frontend/`. Review the diff for unrelated changes.
- [x] T049 Run the full quickstart scenarios 1-6 in `specs/006-enforce-backend-session/quickstart.md`. Record command output as evidence. Ask the user before the second integration test.
- [x] T050 Record the follow-up risk (open `GET /api/users`, `GET /api/users/{id}`, `DELETE /api/users/{id}`, no passwords) in the final report to the user.

---

## Dependencies and Execution Order

### Phase dependencies

- Setup (Phase 1) has no dependency.
- Foundational (Phase 2) needs Phase 1 and blocks all stories.
- US1 (Phase 3) needs Phase 2.
- US2 (Phase 4) needs Phase 2. It touches service signatures, so run it after US1 controller edits (T008-T010) to avoid conflicts in the same controllers.
- US4 (Phase 5) needs US1 and US2 (new signatures and gate).
- US3 (Phase 6) needs T033 from US4 (mock 401) for client tests. Run after Phase 5.
- Polish needs all stories.

### Story completion order

US1 then US2 then US4 then US3. US1 alone is the MVP security fix. US2 completes the ownership fix.

### Parallel opportunities

- T003 runs parallel with T004 after both are planned (different files).
- T008, T009, T010 run in parallel (different controllers).
- T012-T015 run in parallel (different test files).
- T016-T018 run in parallel (different repositories).
- T022, T023, T024 run in parallel (different services).
- T028, T029, T030 run in parallel. T033, T034, T035 run in parallel.
- T037 and T038 run in parallel.

### Parallel example: User Story 2 tests

```text
Task: "Add cross-user tests in BT/service/CourseServiceImplTest.java"
Task: "Add cross-user tests in BT/service/TaskServiceImplTest.java"
Task: "Add cross-user tests in BT/service/NoteServiceImplTest.java"
Task: "Add cross-user tests in BT/service/ScheduleServiceImplTest.java and AcademicEventServiceImplTest.java"
```

---

## Implementation Strategy

### MVP first (US1)

1. Finish Phases 1 and 2.
2. Finish Phase 3 (US1).
3. Stop. Run T011 and the live `curl` check. Anonymous access is closed.

### Incremental delivery

1. Add US2 for ownership scoping. Verify with the service tests.
2. Add US4 so the suites pass under the new contract.
3. Add US3 for the frontend recovery path.
4. Finish with Polish and the full quickstart run.

### Notes

- [P] tasks touch different files with no dependency.
- Confirm each new test fails before the change that fixes it.
- Run backend integration tests one at a time and ask the user between runs.
- Do not commit. Wait for the user to request it.
