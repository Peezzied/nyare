# AI Outlier Note Auditing & Spring Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the AI engine to ignore course-irrelevant or outlier journal notes while capturing an audit trail via model output and a Spring AI CallAroundAdvisor.

**Architecture:** 
1. Amend `system_prompt.st` to allow ignoring notes that do not pertain to course academic scope, requiring the model to emit an `ignoredNotes` list with justification.
2. Extend `ExtractedData` in `StudyPlannerEngine.java` with an `IgnoredNote` record and UUID reference decoding.
3. Implement a Spring AI `CallAroundAdvisor` (`NoteAuditAdvisor`) that logs and tracks AI execution and notes flagged as outliers.
4. Verify behavior in `StudyPlannerEngineIntegrationTest` with a realistic irrelevant note.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring AI 2.0.0 (CallAroundAdvisor), SLF4J, JUnit 5, AssertJ.

**Spec:** AI prompt extension for outlier detection and Spring AI Advisor audit interception.

## Global Constraints

- ASD-STE100 rules: active voice, short sentences, no semicolons, no phrasal verbs, no nominalizations.
- Ponytail rules: minimal code, no unrequested abstractions, reuse existing patterns, zero bloat.
- AI invariant: never invent deadlines, dates, or durations.
- Prompt file invariant: do NOT run IntelliJ MCP file diagnostics (`get_file_problems`) on `system_prompt.st`.
- Test execution invariant: do NOT execute tests without explicit user instruction.

---

## Component Design

### 1. System Prompt (`system_prompt.st`)
Amend the extraction instructions:
- Detect notes that are irrelevant to the course or represent outliers (personal errands, leisure activities, unrelated musings).
- Allow the AI to skip task, event, and context extraction for these notes.
- Require the AI to report skipped notes under `ignoredNotes` with `noteRef` and a normalized English `reason`.

### 2. Domain Record (`StudyPlannerEngine.java`)
```java
public record IgnoredNote(
        @JsonProperty(value = "noteRef", required = true)
        @JsonPropertyDescription("Reference identifier of the ignored note (e.g. n1)")
        String noteRef,

        UUID noteId,

        @JsonProperty(value = "reason", required = true)
        @JsonPropertyDescription("Reason explaining why the note is irrelevant or an outlier, in English")
        String reason
) {}
```
Update `ExtractedData`:
```java
public record ExtractedData(
        @JsonProperty(value = "tasks", required = true)
        @JsonPropertyDescription("Extracted actionable tasks")
        List<ExtractedTask> tasks,

        @JsonProperty(value = "events", required = true)
        @JsonPropertyDescription("Extracted rigid academic events and deadlines")
        List<ExtractedEvent> events,

        @JsonProperty(value = "contexts", required = true)
        @JsonPropertyDescription("Extracted academic context facts")
        List<ExtractedContext> contexts,

        @JsonProperty("ignoredNotes")
        @JsonPropertyDescription("Notes ignored as course-irrelevant or outliers with explanation")
        List<IgnoredNote> ignoredNotes
) {}
```

### 3. Spring AI Advisor (`NoteAuditAdvisor.java`)
Package: `group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor`
Implements `org.springframework.ai.chat.client.advisor.api.CallAroundAdvisor`.
Intercepts `aroundCall(AdvisedRequest advisedRequest, CallAroundAdvisorChain chain)`:
- Captures request start time.
- Delegates to the chain to complete model execution.
- Intercepts response, measures execution duration, and logs an audit record via SLF4J.
- Provides an audit trail for all AI extraction requests and model decisions.

---

## Task Decomposition

### Task 1: Amend System Prompt for Outlier and Irrelevant Note Handling

**Files:**
- Modify: `src/main/resources/system_prompt.st`

**Interfaces:**
- Consumes: Prompt template
- Produces: LLM instructions for ignoring and auditing irrelevant notes

- [ ] **Step 1: Amend extraction responsibilities and invariants in `system_prompt.st`**
Add rule under Extraction Responsibilities:
```st
4. Irrelevant Notes and Outliers:
- Evaluate each note for relevance to the assigned course.
- If a note contains personal errands, leisure activities, or off-topic musings unrelated to the course, mark it as ignored.
- Do not extract tasks, events, or contexts from ignored notes.
- Record each ignored note in `ignoredNotes` with its `noteRef` and a concise English `reason`.
```
Add rule under Domain Invariants:
```st
10. Record every ignored or outlier note in `ignoredNotes` with a clear explanation in English.
```

