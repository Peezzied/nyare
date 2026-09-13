# Graph Report - backend  (2026-09-13)

## Corpus Check
- 25 files · ~15,404 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 246 nodes · 377 edges · 17 communities (12 shown, 3 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9d2fcced`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Task
- NyareApplicationTests.java
- gradlew
- NyareApplication
- TaskStatus
- Note
- Model Craft
- Backend Agent Guide (Nyare)
- IntelliJ MCP Backend Workflow & Static Analysis Rule
- AcademicEvent
- 4. Endpoints Specification
- Course
- Task Manager Service Implementation Plan
- Nyare Task Management Service API Specification
- ResourceNotFoundException

## God Nodes (most connected - your core abstractions)
1. `Task` - 37 edges
2. `Course` - 35 edges
3. `Note` - 30 edges
4. `AcademicContext` - 20 edges
5. `AcademicEvent` - 20 edges
6. `TaskStatus` - 18 edges
7. `Schedule` - 17 edges
8. `TaskService` - 12 edges
9. `Model Craft` - 10 edges
10. `Task Manager Service Implementation Plan` - 10 edges

## Surprising Connections (you probably didn't know these)
- `AcademicContext` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicContext.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `AcademicEvent` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicEvent.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `AcademicEvent` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicEvent.java → src/main/java/group/four/nyare/nyare/Models/Note.java
- `Note` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/Note.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `Task` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/Task.java → src/main/java/group/four/nyare/nyare/Models/Course.java

## Import Cycles
- None detected.

## Communities (17 total, 3 thin omitted)

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
Cohesion: 0.15
Nodes (14): org.springframework.data.jpa.repository.JpaRepository, org.springframework.data.jpa.repository.Query, org.springframework.stereotype.Service, org.springframework.transaction.annotation.Transactional, TaskRequest, TaskResponse, TaskStatusRequest, TaskStatus (+6 more)

### Community 5 - "Note"
Cohesion: 0.08
Nodes (8): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener, AcademicContext, Override, Override, Note

### Community 6 - "Model Craft"
Cohesion: 0.09
Nodes (21): 1. JPA & Persistence Annotations, 2. Bean Validation Constraints, 3. Constructors & Accessors (Vanilla Java), 4. JPA-Safe Identity (`equals`, `hashCode`, `toString`), 5. Domain Javadoc & Comments, 6. Step-by-Step Enhancement Checklist, 7. Canonical Reference Example, 8. Common Mistakes & Anti-Patterns (+13 more)

### Community 7 - "Backend Agent Guide (Nyare)"
Cohesion: 0.29
Nodes (6): Backend Agent Guide (Nyare), Core Architecture & Guidelines, Domain Model (`group.four.nyare.nyare.Models`), Knowledge Graph Workflows (`graphify`), Tech Stack, Verification & Build Tiering

### Community 8 - "IntelliJ MCP Backend Workflow & Static Analysis Rule"
Cohesion: 0.29
Nodes (6): 1. Tool Discovery & Dynamic Capability Inspection, 2. Pre-Build Verification (Immediate Post-Edit Validation), 3. Token-Efficient Code Navigation, 4. Build Tiering & Execution Hierarchy, 5. Unavailability & Fallback Handling, IntelliJ MCP Backend Workflow & Static Analysis Rule

### Community 12 - "4. Endpoints Specification"
Cohesion: 0.07
Nodes (29): 4.1 Create Task, 4.2 List Tasks, 4.3 Get Task by ID, 4.4 Full Update of Task, 4.5 Update Task Status Only, 4.6 Delete Task, 4. Endpoints Specification, Example Request (+21 more)

### Community 13 - "Course"
Cohesion: 0.09
Nodes (4): Course, Override, Override, Schedule

### Community 14 - "Task Manager Service Implementation Plan"
Cohesion: 0.14
Nodes (13): File Map, Global Constraints, Placeholder Scan, Self-Review Checklist, Spec Coverage, Task 1: DTOs — Request and Response Records, Task 2: Repositories — TaskRepository and CourseRepository, Task 3: Service Layer — TaskService (+5 more)

### Community 15 - "Nyare Task Management Service API Specification"
Cohesion: 0.20
Nodes (9): 1. Overview & Domain Architecture, 2.1 TaskStatus Enum, 2.2 Task Schema Overview, 2. Data Models & Enums, 3.1 400 Bad Request Example (Validation Failure), 3.2 404 Not Found Example, 3. Error Handling (RFC 7807 Problem Details), Nyare Task Management Service API Specification (+1 more)

## Knowledge Gaps
- **68 isolated node(s):** `TODO`, `IN_PROGRESS`, `COMPLETED`, `1. Tool Discovery & Dynamic Capability Inspection`, `2. Pre-Build Verification (Immediate Post-Edit Validation)` (+63 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 114 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Course` connect `Course` to `Task`, `AcademicEvent`, `TaskStatus`, `Note`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `Task` connect `Task` to `Course`, `TaskStatus`, `Note`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `Note` connect `Note` to `Task`, `AcademicEvent`, `Course`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `TODO`, `IN_PROGRESS`, `COMPLETED` to the rest of the system?**
  _68 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Task` be split into smaller, more focused modules?**
  _Cohesion score 0.13846153846153847 - nodes in this community are weakly interconnected._
- **Should `TaskStatus` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Should `Note` be split into smaller, more focused modules?**
  _Cohesion score 0.08205128205128205 - nodes in this community are weakly interconnected._