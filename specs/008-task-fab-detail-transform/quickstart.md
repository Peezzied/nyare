# Quickstart: Validate Task FAB and Task Detail Container Transform

## Prerequisites

1. Run the backend on port 8080 with at least one course.
2. Run `npm run dev` in `frontend/`.
3. Sign in as a user with courses and tasks. Use a 390 px wide viewport.

## Automated checks (run in `frontend/`)

```bash
npm run lint:oxlint
npm run type-check
npx vitest run src/utils/__tests__/taskForm.spec.ts
npx vitest run src/components/tasks/__tests__/TaskDetailPanel.spec.ts
npx vitest run src/components/tasks/__tests__/TaskContainerModal.spec.ts
npx vitest run src/views/__tests__/TodoView.spec.ts
```

## Manual scenarios

1. **Create (US1)**: Open the to-do view. Tap the add task button. Enter a title, choose a course, save. Expect the task in Backlog. Reload. Expect the task to persist.
2. **Sections (US1)**: Create 3 tasks: one with a date, one with a duration only, one with neither. Expect Scheduled, Later, and Backlog.
3. **Validation (US1)**: Save with an empty title. Expect a blocked save and a field message. Repeat with no course.
4. **Detail (US2)**: Tap a task row. Expect the container to expand from the row. Expect title, status, course, date, duration, description, and section. Expect a source note link only on tasks that have a note.
5. **Dismiss (US3)**: Dismiss with the back control, the Escape key, and the browser back button. Expect contraction to the row. Expect the same scroll position and filter.
6. **Edit and delete (US4)**: Change the title and save. Expect the list to show it. Delete the task and confirm. Expect the row to disappear and the container to fade out.
7. **Failure (US4)**: Stop the backend. Save. Expect an error with Retry and the typed data kept.
8. **Motion (US5)**: Enable reduced motion in the operating system. Open and dismiss the container. Expect an opacity fade with no scaling.
9. **Direct link**: Open `/tasks/<id>` in the address bar. Expect the detail without origin animation. Use an unknown ID. Expect a redirect to the list.

Contracts: [contracts/ui-contracts.md](contracts/ui-contracts.md). Data rules: [data-model.md](data-model.md).
