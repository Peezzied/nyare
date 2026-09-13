# Backend Agent Guide Candidate Updates Draft

> **Status:** Temporary / Exploratory Draft  
> **Location:** `docs/temp/backend-agents-guide-draft.md`  
> **Target:** Potential future updates to `backend/AGENTS.md`

This document captures prospective guidelines and rules for agents working inside `nyare/backend/`, ensuring alignment with the global architectural documentation.

---

## Candidate Additions for `backend/AGENTS.md`

### 1. Domain Modeling Rules
- **No `StudyPlan` Entity**: Never generate a JPA entity or repository for `StudyPlan`. All study plan operations must reside in service orchestration and DTO layers (`StudyPlanDto`).
- **Rigid vs. Flexible Dates**:
  - `AcademicEvent.deadline`: Non-negotiable constraint (timestamp). Never alter or shift automatically.
  - `Task.scheduledDate`: Flexible recommendation (date only). Can be suggested or left null.
- **Academic Event Taxonomy**:
  - Academic events include Deadlines, Exams, Quizzes, Presentations, and Class Activities.
  - Treat all of them as hard constraints on the calendar.
- **Temporal Nature of Academic Context**:
  - `AcademicContext` is additive and time-stamped. Do not delete older contexts on new note ingestion.

### 2. Service Layer & AI Processing Rules
- **Explicit Trigger & Scoping**:
  - The extraction service must only fetch and process notes where `Note.createdAt` belongs to the current calendar date (`today()`).
- **Append-Only Materialization**:
  - When saving extracted entities, instantiate new records (`Task`, `AcademicEvent`, `AcademicContext`).
  - Do NOT implement heuristics that merge, overwrite, or reconcile previously saved entities.
- **Zero Data Invention**:
  - If duration or deadline is not provided or inferrable from the note, save the field as `null`.
  - Do NOT compute or populate artificial priority scores.
- **Student Feedback Handling**:
  - When feedback is received in planning endpoints, use it purely to guide task selection and ordering in the returned DTO.
  - Do NOT mutate task records in response to planning feedback.

### 3. Verification & Conventions
- Adhere strictly to [`backend/docs/conventions.md`](../../backend/docs/conventions.md).
- Follow the 3-tier build hierarchy (IntelliJ MCP $\rightarrow$ Targeted `./gradlew` $\rightarrow$ Full build).
