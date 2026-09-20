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
