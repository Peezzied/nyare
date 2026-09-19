# Backend Agent Guide (Nyare)

Nyare backend is a Spring Boot service powering the calendar-first academic planning assistant.

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
- **`Note`**: Course-linked journal entry in JSON format (`content`, `course`, `createdAt`, `updatedAt`).
- **`Task`**: Actionable item recommended for flexible planning (`course`, `scheduledDate`, `duration`, `status`).
- **`AcademicEvent`**: Rigid time constraint or deadline (`course`, `note`, `title`, `description`, `deadline`).
- **`AcademicContext`**: Temporal academic facts extracted from journal notes.
- **`StudyPlan`**: Virtual presentation construct; **never** persist as a database table.

---

## Core Architecture & Invariants

1. **Layer Isolation**:
   - Packages: strictly lowercase (`controller`, `service`, `repository`, `model`, `dto`, `exception`).
   - Controllers never touch repositories; Entities never escape the service layer (DTOs only).
   - Class-level `@Transactional(readOnly = true)` on services; explicit `@Transactional` on mutations.
2. **Canonical Exceptions Only**:
   - Never create custom exception classes per entity/feature.
   - Throw only `ResourceNotFoundException` (404) or `BadRequestException` (400) with descriptive messages.
   - Field validations (`@Valid`) handled automatically by `GlobalExceptionHandler` (RFC 7807).
3. **Conventions Directory**:
   - Read focused modular guides under [`docs/conventions/`](docs/conventions.md) before implementing changes:
     - [Architecture](docs/conventions/architecture.md) · [Entities](docs/conventions/entities.md) · [DTOs](docs/conventions/dtos-and-validation.md) · [Services](docs/conventions/services-and-tx.md) · [Exceptions](docs/conventions/exceptions.md) · [REST API](docs/conventions/controllers-and-rest.md) · [Persistence](docs/conventions/persistence-sqlite.md) · [Testing](docs/conventions/testing-standards.md)
4. **Skills & MCP Documentation**:
   - Always consult the `dr-jskill` skill before designing or refactoring backend features.
   - Query `spring-docs` MCP tools for official Spring APIs, reference docs, and configurations.
5. **Modern Standards & Deprecation**:
   - Avoid deprecated classes, methods, annotations, and APIs.
   - Use modern features supported by Java 25 and Spring Boot.

---

## Knowledge Graph (`graphify`)

`graphify` tracks codebase topology in `graphify-out/`.
- Prioritize using graphify for project lookup or searching.
- Query before navigating: `graphify query "<question>"` or `graphify explain "<concept>"`.
- Update after edits: `graphify update .` (run outside sandbox with `BypassSandbox: true` and `Cwd` set to backend root).

---

## Verification & Build Tiering

1. **Tier 1 (Primary - IntelliJ MCP)**: Static analysis, symbol navigation, diagnostics, and in-memory compilation.
2. **Tier 2 (Targeted)**: Specific test (`gradlew test --tests <Name>`) or compile (`gradlew compileJava`).
3. **Tier 3 (Last Resort)**: Full build (`gradlew build`) reserved strictly for final task verification.
