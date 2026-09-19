# Graph Report - backend  (2026-09-20)

## Corpus Check
- 82 files · ~95,272 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 790 nodes · 1162 edges · 64 communities (34 shown, 23 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0a0b0a7b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AcademicEventResponse
- AcademicEvent
- Course
- Backend Agent Guide
- jquery-3.7.1.min.js
- Task
- TaskResponse
- 4. Endpoints Specification
- script.js
- ImageMetadata
- Nyare Notes Management Service API Specification
- Architect Craft
- org.junit.jupiter.api.Test
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
- NoteResponse
- 4. Endpoints Specification
- 4. Endpoints Specification
- 4. Endpoints Specification
- TaskStatus
- Note
- man-spring: Spring AI Google GenAI (Gemini)
- jakarta.persistence.Entity
- ScheduleResponse
- search.js
- search-page.js
- ImageReferencesValidator
- NoteContent
- 4.5 AI Image Metadata Update
- 4.1 Create Note
- NoteContentConverter
- ValidImageReferences
- 4.2 List Notes by Course
- 4.4 Full Update of Note
- DejaVu fonts v2.37
- 4.6 Delete Note
- 3. Error Handling (RFC 7807 Problem Details)
- jQuery v3.7.1
- jQuery UI v1.14.1
- .addCorsMappings_registersExpectedConfiguration
- TaskRequest
- AcademicContext
- TaskService
- Test IntelliJ MCP
- org.springframework.data.jpa.repository.JpaRepository
- Dr. JSkill and Spring Docs MCP Rule

## God Nodes (most connected - your core abstractions)
1. `Note` - 35 edges
2. `Course` - 32 edges
3. `Task` - 32 edges
4. `TaskResponse` - 29 edges
5. `NoteContent` - 29 edges
6. `AcademicEvent` - 28 edges
7. `TaskStatus` - 27 edges
8. `AcademicContext` - 22 edges
9. `AcademicEventResponse` - 21 edges
10. `NoteResponse` - 19 edges

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

## Communities (64 total, 23 thin omitted)

### Community 0 - "AcademicEventResponse"
Cohesion: 0.06
Nodes (3): AcademicEventRequest, AcademicEventResponse, AcademicEventService

### Community 1 - "AcademicEvent"
Cohesion: 0.10
Nodes (3): AcademicEvent, Override, AcademicEventRepository

### Community 2 - "Course"
Cohesion: 0.10
Nodes (5): Course, Override, Override, Schedule, ScheduleRepository

### Community 3 - "Backend Agent Guide"
Cohesion: 0.14
Nodes (20): Tier 1 Verification (IntelliJ MCP), Hibernate Naming Strategy Rule, YAGNI Identity Pattern, Backend Agent Guide, Nyare Domain Model, Four-Layer Architecture, Backend Conventions Index, REST API & Controller Guidelines (+12 more)

### Community 4 - "jquery-3.7.1.min.js"
Cohesion: 0.07
Nodes (40): Ae(), B(), Be(), c(), $e(), ee(), F(), fe() (+32 more)

### Community 7 - "4. Endpoints Specification"
Cohesion: 0.06
Nodes (34): 1. Overview & Domain Architecture, 2.1 AcademicEvent Schema Overview, 2. Data Models & Schemas, 3.1 400 Bad Request Example (Cross-Entity Course Mismatch), 3.2 400 Bad Request Example (Validation Failure), 3.3 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Academic Event (+26 more)

### Community 8 - "script.js"
Cohesion: 0.11
Nodes (20): copySnippet(), copyToClipboard(), createElem(), expand(), getVisibleFilterInput(), handleScroll(), initSectionData(), loadScripts() (+12 more)

### Community 10 - "Nyare Notes Management Service API Specification"
Cohesion: 0.29
Nodes (6): 1. Overview & Domain Architecture, 2.1 Note Schema Overview, 2.2 NoteContent Object, 2.3 ImageMetadata Object, 2. Data Models & Schemas, Nyare Notes Management Service API Specification

### Community 11 - "Architect Craft"
Cohesion: 0.40
Nodes (5): Append-Only Materialization, Architect Craft, Tri-State Study Plan Recommendations, Preserve Uncertainty Principle, Virtual Study Plan (Non-Persisted)

### Community 12 - "org.junit.jupiter.api.Test"
Cohesion: 0.09
Nodes (17): org.apache.commons.csv.CSVFormat, org.apache.commons.csv.CSVRecord, org.junit.jupiter.api.DisplayName, org.junit.jupiter.api.Test, org.springframework.ai.chat.messages.UserMessage, org.springframework.ai.chat.model.ChatModel, org.springframework.ai.chat.prompt.Prompt, org.springframework.boot.test.context.SpringBootTest (+9 more)

### Community 13 - "NyareApplication"
Cohesion: 0.60
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaAuditing, NyareApplication

### Community 14 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 29 - "4. Endpoints Specification"
Cohesion: 0.05
Nodes (36): 1. Overview & Domain Architecture, 2.1 DayOfWeek Enum, 2.2 Schedule Schema Overview, 2. Data Models & Schemas, 3.1 400 Bad Request Example (Validation Failure), 3.2 400 Bad Request Example (Time Integrity Violation), 3.3 404 Not Found Example (Course Not Found), 3.4 404 Not Found Example (Schedule Not Found) (+28 more)

### Community 30 - "4. Endpoints Specification"
Cohesion: 0.25
Nodes (8): `200 OK`, `404 Not Found`, 4.3 Retrieve Note by ID, 4. Endpoints Specification, Example Request, Path Parameters, Responses, Summary Table

### Community 31 - "4. Endpoints Specification"
Cohesion: 0.05
Nodes (38): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+30 more)

