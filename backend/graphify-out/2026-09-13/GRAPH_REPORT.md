# Graph Report - backend  (2026-09-13)

## Corpus Check
- 16 files · ~6,585 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 164 nodes · 233 edges · 14 communities (7 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c2707e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Task
- NyareApplicationTests.java
- gradlew
- NyareApplication
- Course
- AcademicContext
- Model Craft
- Backend Agent Guide (Nyare)
- IntelliJ MCP Backend Workflow & Static Analysis Rule
- AcademicEvent
- Note
- Schedule

## God Nodes (most connected - your core abstractions)
1. `Course` - 32 edges
2. `Task` - 31 edges
3. `Note` - 30 edges
4. `AcademicContext` - 20 edges
5. `AcademicEvent` - 20 edges
6. `Schedule` - 17 edges
7. `Model Craft` - 10 edges
8. `TaskStatus` - 8 edges
9. `IntelliJ MCP Backend Workflow & Static Analysis Rule` - 6 edges
10. `1. JPA & Persistence Annotations` - 6 edges

## Surprising Connections (you probably didn't know these)
- `AcademicContext` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicContext.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `AcademicContext` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicContext.java → src/main/java/group/four/nyare/nyare/Models/Note.java
- `AcademicEvent` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicEvent.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `AcademicEvent` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicEvent.java → src/main/java/group/four/nyare/nyare/Models/Note.java
- `Note` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/Note.java → src/main/java/group/four/nyare/nyare/Models/Course.java

## Import Cycles
- None detected.

## Communities (14 total, 5 thin omitted)

### Community 0 - "Task"
Cohesion: 0.09
Nodes (6): TaskStatus, COMPLETED, IN_PROGRESS, TODO, Override, Task

### Community 1 - "NyareApplicationTests.java"
Cohesion: 0.60
Nodes (3): org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest, NyareApplicationTests

### Community 2 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

### Community 5 - "AcademicContext"
Cohesion: 0.13
Nodes (6): jakarta.persistence.Entity, jakarta.persistence.EntityListeners, jakarta.persistence.Table, org.springframework.data.jpa.domain.support.AuditingEntityListener, AcademicContext, Override

### Community 6 - "Model Craft"
Cohesion: 0.09
Nodes (21): 1. JPA & Persistence Annotations, 2. Bean Validation Constraints, 3. Constructors & Accessors (Vanilla Java), 4. JPA-Safe Identity (`equals`, `hashCode`, `toString`), 5. Domain Javadoc & Comments, 6. Step-by-Step Enhancement Checklist, 7. Canonical Reference Example, 8. Common Mistakes & Anti-Patterns (+13 more)

### Community 7 - "Backend Agent Guide (Nyare)"
Cohesion: 0.29
Nodes (6): Backend Agent Guide (Nyare), Core Architecture & Guidelines, Domain Model (`group.four.nyare.nyare.Models`), Knowledge Graph Workflows (`graphify`), Tech Stack, Verification & Build Tiering

### Community 8 - "IntelliJ MCP Backend Workflow & Static Analysis Rule"
Cohesion: 0.29
Nodes (6): 1. Tool Discovery & Dynamic Capability Inspection, 2. Pre-Build Verification (Immediate Post-Edit Validation), 3. Token-Efficient Code Navigation, 4. Build Tiering & Execution Hierarchy, 5. Unavailability & Fallback Handling, IntelliJ MCP Backend Workflow & Static Analysis Rule

## Knowledge Gaps
- **29 isolated node(s):** `TODO`, `IN_PROGRESS`, `COMPLETED`, `1. Tool Discovery & Dynamic Capability Inspection`, `2. Pre-Build Verification (Immediate Post-Edit Validation)` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 81 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Task` connect `Task` to `Note`, `Course`, `AcademicContext`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Why does `Course` connect `Course` to `Task`, `AcademicContext`, `AcademicEvent`, `Note`, `Schedule`?**
  _High betweenness centrality (0.179) - this node is a cross-community bridge._
- **Why does `Note` connect `Note` to `Task`, `AcademicEvent`, `Course`, `AcademicContext`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **What connects `TODO`, `IN_PROGRESS`, `COMPLETED` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Task` be split into smaller, more focused modules?**
  _Cohesion score 0.09333333333333334 - nodes in this community are weakly interconnected._
- **Should `AcademicContext` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Model Craft` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._