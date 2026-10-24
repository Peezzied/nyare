# App Agent Guide (Nyare)

Nyare app is a Spring Boot service powering the calendar-first academic planning assistant. It serves both the REST API and the compiled Vue SPA from `src/main/resources/static`.

System-wide architecture (layers, session scoping, AI pipeline, observability, frontend, delivery): [`../docs/architecture.md`](../docs/architecture.md).

## Tech Stack

- **Runtime**: Java 25
- **Framework**: Spring Boot 4.1.1 (`webmvc`, `data-jpa`, `validation`)
- **AI Integration**: Spring AI 2.0.0 (`spring-ai-starter-model-google-genai`)
- **Persistence**: JPA / Hibernate with SQLite
- **Build Tool**: Gradle (`build.gradle`)
- **Code Intelligence**: graphify (`graphify-out/`)

---

## Domain Model (`group.four.nyare.nyare.model`)

- **`Course`**: Academic subject organizing schedules, notes, tasks, events, and context.
- **`Schedule`**: Recurring weekly class meeting times (`day`, `startTime`, `endTime`, `course`).
- **`Note`**: Course-linked journal entry in JSON format (`content`, `course`, `entryDate`, `createdAt`, `updatedAt`, `lastProcessedAt`).
- **`Task`**: Actionable item (`course`, `origin`, `scheduledDate`, `duration`, `status`, derived `planCategory`).
- **`PlanCategory`**: Tri-state planning enum (`SCHEDULED`, `LATER`, `BACKLOG`) derived from task date and duration.
- **`AcademicEvent`**: Rigid time constraint or deadline (`course`, `note`, `title`, `description`, `deadline`).
- **`AcademicContext`**: Temporal academic facts extracted from journal notes.
- **`StudyPlan`**: Virtual presentation construct; **never** persist as a database table.

---

## Core Architecture & Invariants

1. **Layer Isolation**:
   - Packages: strictly lowercase (`controller`, `service`, `repository`, `model`, `dto`, `exception`, `ai`, `observability`).
   - Controllers never touch repositories; Entities never escape the service layer (DTOs only).
   - Class-level `@Transactional(readOnly = true)` on services; explicit `@Transactional` on mutations.
   - Combined Processing & Planning: `StudyPlannerService.processNotes(Long userId)` executes two-phase multi-day sequential extraction across pending dirty dates and anchors final task scheduling to `LocalDate.now()`. Pre-flight status query available via `getPlannerStatus(Long userId)`.
   - Session scoping: protected `/api/**` paths require a session and answer 401 (RFC 7807) without one. Service methods take the session user ID and scope every read and write to it; a by-ID access to another user's record throws `ResourceNotFoundException` (404).
   - SPA Serving: The app serves the compiled Vue frontend from `static/`. `SpaController` forwards unmapped non-API requests to `/index.html` for client-side routing while preserving JSON errors for `/api/**`.
   - Observability & Dev Audit Trace: Domain mutations and AI planning lifecycle publish `AuditTraceEvent` records (`group.four.nyare.nyare.ai.observability.event`). Dev console (`/dev/observability`, `src/dev` sourceSet, run via `./gradlew devRun`) consumes events via in-memory sink, walks entity trace trees, and streams SSE updates without affecting production jars.
2. **Canonical Exceptions Only**:
   - Never create custom exception classes per entity/feature.
   - Throw only `ResourceNotFoundException` (404) or `BadRequestException` (400) with descriptive messages.
   - Field validations (`@Valid`) handled automatically by `GlobalExceptionHandler` (RFC 7807).
3. **Conventions Directory**:
   - Read focused modular guides under [`docs/conventions/`](docs/conventions.md) before implementing changes:
     - [Architecture](docs/conventions/architecture.md) · [Entities](docs/conventions/entities.md) · [DTOs](docs/conventions/dtos-and-validation.md) · [Services](docs/conventions/services-and-tx.md) · [Exceptions](docs/conventions/exceptions.md) · [REST API](docs/conventions/controllers-and-rest.md) · [Persistence](docs/conventions/persistence-sqlite.md) · [Testing](docs/conventions/testing-standards.md)

   **Note**: The frontend build output is written to `src/main/resources/static/` by Vite (`npm run build` in `../frontend/`). The app serves this as a single deployable JAR.
4. **Skills & MCP Documentation**:
   - Always consult the `dr-jskill` skill before designing or refactoring backend features.
   - Query `spring-docs` MCP tools for official Spring APIs, reference docs, and configurations.
5. **Modern Standards & Deprecation**:
   - Follow modern Java practices across all application layers.
   - Avoid deprecated classes, methods, annotations, and APIs.
   - Use current features supported by Java 25 and Spring Boot.
6. **AI System Prompts**:
    - System prompts live in `src/main/resources/planner_sys-prompt.st` (planner) and `src/main/resources/image_sys-prompt.st` (image processor).
    - Store all AI system instructions in these template files; shared params under `nyare.ai.*` in `application.properties`.

---

## Knowledge Graph (`graphify`)

`graphify` tracks codebase topology in `graphify-out/`.
- Prioritize using graphify for project lookup or searching.
- Query before navigating: `graphify query "<question>"` or `graphify explain "<concept>"`.

---

## Verification & Build Tiering

1. **Tier 1 (Primary - IntelliJ MCP)**: Static analysis, symbol navigation, diagnostics, and in-memory compilation.
2. **Tier 2 (Targeted)**: Specific test method (`gradlew test --tests <ClassName.methodName>`) or compile (`gradlew compileJava`).
3. **Tier 3 (Last Resort)**: Full build (`gradlew build`) reserved strictly for final task verification.

### Integration Test Execution Policy
- Run integration tests one at a time.
- Do not run integration tests in bulk.
- Follow this workflow:
  1. Run a single test method.
  2. If you need more tests, ask the user for confirmation.
  3. If you do not need more tests, complete the task.
- Always ask the user before you run additional integration tests.
