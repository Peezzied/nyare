# Nyare Frontend — Agent Guide

Vue 3, Vite, TypeScript, and Tailwind 4 run the frontend application.
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

## Repository Rules

- Follow Ponytail minimalism rules in `.agents/rules/ponytail.md`.
- Follow ASD-STE100 technical English rules in `.agents/rules/asd-ste100.md`.

## Domain Documentation

Read the domain documents before you create frontend components:
- `docs/conceptual-model.md` defines domain entities and the virtual study plan.
- `docs/system-workflows.md` defines system workflows and planner logic.

## Commands (run in `frontend/`)

```bash
npm run dev          # vite dev server
npm run build        # type-check + build-only in parallel (run-p)
npm run type-check   # vue-tsc --build
npm run lint:oxlint  # fast inner loop linter
npm run lint         # oxlint + eslint with --fix
npm run format       # prettier, src/ only
npm run test:unit    # vitest unit tests (jsdom, e2e/ excluded)
npx vitest run src/components/__tests__/HelloWorld.spec.ts  # single test file
```

- Node engines: `^22.18.0 || >=24.12.0`.
- Path alias: `@` maps to `src/`.

## Verify Changes

Run `npm run lint:oxlint` when you edit code.
Run `npm run type-check` after you edit TypeScript or Vue files.
Run `npm run lint` to fix linting errors automatically.
Fix all remaining errors before you finish tasks.

## State Management

Use Vue composables with `ref` or `reactive` to manage application state.
Do not install Pinia.
The project does not require external state libraries.

## Backend Integration

The backend server runs on port 8080.
Configure `server.proxy` in `vite.config.ts` to route `/api` requests to `http://localhost:8080`.
Use the native `fetch` function for REST endpoints.
Use `EventSource` to receive Server-Sent Events from `POST /api/study-planner/process`.
Do not install Axios.

## TypeScript and Tests

- Project references include `tsconfig.node.json`, `tsconfig.app.json`, and `tsconfig.vitest.json`.
- The application tsconfig file excludes test files.
- The compiler enables `noUncheckedIndexedAccess`.
- Vitest executes tests in the `jsdom` environment.
- Store unit test files in `src/**/__tests__/*.spec.ts`.
- Run `npx vitest run <file>` to test a single file.

## Lint and Format

- ESLint combines Vue rules, TypeScript rules, and Oxlint rules.
- Prettier formats source code in `src/`.
- Do not format code with ESLint.
- Use single quotes in code.
- Indent code with two spaces.
- Do not write semicolons.

## Conventions

- Use `<script setup lang="ts">` and the Composition API for components.
- Define routes in `src/router/index.ts`.
- Import route components dynamically.
- Read skill guides in `.agents/skills/` before you write Vue code.