### Community 32 - "TaskStatus"
Cohesion: 0.15
Nodes (5): TaskStatusRequest, TaskStatus, COMPLETED, IN_PROGRESS, TODO

### Community 33 - "Note"
Cohesion: 0.13
Nodes (3): Override, Note, NoteRepository

### Community 34 - "man-spring: Spring AI Google GenAI (Gemini)"
Cohesion: 0.10
Nodes (19): 1. `GoogleGenAiChatModel`, 2. High-Level `ChatClient`, 3. Structured Output Extraction, 4. Multimodal Inputs, 5. Function Calling with `@Tool`, 6. Dynamic `GoogleGenAiChatOptions`, 7. Context Caching, Application Properties (+11 more)

### Community 35 - "jakarta.persistence.Entity"
Cohesion: 0.44
Nodes (4): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener

### Community 36 - "ScheduleResponse"
Cohesion: 0.06
Nodes (10): org.springframework.http.ProblemDetail, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, GlobalExceptionHandler, ScheduleRequest, ScheduleResponse, BadRequestException (+2 more)

### Community 37 - "search.js"
Cohesion: 0.14
Nodes (26): categories, checkUnnamed(), createMatcher(), doSearch(), getClassPrefix(), getPrefix(), searchIndex(), escapeHtml() (+18 more)

### Community 38 - "search-page.js"
Cohesion: 0.24
Nodes (10): doPageSearch(), renderItem(), renderResults(), renderResult(), renderTable(), schedulePageSearch(), select(), setSearchUrl() (+2 more)

### Community 39 - "ImageReferencesValidator"
Cohesion: 0.29
Nodes (5): jakarta.validation.ConstraintValidator, jakarta.validation.ConstraintValidatorContext, java.util.regex.Pattern, ImageReferencesValidator, Override

### Community 41 - "4.5 AI Image Metadata Update"
Cohesion: 0.25
Nodes (8): `200 OK`, `400 Bad Request`, `404 Not Found`, 4.5 AI Image Metadata Update, Example Request, Path Parameters, Request Body (`ImageMetadataUpdateRequest`), Responses

