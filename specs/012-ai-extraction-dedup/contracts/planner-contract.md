# Interface Contract: AI Extraction Deduplication Guard

**Feature**: `012-ai-extraction-dedup`  
**Date**: 2026-10-22  

## 1. External REST API

The public REST API contracts for note processing (`POST /api/study-planner/process` and `GET /api/study-planner/status`) remain unchanged.

### Request
```http
POST /api/study-planner/process HTTP/1.1
Content-Type: application/json
Accept: text/event-stream
X-User-Id: <user-id> (or session context)
```

### Response Events (SSE)
- `init`: Total notes and pending dates.
- `progress`: Per-batch status (date, processed counts).
- `done`: `ProcessSummaryResponse` with:
  - `tasksCreated`: Number of brand new tasks created (deduplicated).
  - `eventsCreated`: Number of brand new events created (deduplicated).
  - `contextsCreated`: Number of brand new context facts created (deduplicated).
  - `notesProcessed`: Total notes marked processed.
- `error`: Error payload if aborted.

## 2. LLM Prompt & Schema Contract

### Prompt Template (`app/src/main/resources/planner_sys-prompt.st`)
- **Matching Rules**:
  - The model must check `{tasks}`, `{events}`, and `{contexts}` before generating new items.
  - If a task exists in `{tasks}` for the same course:
    - If the note provides a new date anchor or measurable duration, emit a task with `taskId = <existing_task_id>`, `noteRef = null`, and preserve the existing title.
    - If the note repeats the task without new date/duration info, emit nothing or emit the matched task without clearing dates.
  - If an event exists in `{events}` for the same course:
    - If the note repeats the same event and deadline, emit nothing.
    - If the note updates the deadline, emit the event with updated deadline or match.
  - If a context exists in `{contexts}` for the same course stating the same fact, emit nothing.
- **Output Schema**:
  - `tasks`: Array of `RawTask` (optional `taskId`, optional `noteRef`, `title`, `description`, optional `scheduledDate`, optional `estimatedMinutes`, `rationale`).
  - `events`: Array of `RawEvent` (`noteRef`, `title`, `description`, `deadline`, `rationale`).
  - `contexts`: Array of `ExtractedContext` (`noteRef`, `value`).
  - `ignoredNotes`: Array of `RawIgnoredNote`.
  - `noteTitles`: Array of `RawNoteTitle`.
