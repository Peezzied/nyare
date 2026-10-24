# Quickstart: Headless Flow Harness Execution

**Feature**: `005-headless-flow-harness`
**Date**: 2026-10-18

This guide explains how to run the headless end-to-end flow harness to verify the data layer and AI planning pipeline without UI components.

## Prerequisites

1. **Backend Server Running on Port 8080**:
   - In `app/`:
     ```bash
     SPRING_DATASOURCE_URL="jdbc:sqlite:flow_test.db" ./gradlew bootRun
     ```
   - Must be running with the default profile (`dev,google`) and valid `GOOGLE_API_KEY` in `app/.env`.
   - The server uses a throwaway SQLite database file `flow_test.db` created in the `app/` directory.
   - **When finished, the developer deletes `flow_test.db` manually.**

2. **Frontend Dependencies**:
   - In `frontend/`:
     ```bash
     npm install
     ```

## Running the Flow Harness

### 1. Fast Non-AI Pipeline Verification (< 2 minutes)
Runs authentication, catalog (courses & schedules), notes, task mutations, event mutations, and planner status checking:

```bash
npm run test:flow
```
*(or `npx vitest run -c vitest.flow.config.ts`)*

### 2. Full End-to-End AI Flow Verification (< 10 minutes)
Runs the full scenario including the real Spring AI Planner execution and image extraction:

```bash
npm run test:flow:ai
```
*(or `RUN_AI=1 npx vitest run -c vitest.flow.config.ts`)*

## Backend Reachability Validation

Before any flow test runs, the suite validates backend reachability by calling `GET /api/users/me`. If the backend is down or returns a 5xx error, the suite fails immediately with the step name and cause (SC-005). The test runner does not retry or wait; the developer must ensure the backend is healthy before invoking the suite.

## Verification Criteria

- All assertions in the suite pass.
- In AI mode, the SSE stream completes with `summary.affectedCourseIds` returned, and tasks/events are refetched cleanly.
- Tasks comply with the tri-state planning model (`SCHEDULED`, `LATER`, `BACKLOG`).
- No task titles or deadlines are mutated.