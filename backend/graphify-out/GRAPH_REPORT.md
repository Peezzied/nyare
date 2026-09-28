# Graph Report - backend  (2026-09-28)

## Corpus Check
- 160 files · ~106,042 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1072 nodes · 1868 edges · 139 communities (51 shown, 81 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 175 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Service Repository Tests
- JQuery Minified Noise
- Exception Handling Policy
- Engine Test Fixtures
- Notes API Reference
- Schedule DTO Methods
- Javadoc Script Utilities
- Javadoc Search Logic
- AI Engine Unit Tests
- Schedule API Reference
- Task API Reference
- Academic Events API
- Spring AI GenAI Guide
- Planner Controller SSE
- AcademicEvent Entity
- Test Log Listener
- Task Request Model
- Note Response DTO
- Prompt Builder Engine
- Task Response DTO
- Planner Audit Records
- Planner Audit Advisor
- Course Note Relations
- Stub Reference Codec
- Image Metadata Model
- CSV Parser Utility
- Javadoc Page Search
- Spring AI Integration Tests
- CORS Web Configuration
- Academic Context Entity
- Note Request DTO
- Test Notes Skill
- JPA Entity Index
- Task Status Enum
- Image Reference Validation
- Plan Category Enum
- Backend Conventions Index
- System Prompt Design
- Prompt Engineering Skill
- Domain Model Package
- Course Entity
- IntelliJ MCP Skill
- Note Content Converter
- Validation Annotations
- Task Service Operations
- Few-Shot Patterns
- Prompt Optimization
- Application Bootstrap
- AI Skills Index
- Exception Hierarchy
- Validation Package
- Gradle Wrapper Script
- Course Event Anchoring
- Planner Transactions
- Rigid Flexible Distinction
- Note Content Images
- Layer Isolation Pattern
- Converter Package
- Enums Package
- DejaVu License
- JQuery License
- JQuery UI License
- Spring Docs Rules
- Planning Status Enums
- Virtual Study Plan
- Skills Overview
- ChatClient API
- Append-Only Notes Lifecycle
- Note Audit Advisor
- Temporal Date Resolution
- Structured Output Uncertainty
- Stub Codec Tokens
- Response Schemas
- Schedule Integrity Rules
- Config Package
- Controller Package
- Event DTO Pair
- Note DTO Pair
- Schedule DTO Pair
- Task DTO Pair
- Root Package
- Repository Package
- Service Package
- Offline Fallback Protocol
- IntelliJ Backend Workflow
- Tier One Verification
- Model Craft Standard
- Tri-State Recommendations
- GenAI Chat Model
- Tool Function Calling
- XML CSV Reduction
- MCP Server Tools
- DayOfWeek Enum
- Task Request Schema
- DTO Hierarchy
- Kebab-Case Endpoints
- Service Mapping
- Identifier Strategy
- Lazy Fetching
- Class Index
- Package Index
- Config Hierarchy
- Controller Hierarchy
- Image Update Request
- DTO Package
- Status Request DTO
- Model Hierarchy
- Application Class
- Event Repository
- Course Repository
- Note Repository
- Schedule Repository
- Task Repository
- Event Service
- Note Service
- Schedule Service
- Task Service Spec
- API Help Page
- Class Index Page
- Overview Summary
- Overview Tree
- Copy Icon
- Search Icon
- Left Arrow Icon
- Link Icon
- Right Arrow Icon
- Close Icon
- Search Page
- Serialized Form
- Task Plan Document
- Task Controller Spec
- Task Repository Spec

## God Nodes (most connected - your core abstractions)
1. `Note` - 50 edges
2. `Task` - 43 edges
3. `AcademicEvent` - 35 edges
4. `NoteContent` - 33 edges
5. `TaskResponse` - 32 edges
6. `Schedule` - 30 edges
7. `StudyPlannerEngine` - 29 edges
8. `AcademicContext` - 29 edges
9. `AcademicEventResponse` - 21 edges
10. `NoteResponse` - 21 edges

## Surprising Connections (you probably didn't know these)
- `Append-Only Materialization No Auto-Reconciliation` --conceptually_related_to--> `Non-Cascading Note Deletion Lifecycle`  [INFERRED]
  .agents/skills/architect-craft/SKILL.md → docs/api/notes-api/notes-api.md
- `Hibernate Naming Strategy Rule` --rationale_for--> `Domain Entity Guidelines`  [EXTRACTED]
  .agents/skills/model-craft/SKILL.md → docs/conventions/entities.md
- `YAGNI Identity Pattern` --rationale_for--> `Domain Entity Guidelines`  [EXTRACTED]
  .agents/skills/model-craft/SKILL.md → docs/conventions/entities.md
- `Virtual Study Plan Zero Persistence` --references--> `StudyPlan Virtual Presentation Construct`  [EXTRACTED]
  .agents/skills/architect-craft/SKILL.md → AGENTS.md
- `Event-Anchored Study Task Generation` --references--> `AcademicEvent Rigid Temporal Constraint`  [EXTRACTED]
  .agents/skills/prompt-engineering/references/few-shot-patterns.md → docs/api/academic-events-api/academic-events-api.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Task CRUD Service Stack** — docs_superpowers_plans_2026_09_13_task_manager_service_task_controller_spec, docs_superpowers_plans_2026_09_13_task_manager_service_task_service_spec, docs_superpowers_plans_2026_09_13_task_manager_service_task_repository_spec [EXTRACTED 1.00]
- **Tri-State Study Plan Presentation** — backend_agents_skills_architect_craft_skill_tri_state, backend_agents_md_plancategory, backend_docs_api_task_api_task_api_taskstatus [EXTRACTED 1.00]
- **Rigid Event versus Flexible Task Distinction** — backend_docs_api_academic_events_api_academic_events_api_academicevent, backend_docs_api_task_api_task_api_task, backend_docs_api_academic_events_api_academic_events_api_rigid_vs_flexible [EXTRACTED 1.00]
- **Nyare Prompt Architecture Extraction Pipeline** — backend_agents_skills_prompt_engineering_skill_prompt_engineering, backend_agents_skills_prompt_engineering_references_system_prompt_design_system_prompt, backend_agents_skills_man_spring_skill_chatclient [EXTRACTED 1.00]

## Communities (139 total, 81 thin omitted)

### Community 0 - "Service Repository Tests"
Cohesion: 0.07
Nodes (26): Builder, group.four.nyare.nyare.model.Course, org.junit.jupiter.api.BeforeEach, org.junit.jupiter.api.extension.ExtendWith, org.mockito.junit.jupiter.MockitoExtension, org.springframework.beans.factory.annotation.Autowired, org.springframework.core.io.Resource, org.springframework.data.jpa.repository.JpaRepository (+18 more)

### Community 1 - "JQuery Minified Noise"
Cohesion: 0.07
Nodes (39): Ae(), B(), Be(), c(), $e(), ee(), F(), fe() (+31 more)

### Community 2 - "Exception Handling Policy"
Cohesion: 0.05
Nodes (10): org.springframework.http.ProblemDetail, org.springframework.web.bind.annotation.ExceptionHandler, org.springframework.web.bind.annotation.RestControllerAdvice, org.springframework.web.bind.MethodArgumentNotValidException, GlobalExceptionHandler, AcademicEventRequest, AcademicEventResponse, BadRequestException (+2 more)

### Community 3 - "Engine Test Fixtures"
Cohesion: 0.11
Nodes (14): org.junit.jupiter.api.TestInfo, org.springframework.boot.autoconfigure.EnableAutoConfiguration, org.springframework.boot.SpringBootConfiguration, org.springframework.boot.test.system.CapturedOutput, org.springframework.boot.test.system.OutputCaptureExtension, org.springframework.context.annotation.Import, ExtractedData, Course (+6 more)

### Community 4 - "Notes API Reference"
Cohesion: 0.09
Nodes (31): 1. Overview & Domain Architecture, `200 OK`, `201 Created`, `204 No Content`, 2.1 Note Schema Overview, 2.2 NoteContent Object, 2.3 ImageMetadata Object, 2. Data Models & Schemas (+23 more)

### Community 5 - "Schedule DTO Methods"
Cohesion: 0.08
Nodes (3): ScheduleRequest, ScheduleResponse, ScheduleService

### Community 6 - "Javadoc Script Utilities"
Cohesion: 0.11
Nodes (20): copySnippet(), copyToClipboard(), createElem(), expand(), getVisibleFilterInput(), handleScroll(), initSectionData(), loadScripts() (+12 more)

### Community 7 - "Javadoc Search Logic"
Cohesion: 0.14
Nodes (26): categories, checkUnnamed(), createMatcher(), doSearch(), getClassPrefix(), getPrefix(), searchIndex(), escapeHtml() (+18 more)

### Community 8 - "AI Engine Unit Tests"
Cohesion: 0.17
Nodes (6): org.junit.jupiter.api.Disabled, org.junit.jupiter.api.DisplayName, org.junit.jupiter.api.Test, org.springframework.ai.chat.client.ChatClient, StudyPlannerEngineTest, NoteTest

### Community 9 - "Schedule API Reference"
Cohesion: 0.11
Nodes (25): 1. Overview & Domain Architecture, 2.1 DayOfWeek Enum, 2.2 Schedule Schema Overview, 2. Data Models & Schemas, 3.1 400 Bad Request Example (Validation Failure), 3.2 400 Bad Request Example (Time Integrity Violation), 3.3 404 Not Found Example (Course Not Found), 3.4 404 Not Found Example (Schedule Not Found) (+17 more)

### Community 10 - "Task API Reference"
Cohesion: 0.13
Nodes (24): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+16 more)

