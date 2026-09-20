# Nyare Future Considerations

These items are out of scope for the MVP. Review them in a future iteration.

---

## 1. Fault Tolerance in the Combined Processing and Planning Transaction

**Context**: `processTodayNotes()` runs extraction and AI planning in one combined `@Transactional` boundary. If the AI planning step fails (Gemini API timeout, malformed response, rate limit), the entire transaction rolls back. The successfully extracted tasks, events, and academic context records are lost even though extraction itself succeeded.

**Risk**: The student loses today's extraction results and must trigger the process again.

**Options to Consider**:
- Split into two transactions. Commit extraction first. Run planning in a separate transaction. A planning failure does not lose the extraction data.
- Add a retry template with exponential backoff on the `StudyPlanRecommender` call before rolling back.
- Implement a compensating fallback: if planning fails, commit extraction results and return a partial `ProcessSummaryResponse` with `studyTasksGenerated = 0` and an advisory message.

**Rationale for Deferral**: MVP prioritizes simplicity. Splitting the transaction adds complexity to the service layer. The risk is acceptable in a single-student academic assistant with low concurrent usage.

---

## 2. Duplicate Entities from Same-Day Re-Processing

**Context**: If the student clicks Process more than once on the same day, `processTodayNotes()` runs extraction again on the same today's notes. Since extraction is append-only, it creates duplicate `Task`, `AcademicEvent`, and `AcademicContext` records for the same source content.

**Risk**: The student sees duplicate tasks and events on the calendar. The planner also operates on duplicate data.

**Options to Consider**:
- Track a processed flag per note (for example: `Note.processedAt`). Skip notes already processed today.
- Check for existing records with the same title and course before inserting. Skip if a matching open task or event already exists.
- Allow re-processing but make it idempotent via a content-hash deduplication key on task and event tables.

**Rationale for Deferral**: MVP usage assumes a single deliberate process action per day. The risk of accidental re-processing is low in early usage.
