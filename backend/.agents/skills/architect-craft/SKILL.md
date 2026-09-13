---
name: architect-craft
description: Use when designing, architecting, or reviewing features, APIs, services, data models, or system boundaries in Nyare, integrating core domain invariants with Dr. JSkill Spring Boot practices.
---

# Architect Craft

## Overview

**Architect Craft** is the authoritative system architecture skill for Nyare. It unifies Nyare's **Core Domain Invariants** (calendar-first planning, virtual study plan, append-only AI extraction, tri-state recommendations, rigid events vs. flexible tasks, and uncertainty preservation) with **Dr. JSkill's Spring Boot engineering standards** (Spring Boot 4.x, Java 25, clean layering, RESTful contracts, and robust verification).

Whenever you design, structure, or review any backend or full-stack capability in Nyare, this skill enforces the boundaries, ubiquitous language, and patterns that keep the architecture clean, predictable, and resilient against over-engineering.

---

## When to Use

- Designing new REST endpoints or API contracts (`/api/...`).
- Introducing or modifying domain services, repositories, or DTOs.
- Designing AI processing pipelines (journal note entity extraction) or AI planning workflows (study plan generation).
- Implementing student feedback loops and plan reconsideration.
- Reviewing PRs, design plans, or code changes for architectural violations.

### When NOT to Use
- Routine property or annotation additions to an existing entity (use `model-craft`).
- Pure frontend styling or CSS tweaks with no domain logic.
- Fixing localized bugs that do not affect architectural boundaries (use `surgical-patch`).

---

## Foundation 1: Dependency on Dr. JSkill Best Practices

Architect Craft strictly incorporates and depends on [Dr. JSkill (`dr-jskill`)](../../../.agents/skills/dr-jskill/SKILL.md):

