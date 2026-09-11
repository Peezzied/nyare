# Backend Agent Guide (Nyare)

Nyare backend is a Spring Boot service powering the calendar-first academic planning assistant.

## Tech Stack

- **Runtime**: Java 25
- **Framework**: Spring Boot 4.1.1 (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`)
- **Persistence**: JPA / Hibernate with SQLite
- **Build Tool**: Gradle (Kotlin DSL `build.gradle.kts`)
- **Code Intelligence**: graphify (`graphify-out/`)

---

## Domain Model (`group.four.nyare.nyare.Models`)

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
   - Entities: `group.four.nyare.nyare.Models`
   - Repositories: Spring Data JPA repositories extending `JpaRepository` or `CrudRepository`
   - Services: Domain business logic and validation
   - Controllers: REST endpoints returning JSON / Problem Details (RFC 7807)
2. **Domain Boundaries**:
   - AI processing operates only on current day's journal entries (`Note`).
   - Preserve uncertainty: never invent deadlines or missing metadata.
   - Do not implement automatic task merging, splitting, or deterministic scoring systems (MVP boundary).
   - Deadlines (`AcademicEvent.deadline`) are fixed constraints; task dates (`Task.scheduledDate`) are flexible suggestions.

---

## Knowledge Graph Workflows (`graphify`)

`graphify` tracks codebase topology in `graphify-out/`.

- **Explore / Query**: Run `graphify query "<question>"` or `graphify explain "<concept>"` before large refactors or navigation.
- **Check Paths**: Run `graphify path "<A>" "<B>"` to inspect dependencies between modules.
- **Keep Graph Fresh**: Run `graphify update .` after modifying Java files or project dependencies.

---

## Build & Test Commands

```bash
# Build project
./gradlew build

# Run unit and integration tests
./gradlew test

# Start local dev server
./gradlew bootRun
```
