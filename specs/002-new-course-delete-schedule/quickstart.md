# Quickstart: New Course Interface (Frontend Only)

## Prerequisites

- Node engines: `^22.18.0 || >=24.12.0`
- Run commands in `frontend/`

## Validate

```bash
npm run type-check
npm run lint:oxlint
npm run lint
npm run format
npm run test:unit
```

## Focused Tests

```bash
npx vitest run src/views/__tests__/ScheduleView.spec.ts
```

## Manual Checks

1. Open the schedule-creation surface at 390px width.
2. Enter a course name and choose a palette color.
3. Add at least three time blocks and verify each retains independent weekday, time, and room values.
4. Confirm `Add another time` moves below each newly added card.
5. Save with a successful backend response and verify catalog state updates without a full refetch.
6. Simulate a failed second Schedule creation and verify partial-failure messaging and retry state.
7. Confirm no backend or database commands are used.