### Community 42 - "4.1 Create Note"
Cohesion: 0.25
Nodes (8): `201 Created`, `400 Bad Request`, `404 Not Found`, 4.1 Create Note, Example Request, Request Body (`NoteRequest`), Request Headers, Responses

### Community 43 - "NoteContentConverter"
Cohesion: 0.39
Nodes (5): jakarta.persistence.AttributeConverter, jakarta.persistence.Converter, Override, NoteContentConverter, tools.jackson.databind.ObjectMapper

### Community 44 - "ValidImageReferences"
Cohesion: 0.43
Nodes (6): jakarta.validation.Constraint, jakarta.validation.Payload, java.lang.annotation.Documented, java.lang.annotation.Retention, java.lang.annotation.Target, ValidImageReferences

### Community 45 - "4.2 List Notes by Course"
Cohesion: 0.29
Nodes (7): `200 OK`, `400 Bad Request`, `404 Not Found`, 4.2 List Notes by Course, Example Request, Request Parameters, Responses

### Community 46 - "4.4 Full Update of Note"
Cohesion: 0.29
Nodes (7): `200 OK`, `400 Bad Request`, `404 Not Found`, 4.4 Full Update of Note, Path Parameters, Request Body (`NoteRequest`), Responses

### Community 48 - "4.6 Delete Note"
Cohesion: 0.33
Nodes (6): `204 No Content`, `404 Not Found`, 4.6 Delete Note, Example Request, Path Parameters, Responses

### Community 49 - "3. Error Handling (RFC 7807 Problem Details)"
Cohesion: 0.40
Nodes (5): 3.1 400 Bad Request Example (Reference Mismatch), 3.2 400 Bad Request Example (Missing Required Fields), 3.3 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), Problem Details Schema

### Community 57 - ".addCorsMappings_registersExpectedConfiguration"
Cohesion: 0.24
Nodes (9): org.springframework.context.annotation.Configuration, org.springframework.web.cors.CorsConfiguration, org.springframework.web.servlet.config.annotation.CorsRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer, Override, WebConfig, Override, TestCorsRegistry (+1 more)

### Community 61 - "Test IntelliJ MCP"
Cohesion: 0.25
Nodes (7): Available Tools Reference, Diagnostic Check Status, Step 1: Query Project Modules, Step 2: Search Files or Symbols, Step 3: Check File Diagnostics, Test IntelliJ MCP, Test Verification Workflow

### Community 62 - "org.springframework.data.jpa.repository.JpaRepository"
Cohesion: 0.29
Nodes (5): org.springframework.data.jpa.repository.JpaRepository, org.springframework.data.jpa.repository.Query, AcademicContextRepository, CourseRepository, TaskRepository

## Knowledge Gaps
- **159 isolated node(s):** `messages`, `categories`, `itemDesc`, `NO_MATCH`, `TODO` (+154 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 388 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NoteContent` connect `NoteContent` to `Note`, `ImageReferencesValidator`, `ImageMetadata`, `NoteContentConverter`, `ValidImageReferences`, `NoteResponse`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Why does `Note` connect `Note` to `AcademicEvent`, `Course`, `jakarta.persistence.Entity`, `Task`, `NoteContent`, `ImageMetadata`, `AcademicContext`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `Task` connect `Task` to `TaskStatus`, `Note`, `Course`, `jakarta.persistence.Entity`, `org.springframework.data.jpa.repository.JpaRepository`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `messages`, `categories`, `itemDesc` to the rest of the system?**
  _159 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AcademicEventResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.06190476190476191 - nodes in this community are weakly interconnected._
- **Should `AcademicEvent` be split into smaller, more focused modules?**
  _Cohesion score 0.1038961038961039 - nodes in this community are weakly interconnected._
- **Should `Course` be split into smaller, more focused modules?**
  _Cohesion score 0.09538461538461539 - nodes in this community are weakly interconnected._