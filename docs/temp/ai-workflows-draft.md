# AI Processing & Planning API Workflows Draft

> **Status:** Temporary / Exploratory Draft  
> **Location:** `docs/temp/ai-workflows-draft.md`  
> **Scope:** Nyare Backend AI Integration (`nyare/backend/`)

This document details the proposed REST API contracts and orchestration workflows for AI Extraction, AI Planning, and Student Feedback loops.

---

## 1. AI Processing Workflow (`POST /api/ai/process-today`)

### Overview
Extracts structured entities (`Task`, `AcademicEvent`, `AcademicContext`) from student notes.
* **Trigger**: Explicitly initiated by the student clicking "Process".
* **Scope**: Bounded strictly to notes created on the current date (`createdAt == today()`).
* **Materialization**: Append-only; persists newly identified entities without mutating or reconciling past records.

### Proposed Request / Response Contract

```http
POST /api/ai/process-today
Content-Type: application/json

{
  "courseId": " optional-filter-uuid "
}
```

```json
{
  "notesProcessed": 2,
  "extractedTasks": [
    {
      "id": "c1f76d91-...",
      "courseId": "a9b2...",
      "title": "Complete literature review draft",
      "durationMinutes": 120,
      "status": "TODO"
    }
  ],
  "extractedEvents": [
    {
      "id": "e8d2...",
      "courseId": "a9b2...",
      "title": "Research Proposal Deadline",
      "deadline": "2026-09-18T23:59:00",
      "eventType": "DEADLINE"
    }
  ],
  "extractedContexts": [
    {
      "id": "7fa1...",
      "courseId": "a9b2...",
      "value": "Proposal must follow IEEE citation guidelines"
    }
  ]
}
```

---

## 2. AI Planning Workflow (`POST /api/ai/plan`)

### Overview
Synthesizes the student's holistic academic state into a tri-state Study Plan recommendation set.
* **Persistence Boundary**: Does **not** persist a `StudyPlan` record. Computes and returns the recommendation DTO.
* **Inputs Considered**:
  1. Today's newly processed academic items.
  2. Unfinished tasks across courses (`status != COMPLETED`).
  3. Upcoming rigid academic events & deadlines.
  4. Weekly class schedules (meeting days/times).
  5. Recent academic context items.
  6. Optional student feedback (e.g., *"I have an appointment tonight and no study time"*).

### Proposed Request / Response Contract

```http
POST /api/ai/plan
Content-Type: application/json

{
  "targetDate": "2026-09-14",
  "studentFeedback": "I don't have time to study on Monday night."
}
```

```json
{
  "generatedForDate": "2026-09-14",
  "scheduledTasks": [
    {
      "taskId": "c1f76d91-...",
      "courseName": "Research Methods",
      "title": "Complete literature review draft",
      "recommendedDate": "2026-09-15",
      "durationMinutes": 120,
      "rationale": "Shifted to Tuesday due to lack of study time on Monday."
    }
  ],
  "flexibleTasks": [
    {
      "taskId": "f4a0...",
      "courseName": "Computer Networks",
      "title": "Read Chapter 4 slides",
      "recommendedDate": null,
      "rationale": "Actionable without a hard deadline this week."
    }
  ],
  "needsContextTasks": [
    {
      "taskId": "881b...",
      "courseName": "Data Structures",
      "title": "Prepare project component",
      "recommendedDate": null,
      "missingInformation": "Scope and deadline unspecified in notes."
    }
  ],
  "plannerSummary": "Study load for Monday has been shifted to Tuesday and Wednesday per your feedback."
}
```

---

## 3. The Student Feedback & Reconsideration Loop

When a student provides feedback on the generated plan:
1. The student submits their feedback string via `POST /api/ai/plan`.
2. The AI Planner treats the feedback as temporal constraints for the current planning session.
3. The planner returns an updated `StudyPlanDto`.
4. **Underlying task records are NOT mutated**. Their titles, descriptions, and statuses remain untouched; only the virtual plan recommendation adjusts.
