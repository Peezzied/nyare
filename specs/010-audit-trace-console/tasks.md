# Tasks: Dev Audit Trace Console

**Input**: Design documents from `/specs/010-audit-trace-console/` (`spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`)

**Prerequisites**: `plan.md` (required), `spec.md` (required for user stories), `research.md`, `data-model.md`, `contracts/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`US1`, `US2`, `US3`, `US4`, `US5`)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project build configuration and dev directory structure

- [x] T001 Add `devImplementation 'org.springframework.boot:spring-boot-starter-thymeleaf'` to `configurations.devImplementation` in `app/build.gradle`
- [x] T002 [P] Create dev directory structure for Java source, templates, and static assets in `app/src/dev/java/group/four/nyare/nyare/dev/` and `app/src/dev/resources/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core domain events, DTOs, and the in-memory circular buffer sink that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Create domain enums `AuditCategory` (`LIFECYCLE`, `TASK_PLANNING`, `TASK_PROMOTION`, `EVENT_PLANNING`, `IMAGE_CONTEXT`, `UNRELATED_INFO`, `DATA_MUTATION`), `AuditSeverity` (`INFO`, `WARN`, `ERROR`), `LifecycleState` (`STARTED`, `COMPLETED`, `FAILED`, `CANCELLED`), `MutationAction` (`CREATE`, `UPDATE`, `DELETE`, `ARCHIVE`), and `TriggerSource` (`WEB_SESSION`, `SYSTEM_JOB`) in `app/src/main/java/group/four/nyare/nyare/ai/event/AuditCategory.java`
- [x] T004 [P] Create `ErrorDiagnostic` record (fields: `String exceptionClass`, `String message`, `String rootCause`, `String stackPreview`) in `app/src/main/java/group/four/nyare/nyare/ai/event/ErrorDiagnostic.java`
- [x] T005 [P] Create `AuditTraceEvent` domain record with fields `id` (UUID), `timestamp` (Instant), `category`, `severity`, `message`, `originUserId` (Long), `originUsername` (String), `triggerSource`, `mutationAction`, `entityKind`, `entityId`, `changeSummary`, `runId`, `noteId`, `taskId`, `eventId`, `imageId`, `courseId`, `rationale`, `quotedText`, `durationMs`, `lifecycleState`, `extractedCounts`, `errorDiagnostic` in `app/src/main/java/group/four/nyare/nyare/ai/event/AuditTraceEvent.java`
- [x] T006 [P] Create dev DTOs `AuditTraceEventDto`, `CourseTraceSummaryDto`, `TraceNodeStubDto`, `TraceRelationGroupDto`, `DevDashboardViewModel`, and `TraceNodeDto` (with `isDeleted` and `deletedAt`) in `app/src/dev/java/group/four/nyare/nyare/dev/dto/`
- [x] T007 Implement `DevAuditTraceSink` with a bounded concurrent deque retaining up to 500 events using `@EventListener` on `AuditTraceEvent` in `app/src/dev/java/group/four/nyare/nyare/dev/sink/DevAuditTraceSink.java`
- [x] T008 [P] Unit test for `DevAuditTraceSink` verifying 500-event FIFO retention and thread safety in `app/src/test/java/group/four/nyare/nyare/dev/DevAuditTraceSinkTest.java`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Trace an Audit Entry to Stored Records (Priority: P1) [MVP]

**Goal**: A developer selects any audit card in the dev console feed and inspects the exact or inferred database record it cites.

**Independent Test**: Emit one audit of each category during a planning run, select the card in `/dev/audit-trace`, and verify the detail drawer resolves the expected stored record without console errors.