### Community 11 - "Academic Events API"
Cohesion: 0.12
Nodes (23): 1. Overview & Domain Architecture, 2.1 AcademicEvent Schema Overview, 2. Data Models & Schemas, 3.1 400 Bad Request Example (Cross-Entity Course Mismatch), 3.2 400 Bad Request Example (Validation Failure), 3.3 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Academic Event (+15 more)

### Community 12 - "Spring AI GenAI Guide"
Cohesion: 0.10
Nodes (20): 1. `GoogleGenAiChatModel`, 2. High-Level `ChatClient`, 3. Structured Output Extraction, 4. Multimodal Inputs, 5. Function Calling with `@Tool`, 6. Dynamic `GoogleGenAiChatOptions`, 7. Context Caching, Application Properties (+12 more)

### Community 13 - "Planner Controller SSE"
Cohesion: 0.14
Nodes (8): org.springframework.web.bind.annotation.PostMapping, org.springframework.web.bind.annotation.RequestMapping, org.springframework.web.bind.annotation.RestController, org.springframework.web.servlet.mvc.method.annotation.SseEmitter, StudyPlannerController, ProcessSummaryResponse, StudyPlannerService, SseEmitter

### Community 14 - "AcademicEvent Entity"
Cohesion: 0.11
Nodes (3): AcademicEvent, Course, Override

