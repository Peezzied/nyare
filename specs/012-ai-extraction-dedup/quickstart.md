# Quickstart Validation Guide: AI Extraction Deduplication Guard

**Feature**: `012-ai-extraction-dedup`  
**Date**: 2026-10-22  

## 1. Prerequisites

- Java 25
- Gradle wrapper in `app/`
- Valid test profile with mocked LLM or recorded Spring AI prompt fixture

## 2. Test Execution Scenarios

### Scenario 1: Reprocessing Restated Notes Produces Zero Duplicates (SC-001)
- **Setup**: Create Note 1 with content "Read chapter 4". Run planner. A task "Read chapter 4" is created.
- **Action**: Add dirty Note 2 with content "still need to read chapter 4". Run planner again.
- **Expected Outcome**:
  - Task count remains 1.
  - No new tasks, events, or contexts created.
  - Process summary shows 0 new tasks.

### Scenario 2: Existing Task Updates Only With New Information (SC-002, SC-004)
- **Setup**: Existing backlog task "Work on term paper" with null `scheduledDate` and null `duration`.
- **Action**: Process a note saying "term paper due next Tuesday".
- **Expected Outcome**:
  - Existing task receives `scheduledDate` anchored to next Tuesday.
  - Existing task title and description remain unchanged.
  - Task count remains 1.

### Scenario 3: Restatement Without Date Does Not Clear Existing Date (SC-002)
- **Setup**: Existing task "Review notes" with `scheduledDate = 2026-10-25`.
- **Action**: Process a note saying "need to review notes".
- **Expected Outcome**:
  - `scheduledDate` remains `2026-10-25` (not overwritten with null).
  - No duplicate task created.

### Scenario 4: Manually Created Items Are Protected (SC-003)
- **Setup**: Manually insert an open task "Review linked lists" and event "Lab Report".
- **Action**: Process dirty note describing the same items.
- **Expected Outcome**:
  - No new task or event created.

### Scenario 5: Event Deadline Update (FR-010)
- **Setup**: Existing event "Midterm Exam" with deadline `2026-10-30T10:00:00`.
- **Action**: Process dirty note saying "midterm exam moved to Nov 5 at 10am".
- **Expected Outcome**:
  - Existing event deadline updated to `2026-11-05T10:00:00`.
  - No duplicate event created.

## 3. Targeted Unit & Integration Test Commands

```bash
# In app/ directory:
./gradlew test --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest"
./gradlew test --tests "group.four.nyare.nyare.ai.StudyPlannerEngineTest"
```
