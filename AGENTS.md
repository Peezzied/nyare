# Nyare — Agent Guide

Calendar-first academic planner. Class schedule → course-linked journal (`Note` with `entryDate`) → explicit Process trigger → Tasks / Academic Events / Academic Context → virtual Study Plan → calendar view.

## Repo layout

- `DESIGN.md` — UI/UX design system specification.
- `app/` — Spring Boot 4.1.1, Java 25 (toolchain), Gradle, JPA/Hibernate + SQLite (`nyare.db`, gitignored). Base package `group.four.nyare.nyare`.
- `frontend/` — Vue 3 + Vite + TypeScript + Tailwind 4. Alias `@` → `src/`. Design spec: `DESIGN.md`.
- `docs/` — domain truth: `architecture.md` (top-to-bottom system architecture), `conceptual-model.md`, `system-workflows.md`, `mvp-boundaries.md`.
- `docs/deliberations/` — final project documents and presentation materials for submission, built from `[OOP] Project Documentation Template.docx.md`. Deliverables only, not engineering truth.
- `app/docs/conventions.md` — backend rule index (architecture, entities, DTOs, services, exceptions, REST, SQLite, testing). Read it before backend changes.

## Deliverables (`docs/deliberations/`)

- Treat this folder as the submission staging area: course documentation, report, and presentation material.
- Keep the template section order and headings. Do not renumber or restructure.
- Take facts from `docs/*.md`, `AGENTS.md`, and the code. Do not invent values to fill template gaps. Leave placeholders and ask.
- Template guidance describes a desktop Swing application. Nyare is Spring Boot + Vue. Map each required topic to the real stack. Do not describe a Swing UI or local file persistence.
- Write Markdown first. Ask before generating `.docx`, `.pptx`, or exported PDFs.

## Tool Efficiency & Token Management

- Prioritize native agent tools (`view_file`, `replace_file_content`, `write_to_file`) over shell commands (`run_command`), MCP servers, and external CLI tools.
- Use read-only Git commands (`git ls-files`, `git status`, `git diff`, `git grep`) to survey project files. `git ls-files` automatically ignores untracked build artifacts.
- Do not use shell cmdlets (`Get-Content`, `cat`, `dir`, `ls`) to inspect or search files.
- Always specify `StartLine` and `EndLine` with `view_file`. Avoid full-file dumps.
- Always filter out build artifacts and virtual directories (`node_modules/`, `target/`, `.git/`, `.gradle/`, `dist/`, `build/`, `*.db`) from searches, scans, and directory reads.
- Use `graphify query`/`explain` and MCP tools only as secondary fallbacks when native file inspection does not provide sufficient context.
- Follow `.agents/rules/tool-efficiency.md`.

## Git Safety

- Do not commit, push, tag, or create pull requests unless the user explicitly requests it.
- Keep changes in the working tree. Stop after you edit and verify.
- When the user requests a commit, use `git caveman-commit`.
- Follow `.agents/rules/git-safety.md`.

## Code Comments

- Write self-documenting code with clear names.
- Add comments sparingly to prevent visual noise.
- Apply conventional comments only to interfaces, methods, and tests.
- Document intent, parameters, return values, and edge cases.
- Do not add comments for self-explanatory code.

## Backend commands (`app/`)

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
- Prompts live in `app/src/main/resources/planner_sys-prompt.st` and `image_sys-prompt.st`; shared params under `nyare.ai.*` (temperature 0.1).
- Never touch `nyare.db` from tests: tests use shared in-memory SQLite (`file::memory:?cache=shared`, `ddl-auto=create-drop`, Hikari pool size 1). Prod uses `ddl-auto=update`, `open-in-view=false`.

## Backend invariants

- Single deployable artifact: Spring Boot serves the compiled Vue SPA from `app/src/main/resources/static`. `SpaController` forwards unknown non-API routes to `index.html` while preserving RFC 7807 JSON errors on `/api/**`.
- Layering: controller → **service interface** → `service.impl` → repository → DB. Controllers never touch repositories; entities never leave the service layer (DTOs only). Packages strictly lowercase (`observability` included).
- Services: class-level `@Transactional(readOnly = true)`, explicit `@Transactional` on mutations.
- Exceptions: only `ResourceNotFoundException` (404) / `BadRequestException` (400); `@Valid` failures handled by `GlobalExceptionHandler` (RFC 7807). No new exception classes.
- Session enforcement: protected `/api/**` paths (courses, schedules, tasks, notes, academic-events, images, study-planner) require a session and answer 401 (RFC 7807) without one. `/api/users`, `/api/users/**` stay open by design (PoC/MVP): the account picker lists users pre-login and login is passwordless, so any caller can log in as any user by name. Do not add passwords or lock `/api/users` without an explicit requirement. Services take the session user ID and scope every read and write to it; a by-ID access to another user's record throws `ResourceNotFoundException` (404).
- Tests: unit = JUnit5 + Mockito, no Spring (`@Mock` repos, `@InjectMocks` on `*Impl`); controllers = `@WebMvcTest` + `@MockitoBean` on the **service interface**. AssertJ, `// given/when/then`, name `method_condition_expected`.
- Process entrypoints: `StudyPlannerService.getPlannerStatus(Long)` exposes pending dirty note counts/dates (`GET /api/study-planner/status`); `StudyPlannerService.processNotes(Long)` executes two-phase multi-day sequential extraction and today-anchored study planning. Exposed as `POST /api/study-planner/process` — SSE stream (`init`/`progress`/`done`/`error` events plus `:ping` heartbeat comments) on a virtual thread; no stream timeout (each AI call has its own timeout); a client disconnect cancels the run at the next checkpoint and rolls back the transaction.
- Observability & Dev Audit Trace: Domain mutations and AI planning lifecycle publish `AuditTraceEvent` records (`group.four.nyare.nyare.ai.observability.event`). Dev console (`/dev/observability`, `src/dev` sourceSet, run via `./gradlew devRun`) consumes events via in-memory sink, walks entity trace trees, and streams SSE updates without affecting production jars.

## Domain rules (do not violate)

- `StudyPlan` is virtual — never a DB table. Tri-state is derived per `Task`: `SCHEDULED` (has `scheduledDate`), `LATER` (no date + has `duration`), `BACKLOG` (neither).
- Planner scope: courses with dirty notes processed in current run; backdating horizon max 14 days; generates `AI_GENERATED` prep tasks for events ≤14 days out, skipping courses that already have open `SCHEDULED`/`LATER` tasks. Planner may only write `scheduledDate`/`duration` (+ generate event tasks, promote `BACKLOG`); never rewrite/merge task titles, never invent deadlines, no priority scores, no time-blocking, day-level granularity only.

## Environment bootstrap

- Windows: `setup-env.bat` installs Scoop packages (`temurin25-jdk`, `nodejs-lts`, python) + `graphify`. Requires Node per `frontend/package.json` engines (22.18+/24.12+).