### Community 15 - "Test Log Listener"
Cohesion: 0.19
Nodes (9): FileOutputStream, java.io.FileOutputStream, org.junit.platform.engine.TestExecutionResult, org.junit.platform.launcher.TestExecutionListener, org.junit.platform.launcher.TestIdentifier, org.junit.platform.launcher.TestPlan, ConsoleLogListener, DualOutputStream (+1 more)

### Community 18 - "Prompt Builder Engine"
Cohesion: 0.17
Nodes (3): org.springframework.ai.chat.prompt.Prompt, Prompt, TaggedPromptBuilder

### Community 20 - "Planner Audit Records"
Cohesion: 0.22
Nodes (10): com.fasterxml.jackson.annotation.JsonIgnoreProperties, InternalIgnoredNote, LlmPayload, PlannerAuditRecords, RawEvent, RawIgnoredNote, RawTask, ExtractedContext (+2 more)

### Community 21 - "Planner Audit Advisor"
Cohesion: 0.22
Nodes (10): com.fasterxml.jackson.databind.JsonNode, com.fasterxml.jackson.databind.ObjectMapper, org.slf4j.Logger, org.springframework.ai.chat.client.advisor.api.CallAdvisorChain, org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor, org.springframework.ai.chat.client.ChatClientRequest, org.springframework.ai.chat.client.ChatClientResponse, org.springframework.stereotype.Component (+2 more)

### Community 22 - "Course Note Relations"
Cohesion: 0.14
Nodes (3): Course, Override, Note

### Community 25 - "CSV Parser Utility"
Cohesion: 0.25
Nodes (5): org.apache.commons.csv.CSVFormat, org.apache.commons.csv.CSVRecord, CsvParser, CsvParserTest, SampleTask

### Community 26 - "Javadoc Page Search"
Cohesion: 0.24
Nodes (10): doPageSearch(), renderItem(), renderResults(), renderResult(), renderTable(), schedulePageSearch(), select(), setSearchUrl() (+2 more)