- [x] T009 [P] [US1] Inject `ApplicationEventPublisher` into `PlannerAuditAdvisor` and publish `AuditTraceEvent` for `TASK_PROMOTION`, `TASK_PLANNING`, `EVENT_PLANNING`, `IMAGE_CONTEXT`, and `UNRELATED_INFO` in `app/src/main/java/group/four/nyare/nyare/ai/advisor/PlannerAuditAdvisor.java`
- [x] T010 [P] [US1] Inject `ApplicationEventPublisher` into `StudyPlannerServiceImpl` and publish `AuditTraceEvent` for `LIFECYCLE` (`STARTED`, `COMPLETED`, `CANCELLED`) with `originUserId` and target note IDs in `app/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T011 [US1] Implement `DevTraceWalker` query service using JPA repositories to resolve `TraceNodeDto` for Note, Task, AcademicEvent, and Image records with `@Transactional(readOnly = true)` in `app/src/dev/java/group/four/nyare/nyare/dev/service/impl/DevTraceWalker.java`
- [x] T012 [US1] Implement `DevAuditTraceService` and `DevAuditTraceServiceImpl` exposing feed retrieval and node resolution in `app/src/dev/java/group/four/nyare/nyare/dev/service/impl/DevAuditTraceServiceImpl.java`
- [x] T013 [US1] Create Thymeleaf template `dashboard.html` with a split-pane layout (scrollable audit feed on left, record inspector drawer on right) in `app/src/dev/resources/templates/dev/dashboard.html`
- [x] T014 [US1] Create Nyare parchment visual identity stylesheet (warm background `#FAF8F5`, cyan accent `#0EA5E9`, slate text `#334155`) in `app/src/dev/resources/static/dev/dashboard.css`
- [x] T015 [US1] Implement `DevAuditTraceController` serving `GET /dev/audit-trace` (Thymeleaf view) and `GET /dev/audit-trace/node/{kind}/{id}` (JSON API) in `app/src/dev/java/group/four/nyare/nyare/dev/controller/DevAuditTraceController.java`
- [x] T016 [P] [US1] Unit test for `DevTraceWalker` verifying exact vs. inferred reference resolution in `app/src/test/java/group/four/nyare/nyare/dev/DevTraceWalkerTest.java`

**Checkpoint**: User Story 1 is functional. Developers can view audits and trace them to stored database records.

---

## Phase 4: User Story 2 - Walk the Database Through References (Priority: P2)

**Goal**: From any displayed record, the developer follows relationships to inspect neighbouring courses, tasks, notes, events, and images.

**Independent Test**: Start at one note record, click through its course, inspect sibling tasks and events, and return to the starting audit via breadcrumb history.

- [x] T017 [US2] Enhance `DevTraceWalker` to resolve all direct relations: course to notes/tasks/events, note to course/child tasks/child events/images, image to referencing notes, capping groups at 50 in `app/src/dev/java/group/four/nyare/nyare/dev/service/impl/DevTraceWalker.java`
- [x] T018 [US2] Implement course entry list endpoint `GET /dev/audit-trace/courses` in `DevAuditTraceController.java` to support top-level browsing when no audit is selected in `app/src/dev/java/group/four/nyare/nyare/dev/controller/DevAuditTraceController.java`
- [x] T019 [US2] Implement interactive client-side breadcrumb navigation and relation card click handler in `app/src/dev/resources/static/dev/dashboard.js`
- [x] T020 [P] [US2] Unit test verifying relation group 50-item limit and image binary exclusion in `app/src/test/java/group/four/nyare/nyare/dev/DevTraceWalkerRelationsTest.java`

**Checkpoint**: User Story 2 is functional. Developers can walk the database through reference links starting from audits or courses.

---

## Phase 5: User Story 3 - Read the Live Audit Feed (Priority: P3)

**Goal**: Live audit events stream to the dashboard in real time over SSE, with pause/resume controls and category filtering.

**Independent Test**: Trigger a planning run with the console open; confirm events append dynamically, pause freezes the feed, and category filter chips isolate entries.

- [x] T021 [US3] Implement SSE endpoint `GET /dev/audit-trace/stream` using Spring `SseEmitter` in `app/src/dev/java/group/four/nyare/nyare/dev/controller/DevAuditTraceController.java`
- [x] T022 [US3] Implement client-side `EventSource` connection in `dashboard.js` to append incoming audit cards to the feed in real time in `app/src/dev/resources/static/dev/dashboard.js`
- [x] T023 [US3] Implement Pause/Resume feed toggle with live state banner and filter chip switching logic in `app/src/dev/resources/static/dev/dashboard.js`
- [x] T024 [US3] Implement filtered feed endpoint `GET /dev/audit-trace/feed` with `category`, `severity`, and `limit` query parameters in `app/src/dev/java/group/four/nyare/nyare/dev/controller/DevAuditTraceController.java`

**Checkpoint**: User Story 3 is functional. The audit feed streams live over SSE and supports pause/resume and category filters.

---

## Phase 6: User Story 4 - Inspect Processing Errors and System Exceptions (Priority: P2)

**Goal**: When a planning run or database operation encounters an error, the console displays an `ERROR` card with exception type, root cause, and expandable stack trace.

**Independent Test**: Trigger a failing planning pass, verify an `ERROR` audit card renders with distinct error styling, and confirm selecting it opens the exception diagnostic drawer.

