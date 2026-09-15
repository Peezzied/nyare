---
name: tldr-nyare
description: >
  Provides information about Nyare domain models, backend architecture,
  conventions, workflows, MVP boundaries, and skills. Answers questions in
  Caveman style with fast graphify lookups without persisting caveman mode.
---

# TL;DR Nyare — Knowledge Base and Fast Lookup

Use this skill to answer questions about the Nyare domain model, backend architecture, conventions, workflows, MVP boundaries, and companion skills.

---

## 1. Execution and Response Rules

1. **Context Lookup with Graphify**:
   - Query the `graphify-out/` knowledge graph with `graphify query "<question>"` or `graphify explain "<concept>"`.
   - Set `BypassSandbox: true` and set `Cwd` to the backend or project root directory.
   - Read documentation in `docs/` and `backend/docs/conventions/` for authoritative details.
2. **One-Shot Caveman Response**:
   - Write the entire response in **Caveman (Full)** style:
     - Remove articles (a, an, the), pleasantries, hedges, and filler words.
     - Use sentence fragments, short sentences (≤20 words), active voice, and present tense.
     - Keep exact technical terms, entity names, file paths, and markdown links.
     - Keep exact code blocks, schemas, and HTTP endpoints.
3. **No State Persistence**:
   - **CRITICAL**: Apply Caveman style **only to the immediate response** for `tldr-nyare`.
   - **Do not keep Caveman mode active** for subsequent turns unless the user requests `/caveman`.

---

## 2. Nyare Core Architecture and Domain Summary

### Core Flow
```text
Course Schedule → Course-linked Journal (JSON) → AI Processing (Today's Notes Only)
  → Tasks / Academic Events / Academic Context
  → AI Planning (Synthesizing State + Feedback)
  → Virtual Study Plan (Tri-State Recommendations) → Calendar View
```

### Domain Entities ([`docs/conceptual-model.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/conceptual-model.md))
- **`Course`**: Root organizational container. Every note, task, event, and context item belongs to one course.
- **`Schedule`**: Recurring weekly class meeting times (`dayOfWeek`, `startTime`, `endTime`).
- **`Note` (Journal Entry)**: Raw student notes in JSON format. This is the **immutable source of truth**.
- **`Task`**: Actionable work item (`TODO`, `IN_PROGRESS`, `COMPLETED`), optional estimated duration, and flexible recommended date.
- **`AcademicEvent`**: Rigid time constraint or deadline (`Exam`, `Quiz`, `Presentation`, `Class Activity`, `Deadline`).
- **`AcademicContext`**: Temporal background facts such as syllabus scope, pacing, and progress.
- **`StudyPlan`**: Virtual presentation construct. The database **never stores this construct**.
  - **Tri-State**: `Scheduled` (dated), `Flexible / Later` (undated backlog), `Needs Context` (uncertain).

### Key Domain Invariants and MVP Boundaries ([`docs/mvp-boundaries.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/mvp-boundaries.md))
- **No Automatic Reconciliation**: Never mutate, merge, split, or deduplicate existing tasks from new notes.
- **Preserve Uncertainty**: Never create estimated deadlines, durations, or priority scores. Leave unknown fields empty.
- **Append-Only Materialization**: AI extracts new records without modifying past records.
- **Virtual Plan**: The system generates the study plan dynamically. No database table exists for study plans.
- **High-Level Planning**: Recommend tasks at the day level. Do not generate hourly time-blocks.

---

## 3. Backend Conventions Summary ([`backend/docs/conventions/`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/backend/docs/conventions.md))

- **Stack**: Java 25, Spring Boot 4.1.1 (`webmvc`, `data-jpa`, `validation`), SQLite (`nyare.db`), and Gradle Kotlin DSL.
- **Layer Isolation**:
  - `controller` $\rightarrow$ calls `service` interface $\rightarrow$ maps entities to `dto` $\rightarrow$ `repository` $\rightarrow$ SQLite.
  - Controllers never access repositories directly. Entities never leave the service layer (DTOs only).