### Community 27 - "Spring AI Integration Tests"
Cohesion: 0.23
Nodes (9): org.springframework.ai.chat.model.ChatModel, org.springframework.boot.test.context.SpringBootTest, org.springframework.transaction.annotation.Transactional, SpringAiIntegrationTest, NyareApplicationTests, CourseRepository, NoteRepositoryTest, CourseRepository (+1 more)

### Community 28 - "CORS Web Configuration"
Cohesion: 0.24
Nodes (9): org.springframework.context.annotation.Configuration, org.springframework.web.cors.CorsConfiguration, org.springframework.web.servlet.config.annotation.CorsRegistry, org.springframework.web.servlet.config.annotation.WebMvcConfigurer, Override, WebConfig, Override, TestCorsRegistry (+1 more)

### Community 29 - "Academic Context Entity"
Cohesion: 0.18
Nodes (3): AcademicContext, Course, Override

### Community 31 - "Test Notes Skill"
Cohesion: 0.17
Nodes (11): 1. Clean Domain Extraction, 2. Auditing Mixed or Outlier Content, Assertion & Verification Patterns, Common Mistakes, Core Fixture Pattern (Java), Generating Test Notes for Nyare, Linking with Academic State & Schedules, Note Taxonomy & Archetypes (+3 more)

### Community 32 - "JPA Entity Index"
Cohesion: 0.45
Nodes (5): Index (index.html), jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener

### Community 33 - "Task Status Enum"
Cohesion: 0.27
Nodes (5): TaskStatusRequest, TaskStatus, COMPLETED, IN_PROGRESS, TODO

### Community 34 - "Image Reference Validation"
Cohesion: 0.29
Nodes (5): jakarta.validation.ConstraintValidator, jakarta.validation.ConstraintValidatorContext, java.util.regex.Pattern, ImageReferencesValidator, Override

### Community 35 - "Plan Category Enum"
Cohesion: 0.20
Nodes (4): PlanCategory, BACKLOG, LATER, SCHEDULED

### Community 36 - "Backend Conventions Index"
Cohesion: 0.25
Nodes (9): Hibernate Naming Strategy Rule, YAGNI Identity Pattern, Backend Conventions Index, REST API & Controller Guidelines, DTO & Validation Guidelines, Domain Entity Guidelines, Canonical Exception Policy, RFC 7807 Problem Details Matrix (+1 more)

### Community 37 - "System Prompt Design"
Cohesion: 0.22
Nodes (8): 1. Relative Date Resolution, 2. Preserve Uncertainty, 3. High-Level Planning, 4. Schedule-Anchored Event Resolution, 5. Duration Estimation Bounds (Option 1), Core Structure, Prompt Guidelines, System Prompt Design for Nyare

### Community 38 - "Prompt Engineering Skill"
Cohesion: 0.22
Nodes (8): Domain Invariants, Nyare Prompt Architecture, Overview, Prompt Engineering for Nyare, Related Skills & References, Verification Guidelines, When NOT to Use, When to Use

### Community 39 - "Domain Model Package"
Cohesion: 0.22
Nodes (9): AcademicContext, AcademicEvent, Course, ImageMetadata, Note, NoteContent, group.four.nyare.nyare.model, Schedule (+1 more)

### Community 41 - "IntelliJ MCP Skill"
Cohesion: 0.25
Nodes (7): Available Tools Reference, Diagnostic Check Status, Step 1: Query Project Modules, Step 2: Search Files or Symbols, Step 3: Check File Diagnostics, Test IntelliJ MCP, Test Verification Workflow

### Community 42 - "Note Content Converter"
Cohesion: 0.39
Nodes (5): jakarta.persistence.AttributeConverter, jakarta.persistence.Converter, Override, NoteContentConverter, tools.jackson.databind.ObjectMapper

### Community 43 - "Validation Annotations"
Cohesion: 0.43
Nodes (6): jakarta.validation.Constraint, jakarta.validation.Payload, java.lang.annotation.Documented, java.lang.annotation.Retention, java.lang.annotation.Target, ValidImageReferences

### Community 45 - "Few-Shot Patterns"
Cohesion: 0.33
Nodes (5): 1. Preserving Uncertainty (No Hallucinated Deadlines), 2. Rigid Academic Event Extraction, 3. Event-Anchored Study Task Generation, 4. Cross-Disciplinary Baseline vs. Uncertainty Preservation, Few-Shot Learning Patterns for Nyare

