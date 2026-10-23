# Quickstart: Unified Search and Filter

Validation guide proving the feature end-to-end. Implementation details live in `tasks.md`.

## Prerequisites

- Backend running: `cd backend && ./gradlew bootRun` (port 8080, dev profile, `nyare.db` seeded or with real data)
- Frontend running: `cd frontend && npm run dev`
- A logged-in session (account picker is open by design)

## Scenario 1 — Task search (P1)

1. Create two tasks: "Review Chapter 3 notes" (description "calc integrals") and "Buy groceries".
2. On To-do, type `review` in the search bar, pause ~300 ms.
3. **Expected**: only the first task shows. Type `integrals` → same result (description match). Clear → full list returns.

## Scenario 2 — Note search (P1)

1. Create a note titled "Lecture 5" containing the word `eigenvalue`.
2. On Notes, search `eigenvalue`. **Expected**: the note appears even if the preview text does not show the term. The dead topbar search icon is gone; the search bar sits below the header.

## Scenario 3 — Filters (P2)

1. On To-do, tap the filter button → sheet opens.
2. Pick a course → Apply. **Expected**: only that course's tasks; button shows the active dot.
3. Add a `from`/`to` range covering `scheduledDate` → **Expected**: only in-range scheduled tasks.
4. Toggle status Completed → **Expected**: only completed tasks.
5. Clear all → **Expected**: full list, dot gone.
6. Set `from` after `to` → **Expected**: visible error (400), list unchanged.

## Scenario 4 — Deadlines search (P2)

1. Calendar → deadlines mode. Search an event title fragment → matching events only.
2. Filter by deadline range → sections narrow. Switch to day/week → no search bar visible.

## Automated checks

```bash
# backend (run one at a time; ask before adding integration tests)
./gradlew test --tests "group.four.nyare.nyare.service.impl.TaskServiceImplTest.*search*"
./gradlew test --tests "group.four.nyare.nyare.controller.TaskControllerTest.listTasks_*"

# frontend (targeted, from frontend/)
npx vitest run src/composables/__tests__/useServerSearch.spec.ts
npx vitest run src/api/mocks/__tests__/adapter.spec.ts
npm run type-check && npm run lint:oxlint
```

## Done when

- Each scenario above passes on the running app.
- `curl` spot-check: `GET /api/tasks?q=review&from=2026-10-01&to=2026-10-31` returns filtered JSON after login session is established.
