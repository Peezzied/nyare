# Graph Report - backend  (2026-09-28)

## Corpus Check
- 104 files · ~105,919 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1059 nodes · 1881 edges · 136 communities (47 shown, 82 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 169 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `49e6e9c6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Task
- jquery-3.7.1.min.js
- AcademicEventResponse
- StudyPlannerEngineIntegrationTest.java
- Responses
- ScheduleResponse
- script.js
- search.js
- org.junit.jupiter.api.Test
- 4. Endpoints Specification
- 4. Endpoints Specification
- 4. Endpoints Specification
- man-spring: Spring AI Google GenAI (Gemini)
- ProcessSummaryResponse
- AcademicEvent
- ConsoleLogListener
- TaskRequest
- NoteResponse
- StudyPlannerServiceImplTest.java
- TaskResponse
- jakarta.persistence.Entity
- StudyPlannerEngine.java
- Note
- org.springframework.boot.test.context.SpringBootTest
- ImageMetadata
- search-page.js
- .addCorsMappings_registersExpectedConfiguration
- Course
- NoteContent
- Generating Test Notes for Nyare
- TaskStatus
- ImageReferencesValidator
- PlanCategory
- Backend Conventions Index
- Prompt Guidelines
- Prompt Engineering for Nyare
- group.four.nyare.nyare.model
- Schedule
- Test IntelliJ MCP
- NoteContentConverter
- ValidImageReferences
- TaskService
- Few-Shot Learning Patterns for Nyare
- Prompt Optimization for Nyare
- NyareApplication
- Prompt Engineering Skill
- group.four.nyare.nyare.exception
- group.four.nyare.nyare.model.validation
- gradlew
- AcademicEvent Rigid Temporal Constraint
- Transaction Demarcation readOnly with Mutating Transactional
- Task Actionable Study Item
- NoteContent Markdown plus ImageMetadata
- Service Interface plus Implementation Pattern
- group.four.nyare.nyare.model.converter
- group.four.nyare.nyare.model.enums
- DejaVu fonts v2.37
- jQuery v3.7.1
- jQuery UI v1.14.1
- dr-jskill-and-spring-docs.md
- PlanCategory Tri-State Enum
- StudyPlan Virtual Presentation Construct
- dr-jskill Skill
- spring-docs MCP Tools
- Append-Only Materialization No Auto-Reconciliation
- Student Note Taxonomy Archetypes
- Temporal Anchoring Against Schedules
- Structured Output Extraction to Java Records
- StubReferenceCodec Token Optimization
- AcademicEventResponse Schema
- Schedule Recurring Weekly Class Meeting
- Package group.four.nyare.nyare.config
- GlobalExceptionHandler
- AcademicEventRequest
- NoteRequest
- ScheduleRequest
- TaskRequest
- group.four.nyare.nyare
- group.four.nyare.nyare.repository
- group.four.nyare.nyare.service
- Offline Fallback Protocol
- IntelliJ MCP Backend Workflow
- Tier 1 Verification (IntelliJ MCP)
- Model Craft Standard
- Tri-State Study Plan Recommendations
- GoogleGenAiChatModel
- Function Calling with Tool Annotation
- XML Tags with Tabular CSV Token Reduction
- IntelliJ MCP Server Tools
- DayOfWeek Enum
- TaskRequest Schema
- group.four.nyare.nyare.dto Class Hierarchy
- Unversioned Kebab-Case Endpoints
- Explicit Service Mapping
- Identifier Strategy
- LAZY Association Fetching
- All Classes and Interfaces
- All Packages
- Package group.four.nyare.nyare.config Class Hierarchy
- Package group.four.nyare.nyare.controller Class Hierarchy
- ImageMetadataUpdateRequest
- Package group.four.nyare.nyare.dto
- TaskStatusRequest
- group.four.nyare.nyare.model Class Hierarchy
- NyareApplication
- AcademicEventRepository
- CourseRepository
- NoteRepository
- ScheduleRepository
- TaskRepository
- AcademicEventService
- NoteService
- ScheduleService
- TaskService
- API Help (help-doc.html)
- Index All (index-all.html)
- Overview Summary (overview-summary.html)
- Overview Tree (overview-tree.html)
- Copy icon
- Search magnifier icon
- Left arrow icon
- Link icon
- Right arrow icon
- Close X icon
- Search Page (search.html)
- Serialized Form (serialized-form.html)
- Task Manager Service Implementation Plan
- TaskController Specification
- TaskRepository Specification

## God Nodes (most connected - your core abstractions)
1. `Note` - 50 edges
2. `Course` - 46 edges
3. `Task` - 43 edges
4. `AcademicEvent` - 34 edges
5. `NoteContent` - 33 edges
6. `TaskResponse` - 32 edges
7. `TaskStatus` - 32 edges
8. `StudyPlannerEngine` - 29 edges
9. `AcademicContext` - 29 edges
10. `Schedule` - 29 edges

## Surprising Connections (you probably didn't know these)
- `Append-Only Materialization No Auto-Reconciliation` --conceptually_related_to--> `Non-Cascading Note Deletion Lifecycle`  [INFERRED]
  .agents/skills/architect-craft/SKILL.md → docs/api/notes-api/notes-api.md
- `Hibernate Naming Strategy Rule` --rationale_for--> `Domain Entity Guidelines`  [EXTRACTED]
  .agents/skills/model-craft/SKILL.md → docs/conventions/entities.md
- `YAGNI Identity Pattern` --rationale_for--> `Domain Entity Guidelines`  [EXTRACTED]
  .agents/skills/model-craft/SKILL.md → docs/conventions/entities.md
- `AcademicContext` --references--> `group.four.nyare.nyare.model`  [INFERRED]
  docs/javadoc/group/four/nyare/nyare/model/AcademicContext.html → docs/javadoc/group/four/nyare/nyare/model/package-summary.html
- `AcademicEvent` --references--> `group.four.nyare.nyare.model`  [INFERRED]
  docs/javadoc/group/four/nyare/nyare/model/AcademicEvent.html → docs/javadoc/group/four/nyare/nyare/model/package-summary.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Nyare Prompt Architecture Extraction Pipeline** — backend_agents_skills_prompt_engineering_skill_prompt_engineering, backend_agents_skills_prompt_engineering_references_system_prompt_design_system_prompt, backend_agents_skills_man_spring_skill_chatclient [EXTRACTED 1.00]
- **Rigid Event versus Flexible Task Distinction** — backend_docs_api_academic_events_api_academic_events_api_academicevent, backend_docs_api_task_api_task_api_task, backend_docs_api_academic_events_api_academic_events_api_rigid_vs_flexible [EXTRACTED 1.00]
- **Task CRUD Service Stack** — docs_superpowers_plans_2026_09_13_task_manager_service_task_controller_spec, docs_superpowers_plans_2026_09_13_task_manager_service_task_service_spec, docs_superpowers_plans_2026_09_13_task_manager_service_task_repository_spec [EXTRACTED 1.00]
- **Tri-State Study Plan Presentation** — backend_agents_skills_architect_craft_skill_tri_state, backend_agents_md_plancategory, backend_docs_api_task_api_task_api_taskstatus [EXTRACTED 1.00]

## Communities (136 total, 82 thin omitted)

### Community 1 - "jquery-3.7.1.min.js"
Cohesion: 0.07
Nodes (40): Ae(), B(), Be(), c(), $e(), ee(), F(), fe() (+32 more)

### Community 2 - "AcademicEventResponse"
Cohesion: 0.06
Nodes (3): AcademicEventRequest, AcademicEventResponse, AcademicEventService

### Community 3 - "StudyPlannerEngineIntegrationTest.java"
Cohesion: 0.22
Nodes (9): org.junit.jupiter.api.TestInfo, org.springframework.boot.autoconfigure.EnableAutoConfiguration, org.springframework.boot.SpringBootConfiguration, org.springframework.boot.test.system.CapturedOutput, org.springframework.boot.test.system.OutputCaptureExtension, org.springframework.context.annotation.Import, StudyPlannerEngineIntegrationTest, TestConfig (+1 more)

### Community 4 - "Responses"
Cohesion: 0.09
Nodes (31): 1. Overview & Domain Architecture, `200 OK`, `201 Created`, `204 No Content`, 2.1 Note Schema Overview, 2.2 NoteContent Object, 2.3 ImageMetadata Object, 2. Data Models & Schemas (+23 more)

### Community 5 - "ScheduleResponse"
Cohesion: 0.06
Nodes (10): org.springframework.http.ProblemDetail, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, GlobalExceptionHandler, ScheduleRequest, ScheduleResponse, BadRequestException (+2 more)

### Community 6 - "script.js"
Cohesion: 0.11
Nodes (20): copySnippet(), copyToClipboard(), createElem(), expand(), getVisibleFilterInput(), handleScroll(), initSectionData(), loadScripts() (+12 more)

### Community 7 - "search.js"
Cohesion: 0.14
Nodes (26): categories, checkUnnamed(), createMatcher(), doSearch(), getClassPrefix(), getPrefix(), searchIndex(), escapeHtml() (+18 more)

### Community 8 - "org.junit.jupiter.api.Test"
Cohesion: 0.06
Nodes (31): com.fasterxml.jackson.annotation.JsonIgnoreProperties, org.apache.commons.csv.CSVRecord, org.junit.jupiter.api.BeforeEach, org.junit.jupiter.api.Disabled, org.junit.jupiter.api.DisplayName, org.junit.jupiter.api.extension.ExtendWith, org.junit.jupiter.api.Test, org.mockito.junit.jupiter.MockitoExtension (+23 more)

### Community 9 - "4. Endpoints Specification"
Cohesion: 0.11
Nodes (25): 1. Overview & Domain Architecture, 2.1 DayOfWeek Enum, 2.2 Schedule Schema Overview, 2. Data Models & Schemas, 3.1 400 Bad Request Example (Validation Failure), 3.2 400 Bad Request Example (Time Integrity Violation), 3.3 404 Not Found Example (Course Not Found), 3.4 404 Not Found Example (Schedule Not Found) (+17 more)

### Community 10 - "4. Endpoints Specification"
Cohesion: 0.13
Nodes (24): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+16 more)

### Community 11 - "4. Endpoints Specification"
Cohesion: 0.12
Nodes (23): 1. Overview & Domain Architecture, 2.1 AcademicEvent Schema Overview, 2. Data Models & Schemas, 3.1 400 Bad Request Example (Cross-Entity Course Mismatch), 3.2 400 Bad Request Example (Validation Failure), 3.3 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Academic Event (+15 more)

### Community 12 - "man-spring: Spring AI Google GenAI (Gemini)"
Cohesion: 0.10
Nodes (20): 1. `GoogleGenAiChatModel`, 2. High-Level `ChatClient`, 3. Structured Output Extraction, 4. Multimodal Inputs, 5. Function Calling with `@Tool`, 6. Dynamic `GoogleGenAiChatOptions`, 7. Context Caching, Application Properties (+12 more)

### Community 13 - "ProcessSummaryResponse"
Cohesion: 0.14
Nodes (8): org.springframework.web.bind.annotation.PostMapping, org.springframework.web.bind.annotation.RequestMapping, org.springframework.web.bind.annotation.RestController, org.springframework.web.servlet.mvc.method.annotation.SseEmitter, StudyPlannerController, ProcessSummaryResponse, StudyPlannerService, SseEmitter

### Community 15 - "ConsoleLogListener"
Cohesion: 0.19
Nodes (9): FileOutputStream, java.io.FileOutputStream, org.junit.platform.engine.TestExecutionResult, org.junit.platform.launcher.TestExecutionListener, org.junit.platform.launcher.TestIdentifier, org.junit.platform.launcher.TestPlan, ConsoleLogListener, DualOutputStream (+1 more)

### Community 18 - "StudyPlannerServiceImplTest.java"
Cohesion: 0.18
Nodes (9): org.springframework.data.jpa.repository.JpaRepository, org.springframework.data.jpa.repository.Query, org.springframework.stereotype.Service, AcademicContextRepository, AcademicEventRepository, CourseRepository, NoteRepository, TaskRepository (+1 more)

### Community 20 - "jakarta.persistence.Entity"
Cohesion: 0.45
Nodes (5): Index (index.html), jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener

### Community 21 - "StudyPlannerEngine.java"
Cohesion: 0.09
Nodes (19): Builder, com.fasterxml.jackson.databind.JsonNode, com.fasterxml.jackson.databind.ObjectMapper, org.apache.commons.csv.CSVFormat, org.slf4j.Logger, org.springframework.ai.chat.client.advisor.api.CallAdvisorChain, org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor, org.springframework.ai.chat.client.ChatClient (+11 more)

### Community 23 - "org.springframework.boot.test.context.SpringBootTest"
Cohesion: 0.39
Nodes (5): org.springframework.boot.test.context.SpringBootTest, org.springframework.transaction.annotation.Transactional, NyareApplicationTests, NoteRepositoryTest, TaskRepositoryTest

### Community 26 - "search-page.js"
Cohesion: 0.24
Nodes (10): doPageSearch(), renderItem(), renderResults(), renderResult(), renderTable(), schedulePageSearch(), select(), setSearchUrl() (+2 more)

### Community 28 - ".addCorsMappings_registersExpectedConfiguration"
Cohesion: 0.24
Nodes (9): org.springframework.context.annotation.Configuration, org.springframework.web.cors.CorsConfiguration, org.springframework.web.servlet.config.annotation.CorsRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer, Override, WebConfig, Override, TestCorsRegistry (+1 more)

### Community 29 - "Course"
Cohesion: 0.09
Nodes (4): AcademicContext, Override, Course, Override

### Community 31 - "Generating Test Notes for Nyare"
Cohesion: 0.17
Nodes (11): 1. Clean Domain Extraction, 2. Auditing Mixed or Outlier Content, Assertion & Verification Patterns, Common Mistakes, Core Fixture Pattern (Java), Generating Test Notes for Nyare, Linking with Academic State & Schedules, Note Taxonomy & Archetypes (+3 more)

### Community 33 - "TaskStatus"
Cohesion: 0.18
Nodes (5): TaskStatusRequest, TaskStatus, COMPLETED, IN_PROGRESS, TODO

### Community 34 - "ImageReferencesValidator"
Cohesion: 0.29
Nodes (5): jakarta.validation.ConstraintValidator, jakarta.validation.ConstraintValidatorContext, java.util.regex.Pattern, ImageReferencesValidator, Override

### Community 35 - "PlanCategory"
Cohesion: 0.20
Nodes (4): PlanCategory, BACKLOG, LATER, SCHEDULED

### Community 36 - "Backend Conventions Index"
Cohesion: 0.25
Nodes (9): Hibernate Naming Strategy Rule, YAGNI Identity Pattern, Backend Conventions Index, REST API & Controller Guidelines, DTO & Validation Guidelines, Domain Entity Guidelines, Canonical Exception Policy, RFC 7807 Problem Details Matrix (+1 more)

### Community 37 - "Prompt Guidelines"
Cohesion: 0.22
Nodes (8): 1. Relative Date Resolution, 2. Preserve Uncertainty, 3. High-Level Planning, 4. Schedule-Anchored Event Resolution, 5. Duration Estimation Bounds (Option 1), Core Structure, Prompt Guidelines, System Prompt Design for Nyare

### Community 38 - "Prompt Engineering for Nyare"
Cohesion: 0.22
Nodes (8): Domain Invariants, Nyare Prompt Architecture, Overview, Prompt Engineering for Nyare, Related Skills & References, Verification Guidelines, When NOT to Use, When to Use

### Community 39 - "group.four.nyare.nyare.model"
Cohesion: 0.22
Nodes (9): AcademicContext, AcademicEvent, Course, ImageMetadata, Note, NoteContent, group.four.nyare.nyare.model, Schedule (+1 more)

### Community 40 - "Schedule"
Cohesion: 0.14
Nodes (3): Override, Schedule, ScheduleRepository

### Community 41 - "Test IntelliJ MCP"
Cohesion: 0.25
Nodes (7): Available Tools Reference, Diagnostic Check Status, Step 1: Query Project Modules, Step 2: Search Files or Symbols, Step 3: Check File Diagnostics, Test IntelliJ MCP, Test Verification Workflow

### Community 42 - "NoteContentConverter"
Cohesion: 0.39
Nodes (5): jakarta.persistence.AttributeConverter, jakarta.persistence.Converter, Override, NoteContentConverter, tools.jackson.databind.ObjectMapper

### Community 43 - "ValidImageReferences"
Cohesion: 0.43
Nodes (6): jakarta.validation.Constraint, jakarta.validation.Payload, java.lang.annotation.Documented, java.lang.annotation.Retention, java.lang.annotation.Target, ValidImageReferences

### Community 45 - "Few-Shot Learning Patterns for Nyare"
Cohesion: 0.33
Nodes (5): 1. Preserving Uncertainty (No Hallucinated Deadlines), 2. Rigid Academic Event Extraction, 3. Event-Anchored Study Task Generation, 4. Cross-Disciplinary Baseline vs. Uncertainty Preservation, Few-Shot Learning Patterns for Nyare

### Community 46 - "Prompt Optimization for Nyare"
Cohesion: 0.33
Nodes (5): 1. XML Tags with Tabular CSV, 2. Stub Reference Identifiers, Prompt Optimization for Nyare, Testing Prompts with Spring AI, Token Optimization Techniques

### Community 47 - "NyareApplication"
Cohesion: 0.60
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaAuditing, NyareApplication

### Community 48 - "Prompt Engineering Skill"
Cohesion: 0.67
Nodes (4): Generating Test Notes Skill, man-spring Spring AI Google GenAI Skill, Nyare System Prompt in system_prompt.st, Prompt Engineering Skill

### Community 49 - "group.four.nyare.nyare.exception"
Cohesion: 0.50
Nodes (4): BadRequestException, group.four.nyare.nyare.exception, group.four.nyare.nyare.exception Class Hierarchy, ResourceNotFoundException

### Community 50 - "group.four.nyare.nyare.model.validation"
Cohesion: 0.50
Nodes (4): ImageReferencesValidator, group.four.nyare.nyare.model.validation, group.four.nyare.nyare.model.validation Class Hierarchy, ValidImageReferences

### Community 51 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 52 - "AcademicEvent Rigid Temporal Constraint"
Cohesion: 0.67
Nodes (3): Course Root Organizational Anchor, Event-Anchored Study Task Generation, AcademicEvent Rigid Temporal Constraint

### Community 53 - "Transaction Demarcation readOnly with Mutating Transactional"
Cohesion: 0.67
Nodes (3): StudyPlannerService.processTodayNotes, Single-Writer Hikari Pool for SQLite, Transaction Demarcation readOnly with Mutating Transactional

### Community 54 - "Task Actionable Study Item"
Cohesion: 0.67
Nodes (3): Rigid Deadline versus Flexible scheduledDate Distinction, Note Immutable Source of Truth, Task Actionable Study Item

### Community 55 - "NoteContent Markdown plus ImageMetadata"
Cohesion: 0.67
Nodes (3): ImageMetadata Base64 and Description, NoteContent Markdown plus ImageMetadata, ValidImageReferences Bijective Validation

### Community 56 - "Service Interface plus Implementation Pattern"
Cohesion: 0.67
Nodes (3): Layer Isolation Controller Service Repository, Service Interface plus Implementation Pattern, Controller WebMvcTest with MockitoBean

### Community 57 - "group.four.nyare.nyare.model.converter"
Cohesion: 0.67
Nodes (3): NoteContentConverter, group.four.nyare.nyare.model.converter, group.four.nyare.nyare.model.converter Class Hierarchy

### Community 58 - "group.four.nyare.nyare.model.enums"
Cohesion: 0.67
Nodes (3): group.four.nyare.nyare.model.enums, group.four.nyare.nyare.model.enums Class Hierarchy, TaskStatus

## Knowledge Gaps
- **217 isolated node(s):** `messages`, `categories`, `itemDesc`, `NO_MATCH`, `CsvHeaders` (+212 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 462 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **82 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BadRequestException` connect `ScheduleResponse` to `org.junit.jupiter.api.Test`, `ProcessSummaryResponse`, `StudyPlannerServiceImplTest.java`, `StudyPlannerEngine.java`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `TaskStatus` connect `TaskStatus` to `Task`, `PlanCategory`, `StudyPlannerEngineIntegrationTest.java`, `org.junit.jupiter.api.Test`, `TaskService`, `TaskRequest`, `StudyPlannerServiceImplTest.java`, `TaskResponse`, `jakarta.persistence.Entity`, `org.springframework.boot.test.context.SpringBootTest`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Why does `NoteContent` connect `NoteContent` to `ImageReferencesValidator`, `StudyPlannerEngineIntegrationTest.java`, `org.junit.jupiter.api.Test`, `NoteContentConverter`, `ValidImageReferences`, `NoteResponse`, `StudyPlannerServiceImplTest.java`, `Note`, `org.springframework.boot.test.context.SpringBootTest`, `ImageMetadata`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **What connects `messages`, `categories`, `itemDesc` to the rest of the system?**
  _217 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Task` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `jquery-3.7.1.min.js` be split into smaller, more focused modules?**
  _Cohesion score 0.073224043715847 - nodes in this community are weakly interconnected._
- **Should `AcademicEventResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.06190476190476191 - nodes in this community are weakly interconnected._