# Nyare — Agent Guide

Calendar-first academic planner. Class schedule → course-linked journal (`Note` with `entryDate`) → explicit Process trigger → Tasks / Academic Events / Academic Context → virtual Study Plan → calendar view.

## Repo layout

- `backend/` — Spring Boot 4.1.1, Java 25 (toolchain), Gradle, JPA/Hibernate + SQLite (`nyare.db`, gitignored). Base package `group.four.nyare.nyare`.
- `frontend/` — Vue 3 + Vite + TypeScript + Tailwind 4. Alias `@` → `src/`.
- `docs/` — domain truth: `conceptual-model.md`, `system-workflows.md`, `mvp-boundaries.md`.
- `backend/docs/conventions.md` — backend rule index (architecture, entities, DTOs, services, exceptions, REST, SQLite, testing). Read it before backend changes.

## Backend commands (`backend/`)

```bash
./gradlew compileJava                                            # fast compile check
./gradlew test --tests "group.four.nyare.nyare.ClassName.methodName"  # single test (preferred)
./gradlew build                                                  # last resort only
```

- Tests force `spring.profiles.active=test` + `--enable-native-access=ALL-UNNAMED` (already in `build.gradle`).
- **Integration tests: run ONE at a time, ask the user before running more** (SQLite in-memory + AI cost).

## Frontend commands (`frontend/`)

```bash
npm run dev          # vite dev server
npm run type-check   # vue-tsc --build (part of build)
npm run lint         # oxlint + eslint with --fix
npm run format       # prettier, src/ only
npm run test:unit    # vitest (jsdom, e2e/ excluded)
```

## Env & AI provider setup (backend)

- Gitignored, never commit: `.env`, `src/**/application*.properties`, `*.db`. Only `*.example` templates are committed — copy them for local dev.
- Required keys: `GOOGLE_API_KEY`, `GROQ_API_KEY` (via `.env` + spring-dotenv).
- Default profile is `dev,google` (`application.properties`); test profile group maps to `groq` (`spring.profiles.group.test=groq`). Switch providers with `spring.ai.model.chat` (`google-genai` vs `openai`+Groq base-url); each provider file carries a placeholder key for the unused SDK so autoconfig stays clean.
- Prompts live in `backend/src/main/resources/planner_sys-prompt.st` and `image_sys-prompt.st`; shared params under `nyare.ai.*` (temperature 0.1).
- Never touch `nyare.db` from tests: tests use shared in-memory SQLite (`file::memory:?cache=shared`, `ddl-auto=create-drop`, Hikari pool size 1). Prod uses `ddl-auto=update`, `open-in-view=false`.

## Backend invariants

- Layering: controller → **service interface** → `service.impl` → repository → DB. Controllers never touch repositories; entities never leave the service layer (DTOs only). Packages strictly lowercase.
- Services: class-level `@Transactional(readOnly = true)`, explicit `@Transactional` on mutations.
- Exceptions: only `ResourceNotFoundException` (404) / `BadRequestException` (400); `@Valid` failures handled by `GlobalExceptionHandler` (RFC 7807). No new exception classes.
- Tests: unit = JUnit5 + Mockito, no Spring (`@Mock` repos, `@InjectMocks` on `*Impl`); controllers = `@WebMvcTest` + `@MockitoBean` on the **service interface**. AssertJ, `// given/when/then`, name `method_condition_expected`.
- Process entrypoints: `StudyPlannerService.getPlannerStatus(Long)` exposes pending dirty note counts/dates (`GET /api/study-planner/status`); `StudyPlannerService.processNotes(Long)` executes two-phase multi-day sequential extraction and today-anchored study planning. Exposed as `POST /api/study-planner/process` — SSE stream (`init`/`done`/`error` events) on a virtual thread; SSE timeout 60s exceeds AI timeouts (planner 50s, image 30s) so slow models surface as SSE error events.

## Domain rules (do not violate)

- `StudyPlan` is virtual — never a DB table. Tri-state is derived per `Task`: `SCHEDULED` (has `scheduledDate`), `LATER` (no date + has `duration`), `BACKLOG` (neither).
- Planner scope: courses with dirty notes processed in current run; backdating horizon max 14 days; generates `AI_GENERATED` prep tasks for events ≤14 days out, skipping courses that already have open `SCHEDULED`/`LATER` tasks. Planner may only write `scheduledDate`/`duration` (+ generate event tasks, promote `BACKLOG`); never rewrite/merge task titles, never invent deadlines, no priority scores, no time-blocking, day-level granularity only.

## Environment bootstrap

- Windows: `setup-env.bat` installs Scoop packages (`temurin25-jdk`, `nodejs-lts`, python) + `graphify`. Requires Node per `frontend/package.json` engines (22.18+/24.12+).