### Community 46 - "Prompt Optimization"
Cohesion: 0.33
Nodes (5): 1. XML Tags with Tabular CSV, 2. Stub Reference Identifiers, Prompt Optimization for Nyare, Testing Prompts with Spring AI, Token Optimization Techniques

### Community 47 - "Application Bootstrap"
Cohesion: 0.60
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaAuditing, NyareApplication

### Community 48 - "AI Skills Index"
Cohesion: 0.67
Nodes (4): Generating Test Notes Skill, man-spring Spring AI Google GenAI Skill, Nyare System Prompt in system_prompt.st, Prompt Engineering Skill

### Community 49 - "Exception Hierarchy"
Cohesion: 0.50
Nodes (4): BadRequestException, group.four.nyare.nyare.exception, group.four.nyare.nyare.exception Class Hierarchy, ResourceNotFoundException

### Community 50 - "Validation Package"
Cohesion: 0.50
Nodes (4): ImageReferencesValidator, group.four.nyare.nyare.model.validation, group.four.nyare.nyare.model.validation Class Hierarchy, ValidImageReferences

### Community 51 - "Gradle Wrapper Script"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 52 - "Course Event Anchoring"
Cohesion: 0.67
Nodes (3): Course Root Organizational Anchor, Event-Anchored Study Task Generation, AcademicEvent Rigid Temporal Constraint

### Community 53 - "Planner Transactions"
Cohesion: 0.67
Nodes (3): StudyPlannerService.processTodayNotes, Single-Writer Hikari Pool for SQLite, Transaction Demarcation readOnly with Mutating Transactional

### Community 54 - "Rigid Flexible Distinction"
Cohesion: 0.67
Nodes (3): Rigid Deadline versus Flexible scheduledDate Distinction, Note Immutable Source of Truth, Task Actionable Study Item

### Community 55 - "Note Content Images"
Cohesion: 0.67
Nodes (3): ImageMetadata Base64 and Description, NoteContent Markdown plus ImageMetadata, ValidImageReferences Bijective Validation

### Community 56 - "Layer Isolation Pattern"
Cohesion: 0.67
Nodes (3): Layer Isolation Controller Service Repository, Service Interface plus Implementation Pattern, Controller WebMvcTest with MockitoBean

### Community 57 - "Converter Package"
Cohesion: 0.67
Nodes (3): NoteContentConverter, group.four.nyare.nyare.model.converter, group.four.nyare.nyare.model.converter Class Hierarchy

### Community 58 - "Enums Package"
Cohesion: 0.67
Nodes (3): group.four.nyare.nyare.model.enums, group.four.nyare.nyare.model.enums Class Hierarchy, TaskStatus

## Knowledge Gaps
- **217 isolated node(s):** `1. Overview & Domain Architecture`, `2.1 Note Schema Overview`, `2.2 NoteContent Object`, `2.3 ImageMetadata Object`, `1. Overview & Domain Architecture` (+212 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 466 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **81 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `NoteContent` connect `Note Request DTO` to `Service Repository Tests`, `Image Reference Validation`, `Engine Test Fixtures`, `AI Engine Unit Tests`, `Note Content Converter`, `Validation Annotations`, `Note Response DTO`, `Course Note Relations`, `Image Metadata Model`, `Spring AI Integration Tests`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `Task` connect `Service Repository Tests` to `JPA Entity Index`, `Plan Category Enum`, `Engine Test Fixtures`, `AI Engine Unit Tests`, `Task Request Model`, `Prompt Builder Engine`, `Planner Audit Records`, `Course Note Relations`, `Spring AI Integration Tests`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Note` connect `Course Note Relations` to `JPA Entity Index`, `Service Repository Tests`, `Engine Test Fixtures`, `AI Engine Unit Tests`, `AcademicEvent Entity`, `Prompt Builder Engine`, `Planner Audit Records`, `Image Metadata Model`, `Spring AI Integration Tests`, `Academic Context Entity`, `Note Request DTO`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `1. Overview & Domain Architecture`, `2.1 Note Schema Overview`, `2.2 NoteContent Object` to the rest of the system?**
  _217 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Service Repository Tests` be split into smaller, more focused modules?**
  _Cohesion score 0.07229832572298325 - nodes in this community are weakly interconnected._
- **Should `JQuery Minified Noise` be split into smaller, more focused modules?**
  _Cohesion score 0.06994535519125683 - nodes in this community are weakly interconnected._
- **Should `Exception Handling Policy` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._