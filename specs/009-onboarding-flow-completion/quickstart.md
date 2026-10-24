# Quickstart: Validating Onboarding Flow Completion

Contracts: [contracts/onboarding-api.md](contracts/onboarding-api.md). Data: [data-model.md](data-model.md).

## Prerequisites

- Backend running on `:8080` (`./gradlew bootRun` in `app/`), frontend on `:5173` (`npm run dev` in `frontend/`).
- To exercise account creation, unset `VITE_DEV_USER` in `frontend/.env` (dev mode blocks Add account by design). Restart Vite.

## Automated checks

```bash
# frontend/
npx vitest run src/router src/composables/__tests__/useAuth.spec.ts src/composables/__tests__/useCourseDrafts.spec.ts src/views/__tests__/CreateScheduleView.spec.ts src/views/__tests__/WelcomeView.spec.ts
npm run type-check
npm run lint:oxlint

# app/ (one test at a time)
./gradlew test --tests "group.four.nyare.nyare.service.UserServiceImplTest"
./gradlew test --tests "group.four.nyare.nyare.controller.UserControllerTest"
```

## Manual scenarios

1. **New account reaches schedule creation (US1)**: Select-account -> Add account -> enter a username -> lands on Welcome -> Continue -> lands on create-schedule. No `/schedule` screen appears. Opening `/schedule` directly redirects to Welcome (not onboarded) or Calendar (onboarded).
2. **No silent course loss (US2)**: On create-schedule enter a course, press the drawer Save. Toast says the course is kept for this session, not saved. Press back: discard dialog appears. "Keep editing" keeps the course; "Discard" drops it and leaves. After Save all succeeds, back shows no dialog.
3. **Failed save still counts (US2)**: Stop the backend, press Save all (error toast), press back. The dialog still appears.
4. **Completion (US3)**: With two courses entered, press Save all. App lands on `/calendar`. `GET /api/users/me` returns `onboarded: true`. Reload: stays on calendar. Open `/welcome`: redirects to calendar.
5. **Existing accounts (US3)**: Start the backend against a database created before this feature. `dev_student` and any older account return `onboarded: true` and land on the calendar.
6. **Resume (US3)**: Add an account, stop at create-schedule, close the tab, sign in again as that account. App routes to Welcome. Opening `/calendar` redirects to Welcome.
7. **Completion API guards**: `POST /api/users/me/onboarding/complete` with no session -> 401. With a session for an account that has no courses -> 400. With courses -> 200, repeat call -> 200.

## Expected outcome

All automated checks pass and scenarios 1-7 behave as described. Spec success criteria SC-001 through SC-006 map to scenarios 1, 2, 4, and 6.
