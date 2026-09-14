# Graph Report - backend  (2026-09-14)

## Corpus Check
- 51 files · ~19,277 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 355 nodes · 533 edges · 31 communities (12 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4a8df43f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AcademicEventResponse
- Note
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
- ImageMetadata

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

## Communities (31 total, 17 thin omitted)

### Community 0 - "AcademicEventResponse"
Cohesion: 0.06
Nodes (4): AcademicEventRequest, AcademicEventResponse, BadRequestException, AcademicEventService

### Community 1 - "Note"
Cohesion: 0.05
Nodes (12): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener, AcademicContext, Override, AcademicEvent, Override (+4 more)

### Community 3 - "Backend Agent Guide"
Cohesion: 0.09
Nodes (27): Tier 1 Verification (IntelliJ MCP), Hibernate Naming Strategy Rule, YAGNI Identity Pattern, Backend Agent Guide, Nyare Domain Model, ProblemDetail Schema, Nyare Task Management OpenAPI Specification, TaskRequest Schema (+19 more)

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
Cohesion: 0.08
Nodes (10): jakarta.persistence.AttributeConverter, jakarta.persistence.Converter, NoteRequest, NoteResponse, ResourceNotFoundException, Override, NoteContentConverter, NoteContent (+2 more)

### Community 29 - "ValidImageReferences"
Cohesion: 0.17
Nodes (11): jakarta.validation.Constraint, jakarta.validation.ConstraintValidator, jakarta.validation.ConstraintValidatorContext, jakarta.validation.Payload, java.lang.annotation.Documented, java.lang.annotation.Retention, java.lang.annotation.Target, java.util.regex.Pattern (+3 more)

## Knowledge Gaps
- **16 isolated node(s):** `TODO`, `IN_PROGRESS`, `COMPLETED`, `Tri-State Study Plan Recommendations`, `IntelliJ MCP Backend Workflow` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 169 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NoteContent` connect `NoteContent` to `Note`, `ValidImageReferences`, `ImageMetadata`?**
  _High betweenness centrality (0.367) - this node is a cross-community bridge._
- **Why does `Note` connect `Note` to `org.springframework.data.jpa.repository.JpaRepository`, `NoteContent`, `Task`, `ImageMetadata`?**
  _High betweenness centrality (0.361) - this node is a cross-community bridge._
- **Why does `Task` connect `Task` to `Note`, `org.springframework.data.jpa.repository.JpaRepository`, `TaskStatus`?**
  _High betweenness centrality (0.262) - this node is a cross-community bridge._
- **What connects `TODO`, `IN_PROGRESS`, `COMPLETED` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AcademicEventResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.057692307692307696 - nodes in this community are weakly interconnected._
- **Should `Note` be split into smaller, more focused modules?**
  _Cohesion score 0.050203527815468114 - nodes in this community are weakly interconnected._
- **Should `Backend Agent Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._