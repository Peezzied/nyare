# Nyare Frontend — Agent Guide

Vue 3, Vite, TypeScript, and Tailwind 4 run the frontend application.
This is a mobile-first application.
The repository contains scaffold code and demo components.

## Core Domain Rules

- `StudyPlan` is virtual and does not exist as a database entity.
- Calculate `StudyPlan` views dynamically.
- Derive tri-state task status for each `Task`:
  - `SCHEDULED`: task has a `scheduledDate`.
  - `LATER`: task has a `duration` and no `scheduledDate`.
  - `BACKLOG`: task has no `scheduledDate` and no `duration`.
- Use day-level granularity for task planning.
- Do not implement time-blocking or priority scores.
- Keep views and components pure. Never embed development environment rules (`import.meta.env.DEV`, `VITE_DEV_USER`) or dev-specific template branches into views. Enforce dev constraints at service boundaries or composables.

## Repository Rules

- Follow Ponytail minimalism rules in `.agents/rules/ponytail.md`.
- Follow ASD-STE100 technical English rules in `.agents/rules/asd-ste100.md`.
- Follow Vue skill rules in `.agents/rules/vue-skills.md`.

## Domain Documentation

Read the domain documents before you create frontend components:

- `DESIGN.md` defines the UI/UX design system, brand fonts, colors, and component patterns.
- `docs/conceptual-model.md` defines domain entities and the virtual study plan.
- `docs/system-workflows.md` defines system workflows and planner logic.

## Commands (run in `frontend/`)

```bash
npm run dev          # vite dev server
npm run type-check   # vue-tsc --build
npm run lint:oxlint  # fast inner loop linter
npm run lint         # oxlint + eslint with --fix
npm run format       # prettier, src/ only
npm run test:unit    # vitest unit tests (jsdom, e2e/ excluded)
npm run build        # type-check + build-only (run only when necessary)
```

- Node engines: `^22.18.0 || >=24.12.0`.
- Path alias: `@` maps to `src/`.

## Verify Changes

Run `npm run lint:oxlint` when you edit code.
Run `npm run type-check` after you edit TypeScript or Vue files.
Run `npm run lint` to fix linting errors automatically.
Run the smallest test scope that verifies the change (see TypeScript and Tests).
Do not run `npm run build` for routine verification. Run `npm run build` only when necessary.
Fix all remaining errors before you finish tasks.

## State Management

Use Vue composables with `ref` or `reactive` to manage application state.
Do not install Pinia.
The project does not require external state libraries.

## Backend Integration

The backend server runs on port 8080.
Configure `server.proxy` in `vite.config.ts` to route `/api` requests to `http://localhost:8080`.
Use the native `fetch` function for REST endpoints.
Use `fetch` with a `ReadableStream` reader to receive Server-Sent Events from `POST /api/study-planner/process` (`EventSource` supports `GET` only). Pass an `AbortSignal` to `streamProcess`/`process` to cancel a run; the backend then stops at the next checkpoint and rolls back. After a cancel, `useProcess` rechecks `GET /api/study-planner/status`; a run that committed anyway sets `savedAfterCancel` and calls `onSavedAfterCancel` for a full tasks and events refetch.
Do not install Axios.

## Backend Roundtrip Conventions

Reduce HTTP roundtrips. Load each list once per intent.

- Trust mutation responses. `POST`/`PUT`/`PATCH` return the saved DTO. Update local `ref` state from that response. Do not call `list()` again after `create()`, `update()`, `updateStatus()`, or `delete()` (remove deleted IDs locally). Courses expose `create()` and `delete()` only (no `update` endpoint); apply those responses to the catalog cache.
- Filter on the server. Use `TaskListParams`, `ScheduleListParams`, `AcademicEventListParams`, `courseId`, `userId`, and `upcoming` query params. Never fetch the full list and filter in code when a param exists. The backend exposes no date-range params, so filter dates (calendar day, deadline windows) locally on the once-fetched cached list.
- No N+1 reads. Never call `get(id)` in a loop to build a list. Fetch the parent `list()` once. Use `Promise.all()` only for user-selected IDs, not to reconstruct a list.
- Derive locally. Compute tri-state (`SCHEDULED`/`LATER`/`BACKLOG`) with `getPlanCategory()` in `src/utils/planCategory.ts` and virtual `StudyPlan` views from cached tasks. Never add a backend endpoint for derived state.
- Cache static data. Hold `courses` and `schedules` in `useCatalog()` (`src/composables/useCatalog.ts`). Refetch only after a course or schedule mutation. Do not refetch them on task, note, or event changes.
- Refresh from Process summary. `studyPlannerApi.process()` resolves with `ProcessSummaryResponse`. Refetch only `tasks` plus `academic-events` for `affectedCourseIds` (fall back to full refetch of those two lists when counts are positive but no IDs are present). Do not refetch `courses`, `schedules`, or unaffected `notes`.

## TypeScript and Tests

- Project references include `tsconfig.node.json`, `tsconfig.app.json`, and `tsconfig.vitest.json`.
- The application tsconfig file excludes test files.
- The compiler enables `noUncheckedIndexedAccess`.
- Vitest executes tests in the `jsdom` environment.
- Store unit test files in `src/**/__tests__/*.spec.ts`.
- Run tests with the smallest scope that verifies the change. Use `npx vitest run <file>` for one file, or `npx vitest run <file> -t '<name>'` for one test. Prefer a targeted run over `npm run test:unit` (the full suite).

## Lint and Format

- ESLint combines Vue rules, TypeScript rules, and Oxlint rules.
- Prettier formats source code in `src/`.
- Do not format code with ESLint.
- Use single quotes in code.
- Indent code with two spaces.
- Do not write semicolons.

## Conventions

- Keep views and components pure and untainted by development environment rules.
- Enforce developer safeguards, auto-logins, and mock restrictions at service boundaries or composables.
- Use `<script setup lang="ts">` and the Composition API for components.
- Define routes in `src/router/index.ts`.
- Import route components dynamically.
- Read skill guides in `.agents/skills/` before you write Vue code.
- Run `npm run story` to preview component stories with Histoire.
- Do not include test code or test files when creating component stories (`.story.vue`).
- Write self-documenting code with clear names.
- Add comments sparingly to prevent visual noise.
- Apply conventional comments only to interfaces, methods, and tests.
- Document intent, parameters, return values, and edge cases.
- Do not add comments for self-explanatory code.

## MCP Servers (`.agents/mcp_config.json`)

The frontend configuration defines three MCP servers:

### `shadcn`

- **Purpose**: Search, view, and install shadcn-vue components.
- **When to use**:
  - Use this server when you add UI components to the frontend.
  - Use this server to inspect component code and examples before you install components.
  - Use this server to retrieve component audit checklists.

### `schedule-x`

- **Purpose**: Read Schedule-X calendar documentation and validate calendar configuration.
- **When to use**:
  - Use this server when you build or modify calendar views.
  - Use this server to validate calendar configuration objects and event data.
  - Use this server to find plugin instructions and starter templates.

### `vue-docs`

- **Purpose**: Read official Vue documentation.
- **When to use**:
  - Use this server when you verify Vue 3 APIs.
  - Use this server when you clarify Composition API behavior.
