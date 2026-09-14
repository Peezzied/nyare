# Graph Report - backend  (2026-09-14)

## Corpus Check
- 52 files · ~21,893 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 443 nodes · 619 edges · 37 communities (15 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a8df43f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AcademicEventResponse
- AcademicEvent
- Schedule
- Backend Agent Guide
- org.springframework.data.jpa.repository.JpaRepository
- Task
- TaskResponse
- TaskStatus
- GlobalExceptionHandler.java
- TaskRequest
- TaskService
- Architect Craft
- NyareApplicationTests.java
- NyareApplication
- gradlew
- Layer Isolation Invariant
- Offline Fallback Protocol
- IntelliJ MCP Backend Workflow
- Model Craft Standard
- Unversioned Kebab-Case Endpoints
- Explicit Service Mapping
- Identifier Strategy
- LAZY Association Fetching
- Single-Writer Connection Pool
- TaskController Specification
- TaskRepository Specification
- NoteContent
- ValidImageReferences
- 4. Endpoints Specification
- 4. Endpoints Specification
- AcademicContext
- Note
- Course
- jakarta.persistence.Entity
- 4.2 List Notes by Course

## God Nodes (most connected - your core abstractions)
1. `Note` - 35 edges
2. `Course` - 32 edges
3. `Task` - 32 edges
4. `TaskResponse` - 29 edges
5. `NoteContent` - 29 edges
6. `AcademicEvent` - 28 edges
7. `TaskStatus` - 27 edges
8. `AcademicEventResponse` - 21 edges
9. `NoteResponse` - 19 edges
10. `TaskRequest` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Tier 1 Verification (IntelliJ MCP)` --semantically_similar_to--> `Three Test Slices`  [INFERRED] [semantically similar]
  .agents/rules/intellij-mcp.md → docs/conventions/testing-standards.md
- `Backend Agent Guide` --references--> `Tier 1 Verification (IntelliJ MCP)`  [EXTRACTED]
  AGENTS.md → .agents/rules/intellij-mcp.md
- `Backend Agent Guide` --references--> `DTO & Validation Guidelines`  [EXTRACTED]
  AGENTS.md → docs/conventions/dtos-and-validation.md
- `Backend Agent Guide` --references--> `Persistence & SQLite Guidelines`  [EXTRACTED]
  AGENTS.md → docs/conventions/persistence-sqlite.md
- `Backend Agent Guide` --references--> `Service & Transaction Guidelines`  [EXTRACTED]
  AGENTS.md → docs/conventions/services-and-tx.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Domain AI Invariants** — _agents_skills_architect_craft_skill_virtual_study_plan, _agents_skills_architect_craft_skill_tri_state_recommendations, _agents_skills_architect_craft_skill_append_only_materialization, _agents_skills_architect_craft_skill_uncertainty_preservation [EXTRACTED 1.00]
- **Layered Architecture Invariants** — docs_conventions_architecture_layered_architecture, docs_conventions_services_and_tx_guidelines, docs_conventions_controllers_and_rest_guidelines, docs_conventions_dtos_and_validation_guidelines [EXTRACTED 1.00]
- **Task CRUD Service Stack** — docs_superpowers_plans_2026_09_13_task_manager_service_task_controller_spec, docs_superpowers_plans_2026_09_13_task_manager_service_task_service_spec, docs_superpowers_plans_2026_09_13_task_manager_service_task_repository_spec [EXTRACTED 1.00]

## Communities (37 total, 20 thin omitted)

### Community 0 - "AcademicEventResponse"
Cohesion: 0.06
Nodes (4): AcademicEventRequest, AcademicEventResponse, ResourceNotFoundException, AcademicEventService

### Community 3 - "Backend Agent Guide"
Cohesion: 0.14
Nodes (20): Tier 1 Verification (IntelliJ MCP), Hibernate Naming Strategy Rule, YAGNI Identity Pattern, Backend Agent Guide, Nyare Domain Model, Four-Layer Architecture, Backend Conventions Index, REST API & Controller Guidelines (+12 more)

### Community 4 - "org.springframework.data.jpa.repository.JpaRepository"
Cohesion: 0.21
Nodes (6): org.springframework.data.jpa.repository.JpaRepository, org.springframework.data.jpa.repository.Query, AcademicEventRepository, CourseRepository, NoteRepository, TaskRepository

### Community 7 - "TaskStatus"
Cohesion: 0.15
Nodes (5): TaskStatusRequest, TaskStatus, COMPLETED, IN_PROGRESS, TODO

### Community 8 - "GlobalExceptionHandler.java"
Cohesion: 0.44
Nodes (5): org.springframework.http.ProblemDetail, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, GlobalExceptionHandler

### Community 11 - "Architect Craft"
Cohesion: 0.40
Nodes (5): Append-Only Materialization, Architect Craft, Tri-State Study Plan Recommendations, Preserve Uncertainty Principle, Virtual Study Plan (Non-Persisted)

### Community 12 - "NyareApplicationTests.java"
Cohesion: 0.60
Nodes (3): org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest, NyareApplicationTests

### Community 13 - "NyareApplication"
Cohesion: 0.60
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaAuditing, NyareApplication

### Community 14 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 28 - "NoteContent"
Cohesion: 0.05
Nodes (12): jakarta.persistence.AttributeConverter, jakarta.persistence.Converter, ImageMetadataUpdateRequest, NoteRequest, NoteResponse, BadRequestException, Override, NoteContentConverter (+4 more)

### Community 29 - "ValidImageReferences"
Cohesion: 0.17
Nodes (11): jakarta.validation.Constraint, jakarta.validation.ConstraintValidator, jakarta.validation.ConstraintValidatorContext, jakarta.validation.Payload, java.lang.annotation.Documented, java.lang.annotation.Retention, java.lang.annotation.Target, java.util.regex.Pattern (+3 more)

### Community 30 - "4. Endpoints Specification"
Cohesion: 0.04
Nodes (48): 1. Overview & Domain Architecture, `200 OK`, `200 OK`, `200 OK`, `201 Created`, `204 No Content`, 2.1 Note Schema Overview, 2.2 NoteContent Object (+40 more)

### Community 31 - "4. Endpoints Specification"
Cohesion: 0.05
Nodes (38): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+30 more)

### Community 35 - "jakarta.persistence.Entity"
Cohesion: 0.44
Nodes (4): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener

### Community 36 - "4.2 List Notes by Course"
Cohesion: 0.29
Nodes (7): `200 OK`, `400 Bad Request`, `404 Not Found`, 4.2 List Notes by Course, Example Request, Request Parameters, Responses

## Knowledge Gaps
- **79 isolated node(s):** `TODO`, `IN_PROGRESS`, `COMPLETED`, `1. Overview & Domain Architecture`, `2.1 Note Schema Overview` (+74 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 234 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NoteContent` connect `NoteContent` to `Note`, `ValidImageReferences`?**
  _High betweenness centrality (0.236) - this node is a cross-community bridge._
- **Why does `Note` connect `Note` to `AcademicContext`, `AcademicEvent`, `Course`, `jakarta.persistence.Entity`, `org.springframework.data.jpa.repository.JpaRepository`, `Task`, `NoteContent`?**
  _High betweenness centrality (0.231) - this node is a cross-community bridge._
- **Why does `Task` connect `Task` to `Note`, `Course`, `jakarta.persistence.Entity`, `org.springframework.data.jpa.repository.JpaRepository`, `TaskStatus`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **What connects `TODO`, `IN_PROGRESS`, `COMPLETED` to the rest of the system?**
  _79 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AcademicEventResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.057692307692307696 - nodes in this community are weakly interconnected._
- **Should `AcademicEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Backend Agent Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._