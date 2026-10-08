# Virtual Ignored Notes & Spring Advisor Auditing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `ignoredNotes` from the public `ExtractedData` domain model and isolate all outlier auditing inside `NoteAuditAdvisor`.

**Architecture:** The LLM emits `ignoredNotes` in its raw JSON response for system auditing. `NoteAuditAdvisor` intercepts the raw response, parses the virtual `ignoredNotes` payload, and emits structured audit logs. `ExtractedData` ignores unknown fields and exposes only clean domain entities (`tasks`, `events`, `contexts`).

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring AI 2.0.0 (SimpleLoggerAdvisor / CallAroundAdvisor), Jackson, SLF4J.

**Spec:** System prompt update for virtual ignored notes and advisor-level audit extraction.

## Global Constraints

- ASD-STE100 rules: active voice, short sentences, no semicolons, no phrasal verbs, no nominalizations.
- Ponytail rules: minimal code, no unrequested abstractions, reuse existing patterns, zero bloat.
- Domain model invariant: `ExtractedData` must contain only `tasks`, `events`, and `contexts`.
- Prompt file invariant: do NOT run IntelliJ MCP file diagnostics (`get_file_problems`) on `system_prompt.st`.
- Test execution invariant: do NOT execute tests without explicit user approval.

---

## File Structure & Responsibilities

1. `src/main/resources/system_prompt.st`:
   - Instructs the model to ignore course-irrelevant notes.
   - Instructs the model to include virtual `ignoredNotes` (`noteRef`, `reason`) in the JSON output for system auditing.
2. `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`:
   - Reverts `ExtractedData` to only contain `tasks`, `events`, and `contexts`.
   - Adds `@JsonIgnoreProperties(ignoreUnknown = true)` to `ExtractedData` so Jackson ignores `ignoredNotes`.
   - Removes `IgnoredNote` record and reference decoding from the domain engine.
3. `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`:
   - Intercepts `aroundCall`.
   - Parses the virtual `ignoredNotes` node from the raw completion text.
   - Emits structured SLF4J audit logs for each ignored note.
4. `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`:
   - Verifies that `ExtractedData` returns only clean tasks, events, and contexts.
   - Verifies that Note 3 produces no tasks or events.
   - Removes assertions targeting `result.ignoredNotes()`.

---

## Task Decomposition

### Task 1: Revert `ExtractedData` and Remove `IgnoredNote` from `StudyPlannerEngine`

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`

**Interfaces:**
- Consumes: Clean 3-field `ExtractedData`
- Produces: Strict domain model isolation

- [ ] **Step 1: Update `ExtractedData` and remove `IgnoredNote`**
In `StudyPlannerEngine.java`:
- Add `@JsonIgnoreProperties(ignoreUnknown = true)` to `ExtractedData`.
- Revert `ExtractedData` to 3 components: `tasks`, `events`, `contexts`.
- Remove record `IgnoredNote`.
- Revert `emptyExtractedData()` and `decodeReferences(...)` to 3 components.

- [ ] **Step 2: Run static inspection via IntelliJ MCP**
Call `get_file_problems` on `StudyPlannerEngine.java` to verify 0 errors.

---

### Task 2: Implement Outlier Auditing inside `NoteAuditAdvisor`

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`

**Interfaces:**
- Consumes: Spring AI `AdvisedResponse`, raw completion text
- Produces: Audit log entries for ignored notes

- [ ] **Step 1: Implement `aroundCall` in `NoteAuditAdvisor`**
Update `NoteAuditAdvisor.java`:
```java
package group.four.nyare.nyare.ai.advisor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.client.advisor.api.AdvisedRequest;
import org.springframework.ai.chat.client.advisor.api.AdvisedResponse;
import org.springframework.ai.chat.client.advisor.api.CallAroundAdvisorChain;
import org.springframework.stereotype.Component;

/**
 * Spring AI Advisor that intercepts LLM responses, extracts virtual internal
 * ignored/outlier note decisions, and records audit logs.
 */
@Component
public class NoteAuditAdvisor extends SimpleLoggerAdvisor {

    private static final Logger log = LoggerFactory.getLogger(NoteAuditAdvisor.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NoteAuditAdvisor() {
        super();
    }

    @Override
    public String getName() {
        return "NoteAuditAdvisor";
    }

    @Override
    public AdvisedResponse aroundCall(AdvisedRequest advisedRequest, CallAroundAdvisorChain chain) {
        AdvisedResponse advisedResponse = super.aroundCall(advisedRequest, chain);

        try {
            if (advisedResponse != null && advisedResponse.response() != null
                    && advisedResponse.response().getResult() != null
                    && advisedResponse.response().getResult().getOutput() != null) {

                String content = advisedResponse.response().getResult().getOutput().getText();
                if (content != null && content.contains("ignoredNotes")) {
                    JsonNode root = objectMapper.readTree(content);
                    JsonNode ignoredNotes = root.get("ignoredNotes");
                    if (ignoredNotes != null && ignoredNotes.isArray()) {
                        for (JsonNode item : ignoredNotes) {
                            String noteRef = item.has("noteRef") ? item.get("noteRef").asText() : "unknown";
                            String reason = item.has("reason") ? item.get("reason").asText() : "No reason provided";
                            log.warn("[AI AUDIT - IGNORED NOTE] NoteRef: {} | Reason: {}", noteRef, reason);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("NoteAuditAdvisor could not parse ignoredNotes audit payload: {}", e.getMessage());
        }

        return advisedResponse;
    }
}
```

- [ ] **Step 2: Run static inspection via IntelliJ MCP**
Call `get_file_problems` on `NoteAuditAdvisor.java` to verify 0 errors.

---

### Task 3: Align `system_prompt.st` with Virtual Internal Auditing

**Files:**
- Modify: `src/main/resources/system_prompt.st`

**Interfaces:**
- Consumes: Prompt instructions
- Produces: Virtual audit instructions for LLM

- [ ] **Step 1: Update instructions in `system_prompt.st`**
Specify that `ignoredNotes` is an internal audit array in the response JSON:
```st
4. Ignored Notes and Outliers:
- Evaluate each note for relevance to the assigned course.
- If a note contains personal errands, leisure, or off-topic statements, mark it as ignored.
- Do not extract tasks, events, or contexts from ignored notes.
- Record every ignored note internally under `ignoredNotes` with its `noteRef` and an English `reason` for system auditing.
```

- [ ] **Step 2: Verify ASD-STE100 rules manually**
Ensure all sentences follow ASD-STE100 without running IntelliJ MCP on `.st` files.

---

### Task 4: Update Integration Test and Knowledge Graph

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`
- Execute: `graphify update .`

- [ ] **Step 1: Clean integration test assertions**
In `StudyPlannerEngineIntegrationTest.java`:
- Remove `result.ignoredNotes()` assertions.
- Verify `result.tasks()`, `result.events()`, and `result.contexts()` contain no references to Note 3.
- Remove `result.ignoredNotes()` report formatting.

- [ ] **Step 2: Run static inspection via IntelliJ MCP**
Call `get_file_problems` on `StudyPlannerEngineIntegrationTest.java`. Verify 0 errors.

- [ ] **Step 3: Refresh knowledge graph**
Execute `graphify update .` outside sandbox (`BypassSandbox: true`).
