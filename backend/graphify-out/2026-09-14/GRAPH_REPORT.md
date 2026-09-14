# Graph Report - backend  (2026-09-14)

## Corpus Check
- 33 files · ~17,918 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 350 nodes · 544 edges · 22 communities (15 shown, 5 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4f50caab`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TaskResponse
- NyareApplicationTests.java
- gradlew
- NyareApplication
- TaskStatus
- jakarta.persistence.Entity
- Model Craft
- Backend Agent Guide (Nyare)
- IntelliJ MCP Backend Workflow & Static Analysis Rule
- AcademicEvent
- 4. Endpoints Specification
- AcademicContext
- Task Manager Service Implementation Plan
- AcademicEventResponse
- TaskServiceImpl.java
- Note
- Schedule
- Course
- Nyare Backend Conventions and Standards
- Foundation 2: Core Domain Invariants

## God Nodes (most connected - your core abstractions)
1. `TaskResponse` - 36 edges
2. `Task` - 35 edges
3. `Course` - 33 edges
4. `TaskStatus` - 29 edges
5. `AcademicEvent` - 28 edges
6. `Note` - 28 edges
7. `AcademicEventResponse` - 21 edges
8. `TaskRequest` - 21 edges
9. `AcademicContext` - 18 edges
10. `AcademicEventRequest` - 15 edges

## Surprising Connections (you probably didn't know these)
- `TaskResponse` --references--> `TaskStatus`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/dto/TaskResponse.java → src/main/java/group/four/nyare/nyare/model/enums/TaskStatus.java
- `AcademicContext` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/model/AcademicContext.java → src/main/java/group/four/nyare/nyare/model/Course.java
- `AcademicContext` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/model/AcademicContext.java → src/main/java/group/four/nyare/nyare/model/Note.java
- `AcademicEvent` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/model/AcademicEvent.java → src/main/java/group/four/nyare/nyare/model/Course.java
- `AcademicEvent` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/model/AcademicEvent.java → src/main/java/group/four/nyare/nyare/model/Note.java

## Import Cycles
- None detected.

## Communities (22 total, 5 thin omitted)

### Community 0 - "TaskResponse"
Cohesion: 0.07
Nodes (4): TaskResponse, Override, Task, TaskService

### Community 1 - "NyareApplicationTests.java"
Cohesion: 0.60
Nodes (3): org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest, NyareApplicationTests

### Community 2 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 3 - "NyareApplication"
Cohesion: 0.60
Nodes (3): org.springframework.boot.autoconfigure.SpringBootApplication, org.springframework.data.jpa.repository.config.EnableJpaAuditing, NyareApplication

### Community 4 - "TaskStatus"
Cohesion: 0.11
Nodes (7): TaskRequest, TaskStatusRequest, TaskStatus, COMPLETED, IN_PROGRESS, TODO, Override

### Community 5 - "jakarta.persistence.Entity"
Cohesion: 0.44
Nodes (4): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener

### Community 6 - "Model Craft"
Cohesion: 0.13
Nodes (14): 1. JPA & Persistence Annotations, 2. Bean Validation Constraints, 3. Constructors & Accessors, 4. YAGNI Identity (No `equals()` / `hashCode()` Bloat), 5. Domain Javadoc, 6. Canonical Reference Example, Auditing & Temporal Fields, Entity & Table Declarations (+6 more)

### Community 7 - "Backend Agent Guide (Nyare)"
Cohesion: 0.29
Nodes (6): Backend Agent Guide (Nyare), Core Architecture & Guidelines, Domain Model (`group.four.nyare.nyare.model`), Knowledge Graph Workflows (`graphify`), Tech Stack, Verification & Build Tiering

### Community 8 - "IntelliJ MCP Backend Workflow & Static Analysis Rule"
Cohesion: 0.29
Nodes (6): 1. Tool Discovery & Dynamic Capability Inspection, 2. Pre-Build Verification (Immediate Post-Edit Validation), 3. Token-Efficient Code Navigation, 4. Build Tiering & Execution Hierarchy, 5. Unavailability & Fallback Handling, IntelliJ MCP Backend Workflow & Static Analysis Rule

### Community 12 - "4. Endpoints Specification"
Cohesion: 0.05
Nodes (38): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), 4.1 Create Task (+30 more)

### Community 14 - "Task Manager Service Implementation Plan"
Cohesion: 0.14
Nodes (13): File Map, Global Constraints, Placeholder Scan, Self-Review Checklist, Spec Coverage, Task 1: DTOs — Request and Response Records, Task 2: Repositories — TaskRepository and CourseRepository, Task 3: Service Layer — TaskService (+5 more)

### Community 15 - "AcademicEventResponse"
Cohesion: 0.06
Nodes (5): AcademicEventRequest, AcademicEventResponse, BadRequestException, ResourceNotFoundException, AcademicEventService

### Community 16 - "TaskServiceImpl.java"
Cohesion: 0.21
Nodes (8): org.springframework.data.jpa.repository.JpaRepository, org.springframework.data.jpa.repository.Query, org.springframework.stereotype.Service, org.springframework.transaction.annotation.Transactional, AcademicEventRepository, CourseRepository, TaskRepository, TaskServiceImpl

### Community 20 - "Nyare Backend Conventions and Standards"
Cohesion: 0.18
Nodes (10): 1. Architecture Overview, 2. Package Structure & Naming, 3. Domain Entity Guidelines, 4. DTO & Validation Guidelines, 5. Service & Transaction Guidelines, 6. REST API & Controller Guidelines, 7. Persistence & SQLite Guidelines, 8. Verification & Testing Standards (+2 more)

### Community 21 - "Foundation 2: Core Domain Invariants"
Cohesion: 0.11
Nodes (17): 1. `Course` is the Root Organizational Anchor, 2. Rigid Constraints vs. Flexible Recommendations, 3. Virtual Study Plan (Zero Persistence Entity), 4. Tri-State Study Plan Recommendations, 5. Append-Only Materialization (No Auto-Reconciliation), 6. Strict Scoping of AI Extraction, 7. Dynamic Holistic Reasoning (No Deterministic Scoring), 8. Preserve Uncertainty (Zero Data Fabrication) (+9 more)

## Knowledge Gaps
- **86 isolated node(s):** `TODO`, `IN_PROGRESS`, `COMPLETED`, `1. Tool Discovery & Dynamic Capability Inspection`, `2. Pre-Build Verification (Immediate Post-Edit Validation)` (+81 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 187 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Course` connect `Course` to `TaskResponse`, `jakarta.persistence.Entity`, `AcademicEvent`, `AcademicContext`, `TaskServiceImpl.java`, `Note`, `Schedule`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **Why does `Task` connect `TaskResponse` to `TaskStatus`, `jakarta.persistence.Entity`, `TaskServiceImpl.java`, `Note`, `Course`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `ResourceNotFoundException` connect `AcademicEventResponse` to `TaskServiceImpl.java`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **What connects `TODO`, `IN_PROGRESS`, `COMPLETED` to the rest of the system?**
  _86 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `TaskResponse` be split into smaller, more focused modules?**
  _Cohesion score 0.06570048309178744 - nodes in this community are weakly interconnected._
- **Should `TaskStatus` be split into smaller, more focused modules?**
  _Cohesion score 0.1140819964349376 - nodes in this community are weakly interconnected._
- **Should `Model Craft` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._