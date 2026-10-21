# Quickstart: Validate Course Archive

## Prerequisites

- Backend `.env` and `application*.properties` copied from `*.example` (see root `AGENTS.md`).
- Node 22.18+ or 24.12+.

## Automated checks

```bash
# backend/
./gradlew test --tests "group.four.nyare.nyare.service.impl.CourseServiceImplTest"
./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"

# frontend/
npx vitest run src/api/__tests__/services.spec.ts
npx vitest run src/components/__tests__/HamburgerMenu.spec.ts
npx vitest run src/views/__tests__/ManageCoursesView.spec.ts
npx vitest run src/__flow__/flows/04-archive.flow.spec.ts
npm run type-check
npm run lint:oxlint
```

Run integration tests one at a time and ask the user before more.

## Manual scenarios (backend on 8080, `npm run dev`)

1. Sign in. Create two courses with class times and a note each. Open Manage courses and archive course A. Confirm the dialog. Expect: A leaves the list, calendar, Tasks, Notes, and course picker. (US1, SC-004)
2. Open the hamburger panel and select Archive. Expect: A shows name, color, and archive date. (US2, FR-006)
3. Open A. Expect: class times, notes, tasks, and events with no edit, status, or delete control. Expect an Unarchive action. (FR-017)
4. Call `PUT /api/notes/{id}` for a note of A. Expect `400 Course is archived`. (FR-018)
5. Run Process. Expect: no task or event for A. (FR-005, SC-005)
6. Unarchive A from the Archive page. Expect: A returns to all views with the same tasks. (US3, SC-003)
7. Select Archive all on Manage courses. Confirm. Expect the count in the dialog, an empty Manage courses list, and an Undo toast for 8 seconds. Select Undo. Expect the same courses back. (US4)
8. Archive all again. Wait 8 seconds. Expect the courses stay archived. The Archive page has no "Unarchive all". (FR-020)
9. Delete an archived course from the Archive page. Expect a cascade warning, then removal. (US5)
10. Break the network and archive. Expect an error message and no state change. (Edge cases)

## Done

All automated checks pass and manual steps 1 to 10 match the expected result.
