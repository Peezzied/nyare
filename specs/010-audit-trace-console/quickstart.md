# Quickstart: Dev Audit Trace Console

**Feature**: `010-audit-trace-console` | **Date**: 2026-10-24

This guide describes how to run and validate the backend Thymeleaf Dev Audit Trace Console end-to-end.

## 1. Prerequisites

- Java 25 installed
- Local environment variables set in `.env` (e.g. `GOOGLE_API_KEY` or `GROQ_API_KEY`)

> [!NOTE]
> The dev dashboard lives strictly inside the backend (`src/dev`) as a Thymeleaf web application. The frontend dev server is not required to use or validate this console.

---

## 2. Launch the Backend Dev Server

The backend dev server includes the `src/dev` sourceSet, which compiles Thymeleaf and the dev trace console:

```bash
cd backend
./gradlew devRun
```
*Expected Output*: Spring Boot initializes with profile `dev`, executes `dev.sql` seed fixtures, and binds to port `8080`.

---

## 3. End-to-End Validation Scenarios

### Scenario 1: Open the Dev Console in Browser
1. In your browser, navigate to: `http://localhost:8080/dev/audit-trace`
2. Confirm the page renders the server-side Thymeleaf layout:
   - Nyare parchment aesthetic (warm background, ocean cyan accents, slate text).
   - Category filter pills (`LIFECYCLE`, `TASK_PLANNING`, `TASK_PROMOTION`, `EVENT_PLANNING`, `IMAGE_CONTEXT`, `UNRELATED_INFO`, `DATA_MUTATION`).
   - `ERROR` severity filter pill.
   - Course entry list for top-level database navigation.
3. If no planning run has occurred since startup, verify the empty state placeholder is shown.

### Scenario 2: Observe Live Audit Streaming (SSE)
1. In a separate terminal or API tool, trigger a planning run:
   ```bash
   curl -X POST http://localhost:8080/api/study-planner/process \
     -H "Cookie: NYARE_SESSION=<session-id>"
   ```
2. Switch back to the browser at `http://localhost:8080/dev/audit-trace`.
3. Confirm new events appear in the feed without refreshing the browser:
   - `LIFECYCLE` (started): showing user origin badge, run ID, and target note count.
   - Domain planning audits (Task Planning, Event Planning, Task Promotion, etc.).
   - `LIFECYCLE` (completed): showing elapsed milliseconds and extracted counts.

### Scenario 3: Trace an Audit Card to Stored Records
1. In the feed, click on a `TASK_PLANNING` audit card.
2. Confirm the right-hand inspection drawer fetches and renders the source `Note` record.
3. In the relation groups, click "Child Tasks" to navigate to the generated `Task` record.
4. Click "Owning Course" to walk up to the parent `Course` record. Confirm breadcrumb trail allows navigating back.

### Scenario 4: Pause and Filter the Audit Feed
1. During an active planning run, click the "Pause" button.
2. Confirm the indicator changes to "Paused" and newly arriving events do not jump the scroll position.
3. Select the `UNRELATED_INFO` filter chip. Confirm only filtered non-academic statement audits remain visible.
4. Click an `UNRELATED_INFO` card. Confirm the source note content is loaded and the rejected statement is highlighted.
5. Click "Resume" to reconnect the live stream.

### Scenario 5: Capture and Inspect AI Processing Errors
1. Trigger a planning request configured to fail (e.g. invalid API key or disconnected model endpoint).
2. Confirm an `ERROR` audit card is rendered in the feed with error styling.
3. Click the error card. Verify the drawer displays the exception class, error message, and expandable stack preview.
4. Click the `ERROR` filter chip to isolate failed runs.

### Scenario 6: Inspect CRUD Data Mutations and User Origin
1. Perform an entity mutation (e.g. create a new course via `POST /api/courses` or delete a task via `DELETE /api/tasks/{id}`).
2. Verify a `DATA_MUTATION` audit card appears in the feed displaying:
   - Action type badge (`CREATE`, `DELETE`, etc.).
   - User origin badge (e.g. `student_jane`).
   - Trigger badge (`WEB_SESSION`).
3. If the action was `DELETE`, click the card and verify the drawer displays the tombstone state with deletion timestamp without throwing a 404 error.

---

## 4. Production Boundary Verification

Verify that dev console components, Thymeleaf templates, and controllers are completely excluded from the production artifact:

```bash
cd backend
./gradlew bootJar
jar -tf build/libs/nyare-0.0.1-SNAPSHOT.jar | grep -i "DevAudit"
jar -tf build/libs/nyare-0.0.1-SNAPSHOT.jar | grep -i "thymeleaf"
```
*Expected Outcome*: Command returns 0 results. No dev classes, templates, or Thymeleaf libraries exist in the production JAR (satisfies FR-001, SC-006, and Constitution Principle X).