1. **Modern Runtime & Framework**:
   - Java 25 + Spring Boot 4.x (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`).
2. **Layered Architecture & YAGNI Service Layer**:
   - Packages follow lowercase convention: `model`, `dto`, `repository`, `service`, `controller`, `exception`.
   - **Service Layer Value Rule**: The service layer (`XxxService` + `XxxServiceImpl`) is included **only when it adds real business or orchestration value** (e.g., AI integration, multi-repository coordination). For simple CRUD, controllers may directly invoke repositories.
3. **Configuration over Complexity**:
   - Use `application.properties` (not YAML).
   - Externalize secrets and environments cleanly.
4. **RESTful API Contracts**:
   - RFC 7807 Problem Details for errors (`ProblemDetail`).
   - Clean, unversioned resource-oriented endpoints (e.g., `/api/courses`, `/api/tasks`).
5. **Startup Banner & Developer Ergonomics**:
   - Always provide a startup banner printing local endpoints and database status upon boot.
   - Use `spring-boot-docker-compose` / Testcontainers for dev and integration testing.
6. **Tiered Verification**:
   - **Tier 1**: Static analysis and in-memory compilation (IntelliJ MCP).
   - **Tier 2**: Targeted unit/integration test runs (`./gradlew test --tests <ClassName>`).
   - **Tier 3**: Monolithic build as a final validation gate.

---

## Foundation 2: Core Domain Invariants

Every architectural design must strictly respect the provisions established in the global architecture documentation:
- [Conceptual Model & Domain Dictionary](../../docs/conceptual-model.md)
- [System Workflows & Diagrams](../../docs/system-workflows.md)
- [MVP Boundaries & Non-Goals](../../docs/mvp-boundaries.md)

### 1. `Course` is the Root Organizational Anchor
* All student entities (`Schedule`, `Note`, `Task`, `AcademicEvent`, `AcademicContext`) belong to exactly one `Course`.
* Multi-course aggregation is only performed at the planning or calendar display layer.

### 2. Rigid Constraints vs. Flexible Recommendations
* **`AcademicEvent.deadline`** (Timestamp): A rigid, non-negotiable external constraint (Exams, Quizzes, Presentations, Class Activities, Deadlines). AI and users cannot silently shift deadlines.
* **`Task.scheduledDate`** (Date only): A flexible planning recommendation. Missing a scheduled date breaks no academic constraints.
* **Architecture Rule**: Never use the same field or table to represent both rigid event deadlines and flexible task recommendations.

### 3. Virtual Study Plan (Zero Persistence Entity)
* **Architecture Rule**: **The Study Plan is NOT a database entity.**
* Never create `@Entity public class StudyPlan` or a `study_plans` table.
* The Study Plan is purely a presentation-layer DTO dynamically synthesized on request:
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
Recommendations must always map cleanly into the UI's tri-area layout:
1. **Scheduled**: Actionable items with sufficient context and a recommended target date $\rightarrow$ Rendered on the **Calendar Grid**.
2. **Flexible / Later**: Actionable items with no urgent target date $\rightarrow$ Rendered in the **Later Area**.
3. **Needs Context**: Actionable items lacking essential information for confident scheduling $\rightarrow$ Rendered in the **Needs Context Area**.

### 5. Append-Only Materialization (No Auto-Reconciliation)
* When processing journal notes, AI materializes extracted items into new database records (`Task`, `AcademicEvent`, `AcademicContext`).
* **Architecture Rule**: **Do NOT build automatic task merging, splitting, deduplication, or updating engines.**
* Prior academic entities serve as context for planning; they are never autonomously overwritten by new journal processing.

### 6. Strict Scoping of AI Extraction
* AI extraction (`POST /api/ai/process-today`) is:
  1. **Explicit**: Only runs when the student triggers it.
  2. **Daily-scoped**: Queries only notes where `date(createdAt) == today()`.
* Never execute unprompted background note-scraping or unbounded historical note re-processing.

### 7. Dynamic Holistic Reasoning (No Deterministic Scoring)
* Nyare does not calculate priority via mathematical scoring formulas (e.g. `weight * factor - days`).
* Do not store static numerical priority columns in `tasks`.
* The AI planner reasons dynamically from holistic state (imminent deadlines, class schedules, prerequisite topics, academic context, and student feedback).

### 8. Preserve Uncertainty (Zero Data Fabrication)
* Distinguish between **Extractability** (understanding what was written) and **Plannability** (having enough context to recommend a schedule).
* If a deadline or duration is missing, store it as `null`.
* Low-context tasks are routed to **Needs Context** or **Flexible / Later**—never assigned a hallucinated date or duration.

### 9. Student Feedback Loop Without Record Mutation
* When a student submits feedback (e.g., *"I have no time to study tonight"*):
  1. The feedback is provided as runtime context to the planner.
  2. The planner reconsiders task selection and ordering, producing an updated `StudyPlanDto`.
  3. **Underlying task entity records are NOT mutated.**

---

## Architectural Decision Checklist

When proposing or reviewing a design, evaluate these checks:

| Check | Requirement | Pass Condition |
| :---: | :--- | :--- |
| **1** | Does the design introduce a `StudyPlan` table? | **FAIL if yes.** Must remain a virtual DTO. |
| **2** | Does note processing attempt to update/merge existing tasks? | **FAIL if yes.** Extraction must be append-only. |
| **3** | Are task dates treated as rigid deadlines? | **FAIL if yes.** Task dates are flexible suggestions; `AcademicEvent.deadline` is rigid. |
| **4** | Does AI processing scope beyond today's notes? | **FAIL if yes.** Processing is strictly scoped to `createdAt == today()`. |
| **5** | Are unstated deadlines/durations fabricated or defaulted? | **FAIL if yes.** Missing data must remain null/uncertain. |
| **6** | Does student feedback mutate database tasks? | **FAIL if yes.** Feedback only influences the ephemeral plan DTO. |
| **7** | Does it follow Dr. JSkill layering and conventions? | Controller/service/repo separation, properties over YAML, Problem Details for errors. |

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
