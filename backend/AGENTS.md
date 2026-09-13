# Backend Agent Guide (Nyare)

Nyare backend is a Spring Boot service powering the calendar-first academic planning assistant.

## Tech Stack

- **Runtime**: Java 25
- **Framework**: Spring Boot 4.1.1 (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`)
- **Persistence**: JPA / Hibernate with SQLite
- **Build Tool**: Gradle (Kotlin DSL `build.gradle.kts`)
- **Code Intelligence**: graphify (`graphify-out/`)

---

## Domain Model (`group.four.nyare.nyare.model`)

- **`Course`**: Academic subject containing schedules, notes, tasks, events, and context.
- **`Schedule`**: Recurring weekly class meeting times (`day`, `startTime`, `endTime`, `course`).
- **`Note`**: Course-linked journal entry containing student notes in JSON format (`content`, `courseId`, `createdAt`, `updatedAt`).
- **`Task`**: Actionable item recommended for a flexible planning date (`course`, `scheduledDate`, `duration`, `status`: `TODO`, `IN_PROGRESS`, `COMPLETED`).
- **`AcademicEvent`**: Rigid time constraint or deadline (`course`, `note`, `title`, `description`, `deadline`).
- **`AcademicContext`**: Temporal academic facts extracted from journal notes (`course`, `note`, `value`, `createdAt`).
- **`StudyPlan`**: Virtual presentation construct for UI recommendations; **do not** persist as a separate entity table.

---

## Core Architecture & Guidelines

1. **Layered Structure**:
   - Packages: All lowercase (`group.four.nyare.nyare.model`, `dto`, `repository`, `service`, `controller`, `exception`).
   - Repositories: Spring Data JPA repositories extending `JpaRepository` or `CrudRepository`.
   - Services: Interface + Implementation (`XxxService` + `XxxServiceImpl`) with class-level `@Transactional(readOnly = true)`.
   - Controllers: REST endpoints returning JSON / Problem Details (RFC 7807) with unversioned paths (`/api/...`).
2. **Domain Boundaries**:
   - AI processing operates only on current day's journal entries (`Note`).
   - Preserve uncertainty: never invent deadlines or missing metadata.
   - Do not implement automatic task merging, splitting, or deterministic scoring systems (MVP boundary).
   - Deadlines (`AcademicEvent.deadline`) are fixed constraints; task dates (`Task.scheduledDate`) are flexible suggestions.
3. **Conventions & Standards Reference**:
   - All backend components must adhere to the standards in `docs/conventions.md`.
   - When designing, creating, or modifying entities, DTOs, services, or controllers, fetch and inspect `docs/conventions.md` for exact patterns, validation rules, and templates.

---

## Knowledge Graph Workflows (`graphify`)

`graphify` tracks codebase topology in `graphify-out/`.

- **Explore / Query**: Run `graphify query "<question>"` or `graphify explain "<concept>"` before large refactors or navigation.
- **Check Paths**: Run `graphify path "<A>" "<B>"` to inspect dependencies between modules.
- **Keep Graph Fresh**: Run `graphify update .` after modifying Java files or project dependencies (always run outside sandbox with `BypassSandbox: true` and `Cwd` set to the backend project root).

---

## Verification & Build Tiering

1. **Tier 1 (Primary - IntelliJ MCP)**: Use IntelliJ MCP server for static analysis, symbol navigation, diagnostics, and in-memory compilation.
2. **Tier 2 (Targeted)**: Run specific tests (e.g., `./gradlew test --tests <ClassName>`) or focused compiles (`./gradlew compileJava`).
3. **Tier 3 (Strict Last Resort)**: Full CLI build (`./gradlew build`) reserved strictly for final verification or when MCP is unreachable.

---
