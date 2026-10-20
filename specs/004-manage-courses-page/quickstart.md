# Quickstart: Validate Manage Courses Page

## Prerequisites

1. Backend: `cd backend`, then `./gradlew bootRun`. Port 8080.
2. Frontend: `cd frontend`, then `npm run dev`.
3. Sign in with an account that has three courses with class times.

## Automated checks (smallest scope)

Backend:

```bash
./gradlew test --tests "group.four.nyare.nyare.service.impl.CourseServiceImplTest"
./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"
```

Frontend:

```bash
npx vitest run src/views/__tests__/CreateScheduleView.spec.ts
npx vitest run src/utils/__tests__/scheduleDiff.spec.ts
npx vitest run src/views/__tests__/ManageCoursesView.spec.ts
npx vitest run src/components/__tests__/HamburgerMenu.spec.ts
npm run lint:oxlint
npm run type-check
```

The `CreateScheduleView` spec must pass before and after the drawer extraction.

## Manual scenarios

1. **Open** (US1, SC-002): Tap the hamburger button. Tap "Manage courses". Expect all three courses with color dot, name, and weekday-sorted times.
2. **Edit time** (US2, SC-001): Tap Edit on a course. Change Monday 09:00-10:30 to Tuesday 13:00-14:30. Tap Save. Return to the calendar. Expect the class on Tuesday only.
3. **Invalid range** (SC-004): Set start after end. Expect Save disabled or blocked with a message.
4. **Rename** (US3): Rename a course. Expect the new name on calendar, notes, and the course picker. Expect notes and tasks still linked.
5. **Clash**: Move a class onto another course's slot. Expect a blocked save that names the other course.
6. **Add** (US4): Tap "Add course". Expect a blank drawer. Save. Expect the course in the list without a reload.
7. **Delete** (US4, SC-005): Tap Delete. Expect a dialog that names notes, tasks, events, and class times. Cancel keeps the course. Confirm removes it.
8. **Discard guard**: Edit, then close the drawer. Expect a discard or keep prompt.
9. **Failure** (FR-014): Stop the backend. Save. Expect an error toast and the entered values kept.