- [ ] **Step 2: Verify ASD-STE100 compliance manually**
Ensure all added sentences use active voice, short length, and simple present tenses.

---

### Task 2: Update Model Records and Reference Decoding in `StudyPlannerEngine`

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`

**Interfaces:**
- Consumes: `StubReferenceCodec<Note>`
- Produces: `IgnoredNote` record and decoded `ExtractedData.ignoredNotes()`

- [ ] **Step 1: Add `IgnoredNote` record and update `ExtractedData`**
In `StudyPlannerEngine.java`:
- Add `public record IgnoredNote(...)`.
- Add `List<IgnoredNote> ignoredNotes` to `ExtractedData`.
- Update `emptyExtractedData()` to initialize empty `ignoredNotes` list.

- [ ] **Step 2: Update `decodeReferences` in `StudyPlannerEngine.java`**
Decode note references in `raw.ignoredNotes()` to set `noteId`.

- [ ] **Step 3: Run static inspection via IntelliJ MCP**
Call `get_file_problems` on `StudyPlannerEngine.java` to verify 0 errors.

---

### Task 3: Implement `NoteAuditAdvisor` Spring AI Advisor

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`

**Interfaces:**
- Consumes: Spring AI `CallAroundAdvisor`, `AdvisedRequest`, `AdvisedResponse`
- Produces: ChatClient call auditing component

- [ ] **Step 1: Write `NoteAuditAdvisor` class**
Create `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java` implementing `CallAroundAdvisor`:
```java
package group.four.nyare.nyare.ai.advisor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.advisor.api.AdvisedRequest;
import org.springframework.ai.chat.client.advisor.api.AdvisedResponse;
import org.springframework.ai.chat.client.advisor.api.CallAroundAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAroundAdvisorChain;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;

/**
 * Spring AI CallAroundAdvisor that intercepts StudyPlannerEngine requests and responses
 * to produce structured audit logs for AI planning interactions.
 */
@Component
public class NoteAuditAdvisor implements CallAroundAdvisor {

    private static final Logger log = LoggerFactory.getLogger(NoteAuditAdvisor.class);

    @Override
    public String getName() {
        return "NoteAuditAdvisor";
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    @Override
    public AdvisedResponse aroundCall(AdvisedRequest advisedRequest, CallAroundAdvisorChain chain) {
        long startTime = System.currentTimeMillis();
        log.info("[AI AUDIT] Initiating study planner engine AI round-trip");

        AdvisedResponse response = chain.nextAroundCall(advisedRequest);

        long elapsedMs = System.currentTimeMillis() - startTime;
        log.info("[AI AUDIT] Completed study planner engine AI round-trip in {} ms", elapsedMs);

        return response;
    }
}
```

- [ ] **Step 2: Register `NoteAuditAdvisor` in `StudyPlannerEngine`**
Inject `NoteAuditAdvisor` into `StudyPlannerEngine` constructor and attach via `chatClientBuilder.defaultAdvisors(noteAuditAdvisor)` (or accept optional advisor).

- [ ] **Step 3: Run static inspection via IntelliJ MCP**
Call `get_file_problems` on `NoteAuditAdvisor.java` and `StudyPlannerEngine.java`. Verify 0 errors.

---

### Task 4: Update Integration Test and Knowledge Graph

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`
- Execute: `graphify update .`

- [ ] **Step 1: Add outlier note literal to `StudyPlannerEngineIntegrationTest.java`**
Add Note 3 (`oop`):
```markdown
bumili ako ng shampoo, sabon, tsaka kape sa grocery kanina tapos nanood ako ng anime buong gabi
```
Update test assertions:
- Verify `result.ignoredNotes()` contains Note 3.
- Verify `result.ignoredNotes().get(0).noteId().equals(note3Id)`.
- Verify `reason` is present and in English.
- Update report builder to print `--- IGNORED / OUTLIER NOTES ---`.

- [ ] **Step 2: Run static inspection via IntelliJ MCP**
Call `get_file_problems` on `StudyPlannerEngineIntegrationTest.java`. Verify 0 errors.

- [ ] **Step 3: Update knowledge graph**
Execute `graphify update .` outside sandbox (`BypassSandbox: true`).
