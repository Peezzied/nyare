---

description: "Task list for Onboarding Flow Completion"
---

# Tasks: Onboarding Flow Completion

**Input**: Design documents from `/specs/009-onboarding-flow-completion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/onboarding-api.md, quickstart.md

**Tests**: Spec implies coverage via existing suites; test-update tasks are included where behavior changes. New backend tests follow `method_condition_expected` + `// given/when/then`.

**Paths**: `backend/` = `backend/src/main/java/group/four/nyare/nyare/...`; `frontend/` = `frontend/src/...`

## Phase 1: Setup

No setup tasks — all infrastructure exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `onboarded` flag and completion endpoint block US1 (router gating needs the flag) and US3 (writes the flag). US2 is frontend-only and is NOT blocked — it may run in parallel with this phase.

- [x] T001 [P] Add `onboarded` field to `User` entity in `backend/model/User.java`: `@Column(nullable = false, columnDefinition = "boolean default true") private Boolean onboarded` with getter/setter (DDL default `true` migrates existing rows to onboarded per FR-006)
- [x] T002 [P] Add `onboarded` field to `UserResponse` in `backend/dto/UserResponse.java`: constructor param + getter/setter, serialized on every user-returning endpoint
- [x] T003 Add `existsByUserId(Long userId)` to `backend/repository/CourseRepository.java`
- [x] T004 Declare `UserResponse completeOnboarding(Long userId)` in `backend/service/UserService.java` with Javadoc (idempotent; `BadRequestException` when user owns no course; `ResourceNotFoundException` when user missing)
- [x] T005 Implement `completeOnboarding` in `backend/service/impl/UserServiceImpl.java`: `@Transactional`, load user or throw `ResourceNotFoundException`, if already onboarded return as-is, else require `courseRepository.existsByUserId(userId)` else `BadRequestException("Add at least one course before completing onboarding")`, set `onboarded = true`, save, return `toResponse`. Also: `createUser` sets `onboarded = false` explicitly; `toResponse` maps `user.getOnboarded()`
- [x] T006 Add `POST /api/users/me/onboarding/complete` to `backend/controller/UserController.java`: session self-check identical to `getCurrentUser` (401 without session), resolves `SESSION_USER_ID`, calls `userService.completeOnboarding(userId)`, returns `ResponseEntity.ok(...)`
- [x] T007 Seed `dev_student` as onboarded in `backend/src/main/resources/data.sql`: add `onboarded` to the users INSERT columns with value `1`
- [x] T008 [P] Add `onboarded: boolean` to `UserResponse` in `frontend/src/types/api.ts`
- [x] T009 [P] Add `completeOnboarding()` to `authApi` in `frontend/src/api/auth.ts`: `POST /api/users/me/onboarding/complete`, returns `UserResponse`
- [x] T010 Extend `useAuth` in `frontend/src/composables/useAuth.ts`: add `completeOnboarding(): Promise<UserResponse>` that calls `authApi.completeOnboarding()` then `setSessionUser(result)`; expose `isOnboarded` computed (`user.value?.onboarded === true`)
- [x] T011 Backend unit tests in `backend/src/test/java/group/four/nyare/nyare/service/UserServiceImplTest.java`: `completeOnboarding_userNotOnboardedWithCourse_marksOnboarded`, `completeOnboarding_alreadyOnboarded_returnsUnchanged`, `completeOnboarding_noCourses_throwsBadRequest`, `completeOnboarding_missingUser_throwsNotFound`; and `UserControllerTest.java`: `completeOnboarding_noSession_returns401`, `completeOnboarding_withSession_returns200`
- [x] T012 Register draft reset on session clear in `frontend/src/composables/useCourseDrafts.ts`: use `createCache(() => { draftCourses.value = []; draftSchedules.value = [] })` so `clearSessionUser()`/`resetAllCaches()` empties drafts (FR-017)

**Checkpoint**: `onboarded` readable from `/me`, writable via complete endpoint. US2 work may proceed in parallel throughout.

---

## Phase 3: User Story 1 — New account reaches the schedule creator (P1) 🎯 MVP

**Goal**: Remove the dead `ScheduleView` and wire the onboarding chain so Add account → Welcome → create-schedule → (save) → calendar.

**Independent Test**: Add a new account on the account selection page, continue through Welcome, land on create-schedule. Opening `/schedule` redirects via `/`. No dead screens.

- [x] T101 [US1] Update `frontend/src/router/index.ts`: delete the `/schedule` route entry and the `ScheduleView` import; add `{ path: '/schedule', redirect: '/' }` so stale bookmarks resolve through the guard
- [x] T102 [P] [US1] Update `frontend/src/views/WelcomeView.vue`: `proceed()` pushes `/create-schedule` instead of `/schedule`
- [x] T103 [US1] Update `frontend/src/views/CreateScheduleView.vue`: `closeImmediately()` pushes `/welcome` instead of `/schedule` (spec: back goes to previous onboarding step)
- [x] T104 [US1] Delete `frontend/src/views/ScheduleView.vue` and remove any `ScheduleView` import references (router already updated in T101)
- [x] T105 [P] [US1] Update `frontend/src/views/__tests__/CreateScheduleView.spec.ts`: change the close-destination assertion `push).toHaveBeenCalledWith('/schedule')` to `'/welcome'`
- [x] T106 [US1] Verify `frontend/src/views/AccountSelectView.vue` already pushes `/welcome` after `handleCreateAccount` (line ~130) — no change needed, confirm only

