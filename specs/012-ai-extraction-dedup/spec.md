# Feature Specification: AI Extraction Deduplication Guard

**Feature Branch**: `012-ai-extraction-dedup`

**Created**: 2026-10-22

**Status**: Draft

**Input**: User description: "the ai engine must check whether existing task, context, or event already meets what the notes says before modifying or creating them. for instance but not limited to when i a dirty notes have something in it that is already in task, context, or event, the engine must refrain from modfying or creating new academic items unless the notes contains new information"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restated Notes Produce No Changes (Priority: P1)

A student processes journal notes that describe academic items the planner already recorded. The planner recognizes the overlap and creates nothing new. It also leaves every existing item unchanged because the notes contain no new information.

**Why this priority**: Duplicate tasks, events, and context rows pollute the student's plan and destroy trust in the planner. Preventing duplicates is the core value of this feature.

**Independent Test**: Process a dirty note that restates an item the planner already extracted from an earlier note. Verify the academic item counts stay identical before and after the run.

**Acceptance Scenarios**:

1. **Given** an open task "Read chapter 4" exists for a course, **When** a dirty note for that course says "still need to read chapter 4", **Then** processing creates no new task and leaves the existing task unchanged.
2. **Given** an academic event "Calculus Midterm Exam" with a deadline exists, **When** a dirty note restates the same exam and date, **Then** processing creates no new event.
3. **Given** a context fact "Student finds recursion difficult" exists, **When** a dirty note restates the same difficulty, **Then** processing creates no new context record.
4. **Given** a dirty note that only repeats already-recorded information, **When** processing completes, **Then** the run reports zero created items.

---

### User Story 2 - Existing Tasks Update Only With New Information (Priority: P2)

A student writes a note that mentions an existing task and adds information the task does not yet hold, such as a deadline or a duration. The planner applies only the new information to the matching task. A note that repeats the task without new information changes nothing.

**Why this priority**: Restating a task is the most common journal pattern. The planner must enrich existing tasks without erasing values the student or an earlier note already set.

**Independent Test**: Process a note that matches an existing backlog task and adds a deadline. Verify the task gains a scheduled date while its title and description stay identical. Then process a second note that merely repeats the task name and verify nothing changes.

**Acceptance Scenarios**:

1. **Given** a backlog task "Work on term paper" with no date and no duration, **When** a dirty note says "term paper due next Tuesday", **Then** the existing task gains a scheduled date and keeps its title unchanged.
2. **Given** a scheduled task with a set date, **When** a dirty note restates the task without any new date or duration, **Then** the existing date survives unchanged.
3. **Given** a scheduled task with a set date, **When** a dirty note restates the task with no date anchor, **Then** processing does not clear the existing date.
4. **Given** an existing task, **When** a dirty note states a different explicit deadline for that task, **Then** the task updates to the new stated date.

---

### User Story 3 - Manually Created Items Are Also Protected (Priority: P3)

A student creates a task or event by hand before the planner runs. A dirty note then describes the same item. The planner treats manual items the same as planner-created items and does not create a duplicate.

**Why this priority**: Students mix manual entry with journal extraction. Dedup that ignores manual items still produces visible duplicates.

**Independent Test**: Create a task manually, then process a dirty note describing the same work. Verify no second task appears.

**Acceptance Scenarios**:

1. **Given** a manually created open task "Review linked lists", **When** a dirty note says "need to review linked lists", **Then** processing creates no duplicate task.
2. **Given** a manually created event "Lab Report deadline", **When** a dirty note restates the same deadline, **Then** processing creates no duplicate event.

---

### Edge Cases

- A note mentions the same item in different words than the stored title. The planner still recognizes the match by meaning within the same course, not only by exact text.
- Two dirty notes in one processing run describe the same new item. The planner creates the item once, not twice.
- A note restates an item that belongs to a different course. The planner treats it as new because matching requires the same course.
- A note restates an existing event but states a different deadline. The planner records the new stated deadline instead of ignoring the note or creating a second event.
- A note restates work already marked completed. The planner treats completed items as done and does not resurrect or duplicate them for mere restatements.
- A note repeats a known fact but adds a correction. The planner updates or supersedes the old fact rather than storing both versions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST compare every candidate task, event, and context extracted from dirty notes against all existing open items for the same course before creating or modifying anything.
- **FR-002**: The system MUST match candidates to existing items by course identity and semantic similarity of content, not only by exact text equality.
- **FR-003**: The system MUST NOT create a new task when an existing open task in the same course already covers the note statement.
- **FR-004**: The system MUST NOT create a new academic event when an existing event in the same course already represents the same event.
- **FR-005**: The system MUST NOT create a new context record when an existing context in the same course already states the same fact.
- **FR-006**: The system MUST apply deduplication to manually created items and planner-created items alike.
- **FR-007**: When a note restates a matched task with no new date or duration information, the system MUST leave the task's scheduled date and duration unchanged, including never clearing an existing date.
- **FR-008**: When a note provides new date or duration information for a matched open task, the system MAY update only the scheduled date and duration fields and MUST NOT rewrite the task title or description.
- **FR-009**: The system MUST deduplicate within a single processing run so two dirty notes describing the same new item produce one item.
- **FR-010**: When a note states a different explicit deadline for a matched event, the system MUST apply the newly stated deadline to the existing event rather than create a second event.
- **FR-011**: The system MUST NOT treat completed tasks as blocking matches; restating completed work follows normal extraction rules.
- **FR-012**: The deduplication behavior MUST be deterministic and enforced in application logic, not left solely to AI model discretion.

### Key Entities *(include if feature involves data)*

- **Candidate Item**: A task, event, or context the extraction produces from dirty notes, before the system decides to create, update, or discard it.
- **Existing Item**: A persisted open task, upcoming event, or context fact for the same course and owner.
- **Match**: A pairing between a candidate and an existing item that describes the same academic item. Matching requires the same course and semantically equivalent content.
- **Dirty Note**: A journal note pending processing. It supplies the statements that generate candidate items.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reprocessing a note whose content produced no new information creates zero new tasks, events, or contexts in 100% of cases.
- **SC-002**: A restated open task loses its existing scheduled date or duration in zero runs.
- **SC-003**: Restating an item created manually produces a duplicate in zero runs.
- **SC-004**: Notes that do contain new date or duration information still update the matched task in 100% of cases.
- **SC-005**: Students never see two academic items in the same course that describe the same work after a processing run.

## Assumptions

- Matching evaluates items within the same course only. Identical wording across different courses counts as distinct items.
- "New information" means a stated date, duration, deadline, or factual correction the existing item does not already hold.
- Semantic matching relies on the extraction engine's judgment for reworded statements. Exact-value checks in application logic provide the deterministic floor.
- Completed tasks do not block creation of genuinely new work, consistent with current processing behavior.
- Past events outside the upcoming window are not dedup targets. Matching considers upcoming events only.
