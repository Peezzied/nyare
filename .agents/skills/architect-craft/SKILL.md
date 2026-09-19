---
name: architect-craft
description: Design or review Nyare architecture. Integrate domain invariants with man-spring practices.
---

# Architect Craft

## Overview

Architect Craft define system architecture rules for Nyare. Unify Superpowers planning, core domain invariants, and [`man-spring`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/backend/.agents/skills/man-spring/SKILL.md) backend standards.

Enforce boundaries, ubiquitous language, and patterns. Stop over-engineering.

---

## When to Use

- Design REST endpoints or API contracts (`/api/...`).
- Create or edit domain services, repositories, DTOs.
- Design AI pipelines (note entity extraction, study plan generation).
- Build student feedback loops or plan reconsideration.
- Review pull requests or design plans for architectural violations.

### When NOT to Use

- Routine entity field or annotation edits (use `model-craft`).
- Pure frontend CSS styling without domain logic.
- Local bug fixes inside boundaries (use `surgical-patch`).

---

## Foundation 1: Process Integration with Superpowers

Follow Superpowers lifecycle:

1. **Exploration & Requirements Phase**:
   - Run [`superpowers:brainstorming`](file:///C:/Users/karol/.gemini/config/plugins/superpowers/skills/brainstorming/SKILL.md) before design or behavior changes.
   - Clarify domain constraints. Propose alternatives with trade-offs. Get user approval before code edits.
2. **Implementation Planning Phase**:
   - Run [`superpowers:writing-plans`](file:///C:/Users/karol/.gemini/config/plugins/superpowers/skills/writing-plans/SKILL.md) after spec approval.
   - Split architecture changes into small TDD tasks with test gates and atomic commits.

---

## Foundation 2: Spring Boot & Spring AI Standards (`man-spring`)

Use [`man-spring`](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/backend/.agents/skills/man-spring/SKILL.md) for Spring Boot and Spring AI standards:

1. **Modern Runtime & Framework**:
   - Java 25, Spring Boot 4.x (`webmvc`, `data-jpa`, `validation`).
2. **Layered Architecture & YAGNI Service Layer**:
   - Lowercase package names: `model`, `dto`, `repository`, `service`, `controller`, `exception`.
   - Add service layer only for real business logic or orchestration (AI integration, multiple repositories). Controllers call repositories direct for simple CRUD.
3. **Configuration over Complexity**:
   - Use `application.properties`, not YAML.
   - Externalize secrets and environments.
4. **RESTful API Contracts**:
   - RFC 7807 problem details (`ProblemDetail`).
   - Unversioned resource endpoints (for example `/api/courses`, `/api/tasks`).
5. **Startup Banner & Developer Ergonomics**:
   - Print local endpoints and database status on boot.
   - Use Testcontainers or `spring-boot-docker-compose` for tests.
6. **Tiered Verification**:
   - **Tier 1**: IntelliJ MCP static checks and in-memory compile.
   - **Tier 2**: Targeted test run (`./gradlew test --tests <ClassName>`).
   - **Tier 3**: Monolithic build as final gate only.

---

## Foundation 3: Core Domain Invariants

Architecture must follow docs:
- [Conceptual Model & Domain Dictionary](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/conceptual-model.md)
- [System Workflows & Diagrams](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/system-workflows.md)
- [MVP Boundaries & Non-Goals](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/mvp-boundaries.md)

### 1. `Course` is Root Organizational Anchor
* Every student entity (`Schedule`, `Note`, `Task`, `AcademicEvent`, `AcademicContext`) link to exactly one `Course`.
* Multi-course aggregation happen only at calendar or plan display layer.

### 2. Rigid Constraints vs. Flexible Recommendations
* **`AcademicEvent.deadline`** (Timestamp): Rigid external constraint (`Exam`, `Quiz`, `Presentation`, `Class Activity`, `Deadline`). Never shift deadlines silently.
* **`Task.scheduledDate`** (Date only): Flexible recommendation. Missing date breaks no constraints.
* **Rule**: Never use same field or table for rigid deadlines and flexible tasks.

### 3. Virtual Study Plan (Zero Persistence Entity)
* **Rule**: Study plan is NEVER database entity.
* Never create `@Entity public class StudyPlan` or `study_plans` table.
* Synthesize study plan on request as dynamic DTO:
  ```java
  public record StudyPlanDto(
      LocalDate generatedForDate,
      List<TaskResponseDto> scheduledTasks,     // Calendar Grid
      List<TaskResponseDto> flexibleTasks,      // Later Area
      List<TaskResponseDto> needsContextTasks,  // Needs Context Area
      String plannerSummary
  ) {}
  ```

### 4. Tri-State Study Plan Recommendations
Map recommendations direct to UI layout:
1. **Scheduled**: Confident date. Render in Calendar Grid.
2. **Flexible / Later**: Actionable without target date. Render in Later Area.
3. **Needs Context**: Missing details for confident scheduling. Render in Needs Context Area.

### 5. Append-Only Materialization (No Auto-Reconciliation)
* AI extracts new entities from notes into fresh database rows (`Task`, `AcademicEvent`, `AcademicContext`).
* **Rule**: Do NOT merge, split, deduplicate, or update existing tasks automatically.
* Past entities remain immutable context. Never overwrite prior entities on new note processing.

### 6. Strict Scoping of AI Extraction
* Endpoint `POST /api/ai/process-today`:
  1. **Explicit**: Run only on direct student action.
  2. **Today only**: Read only notes where `date(createdAt) == today()`.
* Never run unprompted background note jobs or historical bulk re-processing.

### 7. Dynamic Holistic Reasoning (No Deterministic Scoring)
* No math priority scoring formulas (`weight * factor - days`).
* No static priority column in `tasks`.
* Reason dynamically from state: deadlines, class schedule, syllabus context, student feedback.

### 8. Preserve Uncertainty (Zero Data Fabrication)
* Separate Extractability (raw note content) from Plannability (enough context to schedule).
* Missing deadline or duration must stay `null`.
* Route low-context tasks to Needs Context or Later. Never invent dates or durations.

### 9. Student Feedback Loop Without Record Mutation
* Student feedback (example: "no time tonight"):
  1. Feed text to AI planner as runtime context.
  2. Recompute dynamic `StudyPlanDto`.
  3. Never mutate underlying `Task` database rows.

---

## Architectural Decision Checklist

Verify every design:

| Check | Requirement | Pass Condition |
| :---: | :--- | :--- |
| **1** | Design add `StudyPlan` table? | **FAIL if yes.** Virtual DTO only. |
| **2** | Note processing edit or merge existing tasks? | **FAIL if yes.** Append-only extraction. |
| **3** | Task dates treated as rigid deadlines? | **FAIL if yes.** Flexible suggestions only; `AcademicEvent.deadline` is rigid. |
| **4** | AI processing read past today notes? | **FAIL if yes.** Scope to `createdAt == today()` only. |
| **5** | Missing deadline or duration invented? | **FAIL if yes.** Must stay null. |
| **6** | Student feedback edit database tasks? | **FAIL if yes.** Modifies transient plan DTO only. |
| **7** | Follow man-spring layering? | Controller/service/repo layers, properties over YAML, RFC 7807 problem details. |

---

## Example Architecture: Planning Endpoint Contract

```java
// Controller Layer (Unversioned /api/ path, ProblemDetails for errors)
@RestController
@RequestMapping("/api/study-plan")
public class StudyPlanController {

    private final StudyPlanOrchestrator planOrchestrator;

    public StudyPlanController(StudyPlanOrchestrator planOrchestrator) {
        this.planOrchestrator = planOrchestrator;
    }

    @PostMapping("/generate")
    public ResponseEntity<StudyPlanDto> generatePlan(@Valid @RequestBody PlanRequestDto request) {
        // Orchestrates multi-input synthesis: today's notes, existing tasks,
        // upcoming events/deadlines, class schedules, academic context, and feedback.
        StudyPlanDto plan = planOrchestrator.synthesizePlan(request);
        return ResponseEntity.ok(plan);
    }
}
```
