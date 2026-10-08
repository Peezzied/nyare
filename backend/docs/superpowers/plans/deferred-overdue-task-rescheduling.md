# Deferred: AI Rescheduling of Overdue Open Tasks

**Status:** Deferred — out of scope for the current wiring task.

---

## Decision

The AI engine receives all non-COMPLETED tasks, including overdue ones (tasks whose `scheduledDate` is in the past). The engine can see these tasks, but the system prompt does not instruct it to reschedule them.

Implementing this requires:

1. **System prompt update** (`src/main/resources/system_prompt.st`):
   - Add an instruction for the AI to detect open tasks whose `scheduled_date` is before today.
   - Instruct it to propose a new `scheduled_date` (promotion) or leave `scheduled_date` null to move them to Backlog.

2. **Verify `ExtractedTask.isPromotion()` covers this case**:
   - A rescheduled overdue task must return `taskId != null` and `noteRef == null`. The existing promotion path handles this if the prompt outputs the correct `task_id`.

## No Code in This Note

No implementation steps are included. Write the full implementation plan when this is prioritised.
