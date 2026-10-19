# Quickstart: Validate Session Enforcement

Run each scenario from the repository root. Run backend integration tests one at a time and ask before more.

## 1. Backend unit and controller checks (about 2 minutes)

```bash
cd backend
./gradlew compileJava
./gradlew test --tests "group.four.nyare.nyare.controller.SessionEnforcementControllerTest"
./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"
```

Expected: every protected path returns 401 with no session. `CourseControllerTest` passes with a session attribute set.

## 2. Backend cross-user check (about 1 minute)

```bash
./gradlew test --tests "group.four.nyare.nyare.service.impl.TaskServiceImplTest"
```

Expected: a by-ID call with another user's ID throws `ResourceNotFoundException`.

## 3. Live 401 check (about 3 minutes)

1. Start the backend with the test profile.
2. Run `curl -i http://localhost:8080/api/courses`.
3. Expect `HTTP/1.1 401` and `application/problem+json`.
4. Repeat for `/api/tasks` and `/api/notes`.

## 4. Frontend unit and type checks (about 2 minutes)

```bash
cd frontend
npm run type-check
npx vitest run src/api src/router src/composables
```

Expected: client tests prove the handler fires on 401 and skips `/api/users/me`. Router tests prove the session clears and route `start` opens.

## 5. Flow suite (about 3 minutes, backend running)

```bash
npx vitest run src/__flow__/flows/01-session-catalog.flow.spec.ts
```

Expected: the logged-in flow passes. The new anonymous step gets 401 on course, task, and note calls.

## 6. Manual end-to-end (about 2 minutes)

1. Run `npm run dev` and log in.
2. End the session on the backend (`curl -X POST` with the cookie to `/api/users/logout`).
3. Trigger a data load in the app.
4. Expect the account screen. Log in again and expect the calendar with data.

See [contracts](contracts/session-enforcement.md) and [data-model.md](data-model.md) for exact behavior.
