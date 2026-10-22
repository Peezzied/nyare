# Tasks: AI Extraction Deduplication Guard

**Input**: Design documents from `/specs/012-ai-extraction-dedup/`  
**Prerequisites**: [plan.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/plan.md), [spec.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/spec.md), [research.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/research.md), [data-model.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/data-model.md), [contracts/planner-contract.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/contracts/planner-contract.md), [quickstart.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/specs/012-ai-extraction-dedup/quickstart.md)  
**Tests**: Unit tests in JUnit 5 / Mockito are required per Constitution Principle VIII and testing conventions.  
**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `- [ ] [TaskID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Setup

**Purpose**: System prompt instructions and decoding infrastructure

- [x] T001 Update system prompt with deduplication and matching rules in `backend/src/main/resources/planner_sys-prompt.st`
- [x] T002 [P] Verify or enhance LLM payload records and decoding for event and context matching in `backend/src/main/java/group/four/nyare/nyare/ai/PlannerAuditRecords.java`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core deterministic deduplication helpers and utilities in backend service

- [x] T003 Implement intra-batch and cross-course candidate normalization helpers in `backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T004 [P] Add unit test skeleton for deduplication scenarios in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

---

## Phase 3: User Story 1 - Restated Notes Produce No Changes (Priority: P1) 🎯 MVP

**Goal**: When journal notes restate already-recorded tasks, events, or academic context facts for the same course without new information, the planner creates zero new items and mutates nothing.

**Independent Test**: Process a dirty note that restates an existing open task, upcoming event, and context fact. Verify task, event, and context counts remain identical before and after the run with zero items created.

### Tests for User Story 1
- [x] T005 [P] [US1] Unit test verifying restating an existing open task creates zero new tasks and leaves the existing task unchanged in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- [x] T006 [P] [US1] Unit test verifying restating an upcoming academic event creates zero new events in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- [x] T007 [P] [US1] Unit test verifying restating an existing academic context fact creates zero new contexts in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- [x] T008 [P] [US1] Unit test verifying a batch of multiple dirty notes containing identical restatements extracts each item at most once in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

### Implementation for User Story 1
- [x] T009 [US1] Implement deterministic deduplication check preventing duplicate task creation for matching open tasks in same course in `backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T010 [US1] Implement deterministic deduplication check preventing duplicate event creation for matching upcoming events in same course in `backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T011 [US1] Implement deterministic deduplication check preventing duplicate academic context creation for matching facts in same course in `backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`

**Checkpoint**: US1 complete and verified. Reprocessing identical notes creates 0 items.

---

## Phase 4: User Story 2 - Existing Tasks Update Only With New Information (Priority: P2)

**Goal**: When a dirty note mentions an existing task and adds a new date anchor or explicit duration, update only `scheduledDate` and `duration` on the existing task while preserving its title and description. Restatements with missing date/duration must never clear existing values.

**Independent Test**: Process a note matching a backlog task that provides a deadline. Verify `scheduledDate` is updated while title and description remain intact. Process a subsequent note without a date anchor and verify the date is not cleared.

### Tests for User Story 2
- [x] T012 [P] [US2] Unit test verifying existing backlog task updates `scheduledDate` and `duration` when new info is present in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- [x] T013 [P] [US2] Unit test verifying existing scheduled task retains existing `scheduledDate` and `duration` when restated note omits date/duration in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- [x] T014 [P] [US2] Unit test verifying event deadline update when dirty note specifies a new explicit deadline for an existing event in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

### Implementation for User Story 2
- [x] T015 [US2] Implement non-destructive task promotion and field enrichment logic (preserve non-null date/duration, never overwrite title/desc) in `backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T016 [US2] Implement event deadline update logic for restated events with changed deadlines in `backend/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`

**Checkpoint**: US2 complete and verified. Enrichment works non-destructively; unstated dates never clear existing values.

---

## Phase 5: User Story 3 - Manually Created Items Are Also Protected (Priority: P3)

**Goal**: Deduplication applies equally to items created manually by the student and items extracted by previous planner runs.

**Independent Test**: Manually create an open task and an event. Process dirty notes mentioning those items. Verify zero duplicates are created.

### Tests for User Story 3
- [x] T017 [P] [US3] Unit test verifying manually created open task is not duplicated by dirty note in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- [x] T018 [P] [US3] Unit test verifying manually created academic event is not duplicated by dirty note in `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

### Implementation for User Story 3
- [x] T019 [US3] Ensure task and event querying in `StudyPlannerServiceImpl.java` retrieves both manual and AI-generated items without filtering on `origin` or note linkage.

**Checkpoint**: US3 complete and verified. Manual items are protected from duplication.

---

## Phase 6: Polish & Verification

**Purpose**: System prompt refinement, prompt decoding validation, and regression verification

- [x] T020 [P] Validate system prompt compliance with `prompt-engineering` and `asd-ste100` rules in `backend/src/main/resources/planner_sys-prompt.st`
- [x] T021 [P] Unit tests for prompt building and reference decoding in `backend/src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`
- [x] T022 Execute test suite for planner service (`./gradlew test --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest"`) and verify all scenarios pass

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1).
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2). Delivers core MVP.
- **User Story 2 (Phase 4)**: Depends on US1 (Phase 3).
- **User Story 3 (Phase 5)**: Depends on US1 (Phase 3).
- **Polish (Phase 6)**: Runs after all user stories are complete.

### Parallel Opportunities
- T001 and T002 can run in parallel.
- Test tasks T005, T006, T007, T008 can be authored in parallel before implementation.
- T012, T013, T014 can be authored in parallel.
- T017 and T018 can be authored in parallel.
- T020 and T021 can run in parallel.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Prompt & Records) and Phase 2 (Foundational normalization helpers).
2. Complete Phase 3 (User Story 1: Restatement produces zero duplicates).
3. Validate with unit tests in `StudyPlannerServiceImplTest.java`.
4. Result: Students never experience duplicate items from restated notes.

### Incremental Delivery
1. Phase 3 (US1): Zero duplicate creation on restatements.
2. Phase 4 (US2): Non-destructive task updates when new date/duration info exists; event deadline updates.
3. Phase 5 (US3): Protection extended to student manual entries.
4. Phase 6: Final prompt audit and test run.