- **Dependency Injection**:
  - **Constructor Injection**: Declare all dependencies as `private final` fields. Inject dependencies through an explicit constructor.
  - **No Field Injection**: Do not use `@Autowired` on fields. This rule allows direct unit testing without Spring overhead.
- **Transactions**:
  - Annotate service classes with `@Transactional(readOnly = true)`.
  - Annotate mutating methods (`create`, `update`, `delete`) with `@Transactional`.
- **Error Handling**:
  - Use canonical exceptions only: `ResourceNotFoundException` (404) and `BadRequestException` (400).
  - `GlobalExceptionHandler` returns `ProblemDetail` responses (RFC 7807).
- **Testing Standards ([`backend/docs/conventions/testing-standards.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/backend/docs/conventions/testing-standards.md))**:
  - **Service Tests**: Write unit tests with JUnit 5 and Mockito (`@ExtendWith(MockitoExtension.class)`). Mock dependencies with `@Mock`. Inject them through constructors or `@InjectMocks`.
  - **Controller Tests**: Write controller tests with `@WebMvcTest` and `MockMvc`. Mock service interfaces with `@MockitoBean`.
  - **AssertJ and Given-When-Then**: Structure tests with `// given`, `// when`, and `// then` blocks. Use `assertThat(...)` assertions.

---

## 4. Basic Skills and Tools Guide

### 1. `dr-jskill` ([`dr-jskill/SKILL.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/.agents/skills/dr-jskill/SKILL.md))
- **Role**: Java and Spring Boot architecture practices.
- **Usage**: Clean layered design, standard DTO validation, REST API conventions, JPA mapping, and Spring patterns.

### 2. `caveman-commit` ([`caveman-commit/SKILL.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/.agents/skills/caveman-commit/SKILL.md))
- **Role**: Concise, intent-only Conventional Commits (`feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`).
- **Usage**: Use imperative mood, limit subjects to 50-72 characters, explain *why* over *what*, and omit AI attribution text.

### 3. `ponytail` ([`ponytail/SKILL.md`](file:///C:/Users/karol/.gemini/config/plugins/ponytail/skills/ponytail/SKILL.md))
- **Role**: Code minimalism and prevention of over-engineering.
- **Usage**: Follow YAGNI, choose standard libraries over dependencies, use native platform features, and write minimal code changes.

### 4. `intellij-mcp` ([`.agents/rules/intellij-mcp.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/backend/.agents/rules/intellij-mcp.md))
- **Role**: Primary tool for code intelligence.
- **Usage**: Resolve symbols, find usages, inspect diagnostics, and compile code in memory before running CLI builds.

### 5. `graphify` ([`graphify/SKILL.md`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/.agents/skills/graphify/SKILL.md))
- **Role**: Codebase knowledge graph in `graphify-out/`.
- **Usage**: Query relationships (`graphify query "..."`), explain concepts (`graphify explain "..."`), and update graph (`graphify update .`) with `BypassSandbox: true`.

---

## 5. Output Format Example for `tldr-nyare`

When answering user questions with this skill, format responses like this:

```markdown
Nyare calendar-first academic planning assistant.

Core pipeline:
- Class schedule anchors calendar navigation.
- Student writes course-linked journal note (`Note` = raw JSON, immutable source of truth).
- AI extracts `Task`, `AcademicEvent`, and `AcademicContext` from today's notes.
- System dynamically generates virtual `StudyPlan` (tri-state: scheduled, flexible, needs context). Database does not persist study plans.

Key backend rules:
- Java 25, Spring Boot 4.1.1, SQLite.
- Constructor injection with `private final` fields. No `@Autowired` field injection.
- Controller tests mock service interfaces with `@MockitoBean`. Unit tests use `@ExtendWith(MockitoExtension.class)`.
- Canonical exceptions only: `ResourceNotFoundException` (404), `BadRequestException` (400).
```
