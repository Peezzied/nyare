# Graph Report - backend  (2026-09-11)

## Corpus Check
- 12 files · ~1,586 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 37 nodes · 42 edges · 11 communities (3 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `458b8e8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- TaskStatus
- NyareApplicationTests.java
- gradlew
- NyareApplication
- Course
- AcademicContext
- AcademicEvent
- Schedule
- Note

## God Nodes (most connected - your core abstractions)
1. `Course` - 6 edges
2. `TaskStatus` - 6 edges
3. `Note` - 5 edges
4. `AcademicContext` - 4 edges
5. `AcademicEvent` - 4 edges
6. `Schedule` - 4 edges
7. `Task` - 4 edges
8. `NyareApplication` - 3 edges
9. `NyareApplicationTests` - 3 edges
10. `TODO` - 1 edges

## Surprising Connections (you probably didn't know these)
- `AcademicContext` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicContext.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `AcademicContext` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicContext.java → src/main/java/group/four/nyare/nyare/Models/Note.java
- `AcademicEvent` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicEvent.java → src/main/java/group/four/nyare/nyare/Models/Course.java
- `AcademicEvent` --references--> `Note`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/AcademicEvent.java → src/main/java/group/four/nyare/nyare/Models/Note.java
- `Schedule` --references--> `Course`  [EXTRACTED]
  src/main/java/group/four/nyare/nyare/Models/Schedule.java → src/main/java/group/four/nyare/nyare/Models/Course.java

## Import Cycles
- None detected.

## Communities (11 total, 6 thin omitted)

### Community 0 - "TaskStatus"
Cohesion: 0.29
Nodes (6): TaskStatus, COMPLETED, IN_PROGRESS, TODO, Entity, Task

### Community 1 - "NyareApplicationTests.java"
Cohesion: 0.60
Nodes (3): org.junit.jupiter.api.Test, org.springframework.boot.test.context.SpringBootTest, NyareApplicationTests

### Community 2 - "gradlew"
Cohesion: 0.83
Nodes (3): gradlew script, die(), warn()

## Knowledge Gaps
- **3 isolated node(s):** `TODO`, `IN_PROGRESS`, `COMPLETED`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 14 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Course` connect `Course` to `TaskStatus`, `AcademicContext`, `AcademicEvent`, `Schedule`?**
  _High betweenness centrality (0.208) - this node is a cross-community bridge._
- **Why does `Task` connect `TaskStatus` to `Course`?**
  _High betweenness centrality (0.165) - this node is a cross-community bridge._
- **What connects `TODO`, `IN_PROGRESS`, `COMPLETED` to the rest of the system?**
  _3 weakly-connected nodes found - possible documentation gaps or missing edges._