**Checkpoint**: Onboarding chain Start → Select-account → (add) → Welcome → Create-schedule works; `/schedule` no longer serves a dead screen.

---

## Phase 4: User Story 2 — Saved courses are never silently lost (P1)

**Goal**: Staged-but-unpersisted courses count as unsaved work; the per-course save no longer claims "saved"; discard clears staged drafts.

**Independent Test**: Enter a course, press drawer Save (stages only), press back → discard dialog appears. After Save all succeeds, back shows no dialog. With backend down and Save all failed, back still warns.

- [x] T201 [US2] Update `hasUnsavedChanges` in `frontend/src/views/CreateScheduleView.vue`: `editors.value.some(isEditorDirty) || draftCourses.value.length > 0` (drafts exist only until `flush()` persists them — covers staged-only and failed-flush cases per FR-010/FR-013)
- [x] T202 [US2] Update `handleDiscard` in `frontend/src/views/CreateScheduleView.vue`: after reverting/resetting editors, call `resetDrafts()` from `useCourseDrafts()` so discarded courses leave the staged store (add `resetDrafts` to the existing destructure)
- [x] T203 [US2] Update the per-course save toast in `frontend/src/views/CreateScheduleView.vue` `saveCourse()`: change `'Course and schedule saved successfully.'` to `'Course kept for this session. Use Save all to save it to your account.'` (FR-012)
- [x] T204 [P] [US2] Update `frontend/src/views/__tests__/CreateScheduleView.spec.ts`: fix the save-course success-toast assertion to the new copy; add a test asserting the discard dialog opens when `draftCourses` is non-empty but no editor is dirty (stage via `useCourseDrafts().stageCourse` directly); add a test that discard clears `draftCourses`

**Checkpoint**: No path lets a staged-only course leave the screen silently.

---

## Phase 5: User Story 3 — Onboarding completion is remembered (P2)

**Goal**: `onboarded` gates routes; completing Save all during onboarding marks the account and lands on calendar.

**Independent Test**: Fresh account signs in → guard sends them to Welcome. Save all succeeds → `POST /api/users/me/onboarding/complete` fires → lands on `/calendar`; `/welcome` and `/create-schedule` now redirect to `/calendar`. Pre-existing accounts are onboarded by default.

- [x] T301 [US3] Update `frontend/src/router/index.ts` `beforeEach` (after session resolution, sessioned-user branch): if `!user.onboarded` and target is `calendar`/`tasks`/`notes`/`note-new`/`note-edit`/`task-detail` → return `{ name: 'welcome' }`; if `user.onboarded` and target is `welcome`/`create-schedule` → return `{ name: 'calendar' }`; keep existing `start`-route logic but branch on `user.onboarded` (`calendar` vs `welcome`)
- [x] T302 [US3] Update `saveAll` in `frontend/src/views/CreateScheduleView.vue`: after `await flush()` succeeds, if `!user.value?.onboarded` call `useAuth().completeOnboarding()` and `router.push('/calendar')`; on completeOnboarding failure show `toast.error('Could not finish setup. Tap Save all to retry.')` and do not navigate (empty draft list makes retry safe)
- [x] T303 [P] [US3] Add router guard tests (new file `frontend/src/router/__tests__/onboarding.spec.ts` or existing router spec): not-onboarded sessioned user → `/calendar` redirects to `/welcome`; onboarded → `/welcome` redirects to `/calendar`; `/schedule` resolves through redirect
- [x] T304 [P] [US3] Add `completeOnboarding` coverage in `frontend/src/composables/__tests__/useAuth.spec.ts` (create file if absent): success sets session user with `onboarded: true`; API failure leaves user unchanged

**Checkpoint**: All three stories functional; onboarding state persists per account across reloads.

---

## Phase 6: Polish & Cross-Cutting

- [x] T401 Fix client/server username-length mismatch in `frontend/src/views/AccountSelectView.vue` line ~112: `trimmed.length < 3` to match backend `@Size(min = 3)` — prevents a 400 on 2-char usernames
- [x] T402 Remove stale `userId` fallback comment on `coursesApi.list` in `frontend/src/api/courses.ts` (backend ignores the param)
- [x] T403 Run `npm run type-check`, `npm run lint:oxlint`, and targeted `npx vitest run` for touched specs in `frontend/`; `./gradlew test --tests "group.four.nyare.nyare.service.UserServiceImplTest" --tests "group.four.nyare.nyare.controller.UserControllerTest"` in `backend/` (one integration-style test class at a time)
- [x] T404 Run `quickstart.md` manual scenarios 1–7 against a live dev backend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: Blocks US1 (guard reads `user.onboarded` — field must exist on the DTO/type) and US3. US2 frontend-only → may start immediately in parallel.
- **US1 (Phase 3)**: Needs Foundational (guard routing) for full end-to-end, but T101–T105 are pure frontend wiring and can start in parallel.
- **US3 (Phase 5)**: Needs Foundational fully complete.
- **Polish (Phase 6)**: After all stories.

### Within each phase

- Backend order: T001–T003 parallel → T004/T005 → T006 → T007 (T007 independent) → T011 tests.
- Frontend order: T008–T010 parallel → everything else.

### Parallel opportunities

- T001, T002, T003, T008, T009 in parallel.
- US2 (Phase 4) fully parallel with Foundational.
- T105, T203-adjacent spec updates marked [P] within stories.

---

## Implementation Strategy

**MVP**: Foundational + US1 (account reaches create-schedule, `/schedule` gone) — then US2 (data-loss guard) — then US3 (flag gating + completion).
