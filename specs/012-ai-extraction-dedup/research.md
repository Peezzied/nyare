# Phase 0 Research: AI Extraction Deduplication Guard

**Feature**: `012-ai-extraction-dedup`  
**Date**: 2026-10-22  

## 1. Deduplication Responsibilities: Prompt vs Application Logic

### Problem
FR-001 through FR-012 require that extraction refrains from creating duplicate tasks, events, or contexts when existing items already cover note content. FR-012 specifically mandates: *"The deduplication behavior MUST be deterministic and enforced in application logic, not left solely to AI model discretion."* Additionally, the user prompt states: *"use prompt-engineering skill to edit the system prompt. always be grounded by spring rules and YAGNI principle"*.

### Decision
Implement a **defense-in-depth, dual-layer deduplication architecture**:

1. **System Prompt Layer (`planner_sys-prompt.st`)**:
   - Refine extraction, synthesis, and matching rules using prompt engineering principles and STE-100 plain language.
   - Clarify matching criteria across all three entity types (Tasks, Academic Events, Contexts):
     - Tasks: match by course and semantic similarity; promote existing task using `taskId` (preserve title/description, update `scheduledDate`/`estimatedMinutes` only if new info present, never clear dates/durations).
     - Events: match by course and event title semantics; if duplicate/restated with same deadline, omit; if deadline updated in note, output with event identification/update pattern or omit duplicates.
     - Contexts: if existing context in `{contexts}` for that course already captures the fact (semantic equivalence), do not extract.
   - Ground the model to omit candidate items when the note simply restates what is already captured.

2. **Deterministic Java Application Logic Layer (`StudyPlannerEngine.java` / `StudyPlannerServiceImpl.java`)**:
   - Implement deterministic post-extraction dedup checks in `StudyPlannerServiceImpl.java` (and helper mapping in `StudyPlannerEngine.java`):
     - **Tasks**: Check newly extracted tasks against existing open tasks in the same course. If an extracted task matches an existing task by normalized title (case-insensitive, whitespace-trimmed, or exact containment) and the model didn't set `taskId`, treat it as promotion/match or drop duplicate. If date/duration are null or identical, do not mutate. If new date/duration provided, update only `scheduledDate` and `duration`, keeping title/description. Also deduplicate tasks extracted within the same multi-note batch.
     - **Events**: Check newly extracted events against existing events in the same course. If an existing event has matching normalized title, do not create duplicate event. If note provides a new deadline for the matched event, update the existing event's deadline (FR-010). Deduplicate within the same batch.
     - **Contexts**: Check newly extracted context facts against existing contexts in the same course. If normalized value matches existing context (or existing fact already contains the same statement), drop duplicate. Deduplicate within the same batch.
   - This satisfies FR-012 (deterministic guarantee in code) while empowering the LLM via prompt engineering to avoid extracting redundant items in the first place.

### Alternatives Considered
- *Prompt-only deduplication*: Fragile; LLMs occasionally slip up or format variations differently, failing deterministic acceptance criteria (SC-001, SC-003, FR-012).
- *Code-only deduplication without prompt updates*: LLM would burn output tokens generating duplicate JSON that gets thrown away, and prompt instructions would contradict system behavior. Dual layer is token-efficient and safe.

---

## 2. Event and Task Matching Semantics & Invariants

### Problem
Constitution Principle IV states: *"The AI planner extracts new entities without mutating existing student text. The planner must never rewrite, merge, or divide student task titles or descriptions. The planner modifies only `scheduledDate` and `duration` fields on open tasks."*
Requirement FR-007, FR-008, and FR-010 define update behaviors for tasks and events.

### Decision
1. **Tasks**:
   - Matches are scoped strictly per course (`course.id` or course name in prompt).
   - If an open task matches:
     - Never alter `title` or `description`.
     - Never clear existing `scheduledDate` or `duration` when candidate values are null.
     - If candidate has new non-null `scheduledDate` or `duration`, apply them.
     - Deduplicate within the same batch: if two notes extract the same task, keep only one.
2. **Academic Events**:
   - Matches scoped per course.
   - If an event with the same normalized title exists:
     - Do not create a new event.
     - If the candidate event specifies a different explicit deadline, update the existing event's `deadline` (FR-010).
     - Deduplicate within the same batch.
3. **Academic Contexts**:
   - Matches scoped per course.
   - If an existing context fact matches normalized value, drop candidate.
   - Deduplicate within the same batch.

---

## 3. Spring Boot & YAGNI Compliance

### Patterns & Rules
- **Layer Isolation**: Controllers remain untouched. Only `StudyPlannerServiceImpl.java`, `StudyPlannerEngine.java`, and `planner_sys-prompt.st` are refined.
- **YAGNI (Ponytail Minimalism)**:
  - Do not introduce complex vector databases, embeddings, or external NLP libraries.
  - Rely on Java standard library string normalization, case-insensitive comparison, and simple token/phrase overlap where needed, combined with Gemini's semantic extraction prompt.
  - Use existing repositories (`taskRepository`, `academicEventRepository`, `academicContextRepository`).
- **No Custom Exceptions**: All exceptions stay RFC 7807 via `BadRequestException` or `ResourceNotFoundException`.
