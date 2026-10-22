# Data Model: AI Extraction Deduplication Guard

**Feature**: `012-ai-extraction-dedup`  
**Date**: 2026-10-22  

## 1. Entity Overview & Impact

No new database tables or columns are introduced. This feature operates purely within the domain boundaries of existing entities:
- `Task` (`group.four.nyare.nyare.model.Task`)
- `AcademicEvent` (`group.four.nyare.nyare.model.AcademicEvent`)
- `AcademicContext` (`group.four.nyare.nyare.model.AcademicContext`)
- `Note` (`group.four.nyare.nyare.model.Note`)

## 2. In-Memory DTOs & LLM Records

### LLM Raw Records (`PlannerAuditRecords.java`)
- `RawTask`: contains optional `taskId` (UUID) and `noteRef` (String).
- `RawEvent`: contains `noteRef` (String), `title` (String), `description` (String), `deadline` (LocalDateTime), `rationale` (String).
  - Can optionally accept `eventId` (UUID) if existing events are matched directly by ID, or match deterministically by course + normalized title.
- `RawIgnoredNote`: contains `noteRef`, `part`, `reason`.
- `ExtractedContext`: contains `noteRef`, `noteId`, `value`.

### Deduplication Matching Structures
During processing in `StudyPlannerServiceImpl`:
1. **Course Scope**:
   - Every candidate is associated with a specific `Course` through its source `Note`.
   - All comparisons are bounded strictly by `course.getId()`.
2. **Matching Criteria**:
   - **Task**: Matched if candidate `taskId` matches existing open task, OR if normalized title (`title.trim().toLowerCase()`) matches existing open task.
     - State mutation: If matched, never modify title or description. If candidate `scheduledDate != null`, set `scheduledDate`. If candidate `duration != null`, set `duration`. If candidate fields are null, retain existing values.
   - **AcademicEvent**: Matched if existing event in same course has matching normalized title (`title.trim().toLowerCase()`).
     - State mutation: If matched, do not create duplicate. If candidate `deadline` is different, update existing event `deadline`.
   - **AcademicContext**: Matched if existing context in same course has identical or normalized value.
     - State mutation: If matched, drop candidate (no-op).

## 3. State Transitions & Invariants

```
Candidate Task Extracted
   │
   ├─► Matches open task in same course?
   │     ├─► Yes: Promote/Update existing task (Keep title, update date/duration if new, never clear)
   │     └─► No: Create new task (Persist with note link)
   │
Candidate Event Extracted
   │
   ├─► Matches existing event in same course?
   │     ├─► Yes: If new deadline stated, update existing event deadline; else drop.
   │     └─► No: Create new event.
   │
Candidate Context Extracted
   │
   ├─► Matches existing context in same course?
   │     ├─► Yes: Drop (no-op).
   │     └─► No: Create new context.
```
