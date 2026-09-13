# Backend Domain Model & JPA Mapping Draft

> **Status:** Temporary / Exploratory Draft  
> **Location:** `docs/temp/backend-domain-model-draft.md`  
> **Scope:** Nyare Backend (`nyare/backend/`)

This document outlines how the conceptual entities defined in [`docs/conceptual-model.md`](../conceptual-model.md) map to Spring Data JPA entities, database tables, and presentation DTOs in SQLite.

---

## 1. Entity Overview & Persistence Strategy

| Conceptual Entity | JPA Entity Class | DB Table | Notes / MVP Status |
| :--- | :--- | :--- | :--- |
| `Academic Term` | *N/A (Virtual)* | *None* | Future roadmap. `Course` remains the root container in MVP. |
| `Course` | `Course` | `courses` | Organizational anchor for schedules, notes, tasks, events, context. |
| `Schedule` | `Schedule` | `schedules` | Recurring weekly class times (`dayOfWeek`, `startTime`, `endTime`). |
| `Journal Entry` | `Note` | `notes` | Student notes in JSON format. Immutable source of truth. |
| `Task` | `Task` | `tasks` | Actionable work item (`TODO`, `IN_PROGRESS`, `COMPLETED`), flexible `scheduledDate`. |
| `Academic Event` | `AcademicEvent` | `academic_events` | Rigid time constraint (`deadline`). Subtypes: Exam, Quiz, Presentation, Deadline. |
| `Academic Context` | `AcademicContext` | `academic_contexts` | Temporal descriptive facts assisting AI planning. |
| `Study Plan` | *N/A (Virtual DTO)* | *None* | **Never persisted as a table.** Dynamically computed tri-state DTO. |

---

## 2. Detailed Entity Specifications

### A. `Course` (`courses`)
The central tenant and operational anchor.
```java
@Entity
@Table(name = "courses")
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank @Size(max = 128)
    private String name;

    @Size(max = 32)
    private String code; // e.g. "CS101"

    @Size(max = 7)
    private String color; // hex code for UI calendar display
}
```

### B. `AcademicEvent` (`academic_events`)
Represents rigid time constraints.
* **Current implementation:**
  - `deadline: LocalDateTime`
  - `title: String`
  - `description: String`
  - `course: Course`
  - `note: Note` (originating journal note)
* **Design Decision for Taxonomy:**
  In [`docs/conceptual-model.md`](../conceptual-model.md), Academic Events encompass:
  `Exam`, `Quiz`, `Presentation`, `Class Activity`, and `Deadline`.
  
  *Option A (Recommended for MVP)*: Add an enum discriminator:
  ```java
  public enum AcademicEventType {
      EXAM,
      QUIZ,
      PRESENTATION,
      CLASS_ACTIVITY,
      DEADLINE
  }

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  private AcademicEventType eventType = AcademicEventType.DEADLINE;
  ```
  *Option B*: Retain single `deadline` timestamp representing all rigid event constraints, distinguishing subtypes solely in title/description.

### C. `Task` (`tasks`)
Represents actionable items for student completion.
* **Attributes:**
  - `status: TaskStatus` (`TODO`, `IN_PROGRESS`, `COMPLETED`)
  - `scheduledDate: LocalDate` (Nullable flexible planning suggestion)
  - `duration: Duration` (Nullable estimated effort)
  - `title: String`, `description: String`
  - `course: Course`
  - `note: Note` (Nullable originating journal note)
* **Key Constraint:**
  `scheduledDate` is an AI recommendation or student preference, **never** a hard academic deadline.

### D. `AcademicContext` (`academic_contexts`)
Represents temporal academic facts.
* **Attributes:**
  - `value: String` (Text description, e.g., *"Exam covers Chapters 1–4"*)
  - `course: Course`
  - `note: Note`
  - `createdAt: Instant` (Used for temporal decay / recency reasoning)
* **Lifecycle:**
  Context is append-only. Old context is not deleted immediately; instead, the AI Planner naturally treats older context as less authoritative or superseded by recent entries.

---

## 3. The Virtual Study Plan DTO (Non-Persisted)

Per MVP boundaries, `StudyPlan` is **strictly a presentation-layer construct**. It is represented as a composite DTO returned by the planner endpoint:

```java
public record StudyPlanDto(
    LocalDate generatedForDate,
    List<TaskSummaryDto> scheduledTasks,     // Recommended for a specific calendar date
    List<TaskSummaryDto> flexibleTasks,      // Recommended for action without specific date
    List<TaskSummaryDto> needsContextTasks,  // Actionable, but lacking sufficient info
    String plannerRationale                  // Optional explanation of planning reasoning
) {}
```

### UI Area Mapping:
- `scheduledTasks` $\rightarrow$ Rendered on specific days in the **Calendar Grid**.
- `flexibleTasks` $\rightarrow$ Rendered in the **Later / Undated Area**.
- `needsContextTasks` $\rightarrow$ Rendered in the **Needs Context Area**.