- [x] T025 [P] [US4] Update `PlannerAuditAdvisor` to capture JSON parsing errors and publish `AuditTraceEvent` with severity `ERROR` in `app/src/main/java/group/four/nyare/nyare/ai/advisor/PlannerAuditAdvisor.java`
- [x] T026 [P] [US4] Update `StudyPlannerServiceImpl` to catch unhandled planning exceptions, publish `LIFECYCLE` with state `FAILED` and `ErrorDiagnostic`, then rethrow in `app/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T027 [US4] Add `ERROR` severity filter pill and collapsible error diagnostic drawer rendering exception class, root cause, and expandable stack trace in `app/src/dev/resources/templates/dev/dashboard.html`
- [x] T028 [US4] Style error badges, error feed cards, and stack trace view in `app/src/dev/resources/static/dev/dashboard.css`

**Checkpoint**: User Story 4 is functional. Processing errors and system exceptions are captured and inspectable.

---

## Phase 7: User Story 5 - Audit Request Origin and CRUD Data Mutations (Priority: P2)

**Goal**: Audits display user origin (`originUsername`, `originUserId`, `triggerSource`) and capture data mutations (Create, Update, Delete, Archive) with tombstone states for deleted records.

**Independent Test**: Create a course, modify a note, and delete a task. Confirm `DATA_MUTATION` cards appear with user badges, and clicking a delete card renders the tombstone state.

- [x] T029 [P] [US5] Publish `AuditTraceEvent` with category `DATA_MUTATION` for create, update, delete, and archive operations in `app/src/main/java/group/four/nyare/nyare/service/impl/CourseServiceImpl.java`
- [x] T030 [P] [US5] Publish `AuditTraceEvent` with category `DATA_MUTATION` for note save and delete in `app/src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- [x] T031 [P] [US5] Publish `AuditTraceEvent` with category `DATA_MUTATION` for task create, update, and delete in `app/src/main/java/group/four/nyare/nyare/service/impl/TaskServiceImpl.java`
- [x] T032 [US5] Update `DevTraceWalker` to produce tombstone `TraceNodeDto` with deletion timestamp and actor for deleted entity IDs in `app/src/dev/java/group/four/nyare/nyare/dev/service/impl/DevTraceWalker.java`
- [x] T033 [US5] Add `DATA_MUTATION` filter pill and user origin badge rendering (`originUsername`, `originUserId`, `triggerSource`) in `app/src/dev/resources/templates/dev/dashboard.html`

**Checkpoint**: User Story 5 is functional. Request origins and CRUD mutations are captured and searchable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Production exclusion verification and end-to-end walkthrough

- [x] T034 [P] Verify production packaging via `./gradlew bootJar` to ensure zero dev classes, templates, or Thymeleaf dependencies exist in the production JAR per SC-006
- [x] T035 Execute end-to-end quickstart validation scenarios 1 through 6 against `./gradlew devRun` per `specs/010-audit-trace-console/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - MVP increment
- **User Story 2 (Phase 4)**: Depends on Phase 3 (extends trace walker & UI)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (extends controller with SSE & feed filters)
- **User Story 4 (Phase 6)**: Depends on Phase 3 (adds error handling & error drawer)
- **User Story 5 (Phase 7)**: Depends on Phase 3 (adds mutation events & tombstone walker)
- **Polish (Phase 8)**: Depends on all user stories being complete

### Parallel Execution Opportunities

- Phase 1: T002 can run in parallel with T001
- Phase 2: T003, T004, T005, T006, and T008 can all run in parallel
- Phase 3: T009 and T010 can run in parallel; T016 can run in parallel with T015
- Phase 6: T025 and T026 can run in parallel
- Phase 7: T029, T030, and T031 can all run in parallel

---

## Implementation Strategy

### MVP Scope (Phases 1, 2, and 3)
1. Complete Setup and Foundational tasks (T001 - T008).
2. Implement User Story 1 (T009 - T016).
3. **Validate MVP**: Run `./gradlew devRun`, visit `http://localhost:8080/dev/audit-trace`, and verify planner audits trace to stored records.

### Incremental Delivery
- Increment 1: MVP (Trace audit cards to records)
- Increment 2: Database relationship walking (US2)
- Increment 3: Real-time SSE streaming and feed pause/filtering (US3)
- Increment 4: Exception diagnostics and root cause drawer (US4)
- Increment 5: Request origin badges and CRUD mutation tombstones (US5)
- Increment 6: Production JAR boundary verification and final walkthrough (Phase 8)
