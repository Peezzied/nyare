# Tasks: Configurable Planning and Backdating Horizons

**Input**: Design documents from `specs/015-configure-planning-horizons/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/settings-api.yaml`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (`[US1]`, `[US2]`, `[US3]`)
- Every task includes exact file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared transfer objects, TypeScript interfaces, and API client helpers

- [x] T001 Create UserSettingsRequest DTO (`@Min(1)`, `@Max(60)`) and UserSettingsResponse DTO in `app/src/main/java/group/four/nyare/nyare/dto/UserSettingsRequest.java` and `app/src/main/java/group/four/nyare/nyare/dto/UserSettingsResponse.java`
- [x] T002 [P] Define UserSettings interface in `frontend/src/types/api.ts`
- [x] T003 [P] Create settings API client with getSettings and updateSettings in `frontend/src/api/settings.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entity, service, and controller infrastructure that blocks user stories

- [x] T004 Augment User entity with planningHorizonDays and backdatingHorizonDays (integer, default 14, min 1, max 60) in `app/src/main/java/group/four/nyare/nyare/model/User.java`
- [x] T005 [P] Declare UserSettingsService interface in `app/src/main/java/group/four/nyare/nyare/service/UserSettingsService.java`
- [x] T006 Implement UserSettingsServiceImpl with getSettings and updateSettings in `app/src/main/java/group/four/nyare/nyare/service/impl/UserSettingsServiceImpl.java`
- [x] T007 Implement SettingsController handling GET and PUT `/api/settings` with SessionContext in `app/src/main/java/group/four/nyare/nyare/controller/SettingsController.java`
- [x] T008 [P] Add unit tests for UserSettingsServiceImpl and slice tests for SettingsController in `app/src/test/java/group/four/nyare/nyare/service/UserSettingsServiceImplTest.java` and `app/src/test/java/group/four/nyare/nyare/controller/SettingsControllerTest.java`

**Checkpoint**: Foundation ready - backend settings persistence and REST contracts are operational

---

## Phase 3: User Story 1 - Configure Planning Horizon for Study Scheduling (Priority: P1) 🎯 MVP

**Goal**: Students configure their planning horizon (1 to 60 days, default 14) and the AI planner schedules upcoming event preparation tasks within that dynamic window.

**Independent Test**: Set planning horizon to 21 days; verify an academic event 18 days in the future produces study preparation tasks during note processing.

- [x] T009 [US1] Update planner system prompt template to use dynamic `{days}` placeholder for upcoming events in `app/src/main/resources/planner_sys-prompt.st`
- [x] T010 [US1] Parameterize StudyPlannerEngine process method to accept planningScopeDays and render `{days}` in `app/src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- [x] T011 [US1] Update StudyPlannerServiceImpl to resolve user planningHorizonDays and pass into StudyPlannerEngine in `app/src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- [x] T012 [P] [US1] Add unit test in `app/src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java` verifying dynamic `{days}` template injection

**Checkpoint**: User Story 1 complete - AI planner respects custom planning lookahead horizon

---

## Phase 4: User Story 2 - Configure Note Backdating Horizon (Priority: P2)

**Goal**: Students configure their maximum note backdating horizon (1 to 60 days, default 14) to record retrospective class notes without rejection errors.

**Independent Test**: Set backdating horizon to 30 days; verify a note dated 25 days ago saves successfully while a note dated 35 days ago returns 400 Bad Request.

- [x] T013 [US2] Update NoteServiceImpl createNote and updateNote to fetch user backdatingHorizonDays and validate entryDate in `app/src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- [x] T014 [P] [US2] Add unit tests in `app/src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java` verifying note creation acceptance and rejection against custom backdate limits

**Checkpoint**: User Story 2 complete - Note backdating validation dynamically enforces user preference

---

## Phase 5: User Story 3 - View and Edit Preferences via Dedicated Settings Page (Priority: P3)

**Goal**: Students access a dedicated Settings page from the hamburger drawer, view current horizons, save modifications with toast confirmation, and revert to defaults with a single click.

**Independent Test**: Open hamburger drawer, navigate to `/settings`, edit horizons, save with toast confirmation, click "Reset to Defaults", and verify fields return to 14 days.

- [x] T015 [P] [US3] Register `/settings` route in `frontend/src/router/index.ts`
- [x] T016 [P] [US3] Add Settings navigation link with Lucide Settings icon in `frontend/src/components/HamburgerMenu.vue`
- [x] T017 [US3] Implement SettingsView component with DetailTopBar, numeric inputs (bounds 1-60), tactile Save button, Reset to Defaults button, and useToasts in `frontend/src/views/SettingsView.vue`
- [x] T018 [P] [US3] Create component unit tests for SettingsView verifying render, validation, save, and reset in `frontend/src/views/__tests__/SettingsView.spec.ts`

**Checkpoint**: User Story 3 complete - Frontend settings page fully wired to backend API

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify end-to-end behavior, integration coverage, and documentation consistency

- [x] T019 [P] Update `frontend/src/components/__tests__/HamburgerMenu.spec.ts` to assert Settings navigation item presence and routing
- [x] T020 Run end-to-end verification scenarios per `specs/015-configure-planning-horizons/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion - blocks User Stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion (can run in parallel with US1).
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion (can run in parallel with US1 & US2).
- **Polish (Phase 6)**: Depends on all user stories completed.

### Parallel Opportunities

- **Phase 1**: T002 and T003 can execute in parallel once T001 structure is set.
- **Phase 2**: T005, T008 can execute in parallel with service and controller tasks.
- **Phases 3, 4, 5**: US1, US2, and US3 are largely decoupled across backend engine, note service, and frontend views.

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup DTOs and API types.
2. Complete Phase 2: User entity columns, service, and `/api/settings` endpoints.
3. Complete Phase 3: Dynamic planning horizon in `StudyPlannerEngine`.
4. Validate User Story 1 independently.

### Incremental Delivery
1. Add User Story 2: Note backdating validation against user preference.
2. Add User Story 3: Dedicated frontend Settings page in hamburger menu.
3. Run Phase 6 end-to-end verification.
