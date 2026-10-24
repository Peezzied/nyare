# Planner (AI Orchestration) — Deferred Design Note

> **Status**: Approved design, deferred implementation — pending AI client strategy decision  
> **Relates to**: `PlannerService`, `PlannerController`, AI client abstraction

---

## Domain Role

The brain of Nyare. Synthesizes holistic academic state into a virtual `StudyPlanDto`. Two explicit operations: **process today** (extraction) and **generate plan** (planning + feedback loop).

---

## No New Persistence Entity

The Planner introduces **zero new database tables**. `StudyPlan` is and remains a virtual DTO.

---

## Contracts (DTOs)

| DTO | Purpose |
|---|---|
| `ProcessTodayResponse` | Result of AI extraction: counts of extracted Tasks / Events / Contexts. Optional summary message. |
| `PlanRequest` | `courseId` (required), optional `feedbackText` (student's natural language feedback) |
| `StudyPlanDto` | Virtual plan: `generatedForDate`, `scheduledTasks`, `flexibleTasks`, `needsContextTasks`, `plannerSummary` |

> `StudyPlanDto` contains lists of `TaskResponse` (existing DTO from Task domain).

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/planner/process-today?courseId=` | Trigger AI extraction on today's notes for a course |
| `POST` | `/api/planner/generate-plan` | Generate a study plan DTO from current academic state |

> Both are `POST` — they trigger active AI computation, not idempotent reads.

---

## Planner Service — Orchestration Responsibilities

**`processTodayNotes(Long courseId)`**:
1. Load today's `Note`s for the course via `NoteRepository` (daily-scoped query).
2. Load existing `Task`s, `AcademicEvent`s, and `AcademicContext`s as **read-only background context** (no mutation, no deduplication).
3. Call AI client (Gemini API) with notes + context.
4. Parse AI response → append-only persist new `Task`, `AcademicEvent`, `AcademicContext` records.
5. Return extraction summary (counts + optional AI commentary).

**`generatePlan(PlanRequest request)`**:
1. Load all active Tasks (not COMPLETED) for the course.
2. Load upcoming AcademicEvents (deadline >= today) for the course.
3. Load AcademicContext records for the course.
4. Load Schedule entries for today's day-of-week (for context).
5. Call AI planner with full academic state + optional `feedbackText`.
6. Classify AI output into tri-state: Scheduled / Later / Backlog.
7. Return ephemeral `StudyPlanDto` — **nothing persisted**.

---

## Repository Dependencies (consumed, not new)

| Repository | Purpose |
|---|---|
| `NoteRepository` | Fetch today's notes (daily-scoped) |
| `TaskRepository` | Fetch active tasks for plan synthesis |
| `AcademicEventRepository` | Fetch upcoming events ordered by deadline |
| `AcademicContextRepository` | Fetch context records |
| `ScheduleRepository` | Fetch today's class slots |
| `CourseRepository` | Validate courseId |

---

## AI Client Layer

A lightweight interface `AiClient` (or `GeminiClient`) wraps the external Gemini API call. The Planner service depends on this abstraction — keeps AI transport details outside the domain service.

---

## Service Boundaries

- **Explicit only**: No background jobs. No scheduled cron tasks. Only reacts to student HTTP trigger.
- **Daily scoping**: `processTodayNotes` is hard-scoped to `DATE(note.createdAt) = TODAY`. No historical re-processing.
- **Append-only**: Never update or delete existing Task/Event/Context in the extraction path.
- **No record mutation on feedback**: `feedbackText` in `generatePlan` is runtime AI context only. It never writes to the DB.
- **No scoring formula**: AI reasons holistically — no `priorityScore` column, no weights.

---

## Open Decision (Blocking Implementation)

> **AI client strategy**: Should we wrap Gemini with Spring AI (`spring-ai-gemini`) or use a raw `RestClient`/`WebClient` call?  
> - Spring AI: structured output parsing (JSON → DTOs) out of the box. Favorable for MVP.  
> - Raw RestClient: lighter dependency, requires manual response parsing.  
> 
> Resolve this before beginning Planner implementation.
