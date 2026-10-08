# Extract StudyPlannerEngine Auditing Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the auditing subsystem from `StudyPlannerEngine` into a dedicated `NoteAuditor` component.

**Architecture:** `StudyPlannerEngine` delegates ignored note auditing to `NoteAuditor`. `NoteAuditor` decodes stub references into note identifiers and emits structured SLF4J audit warnings. `NoteAuditAdvisor` and manual JSON parsing on raw chat strings are removed.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring AI 2.0.0, Jackson, SLF4J, JUnit 5, AssertJ.

**Spec:** Refactoring of note auditing logic in `StudyPlannerEngine`.

## Global Constraints

- Apply ASD-STE100 rules to all documentation, messages, and comments.
- Use active voice.
- Limit instruction sentences to 20 words or fewer.
- Limit description sentences to 25 words or fewer.
- Do not use semicolons.
- Do not use phrasal verbs.
- Do not use nominalizations.
- Limit noun stacks to three words maximum.
- Apply ponytail rules by writing minimal code and removing unnecessary abstractions.
- Keep `ExtractedData` scoped strictly to domain entities: tasks, events, and contexts.
- Use canonical exceptions only (`ResourceNotFoundException`, `BadRequestException`).
- Run `graphify update .` outside sandbox after editing code.

---

## File Structure & Responsibilities

1. Create: `src/main/java/group/four/nyare/nyare/ai/audit/NoteAuditor.java`
   - Defines records `RawIgnoredNote` and `InternalIgnoredNote`.
   - Decodes `RawIgnoredNote` references to note database UUIDs.
   - Emits structured SLF4J audit logs for ignored note statements and outlier notes.
2. Create: `src/test/java/group/four/nyare/nyare/ai/audit/NoteAuditorTest.java`
   - Tests `NoteAuditor` reference decoding, null handling, and audit log generation.
3. Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
   - Injects `NoteAuditor`.
   - Removes `NoteAuditAdvisor` parameter and builder configuration.
   - Removes `noteIdMap` creation and advisor parameter call.
   - References `NoteAuditor.RawIgnoredNote` in `LlmPayload`.
   - Delegates ignored note decoding and logging to `noteAuditor.audit(...)`.
   - Removes `RawIgnoredNote` and `InternalIgnoredNote` inner records.
4. Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`
   - Updates mock configurations to reflect direct `.call()` without advisor parameters.
   - Verifies that `StudyPlannerEngine` delegates ignored notes to `NoteAuditor`.
5. Delete: `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`
   - Removes obsolete advisor that parsed raw JSON text with Jackson.
6. Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`
   - Updates test configuration import from `NoteAuditAdvisor.class` to `NoteAuditor.class`.

---

## Task Decomposition

### Task 1: Create `NoteAuditor` with Unit Tests

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/ai/audit/NoteAuditor.java`
- Create: `src/test/java/group/four/nyare/nyare/ai/audit/NoteAuditorTest.java`

**Interfaces:**
- Consumes: `List<NoteAuditor.RawIgnoredNote>`, `StubReferenceCodec<Note>`
- Produces: `List<NoteAuditor.InternalIgnoredNote>`

- [ ] **Step 1: Write failing unit test for `NoteAuditor`**

Create `src/test/java/group/four/nyare/nyare/ai/audit/NoteAuditorTest.java`:

```java
package group.four.nyare.nyare.ai.audit;

import group.four.nyare.nyare.ai.parser.StubReferenceCodec;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
class NoteAuditorTest {

    private final NoteAuditor auditor = new NoteAuditor();

    @Test
    @DisplayName("audit decodes raw ignored note and records warning log")
    void audit_withValidIgnoredNote_decodesAndLogsWarning(CapturedOutput output) {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, new NoteContent("Grocery errand", null));
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        StubReferenceCodec<Note> codec = new StubReferenceCodec<>("n");
        String ref = codec.encode(note);

        NoteAuditor.RawIgnoredNote raw = new NoteAuditor.RawIgnoredNote(ref, "Grocery errand", "Unrelated errand");

        List<NoteAuditor.InternalIgnoredNote> result = auditor.audit(List.of(raw), codec);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().noteId()).isEqualTo(noteId);
        assertThat(result.getFirst().part()).isEqualTo("Grocery errand");
        assertThat(result.getFirst().reason()).isEqualTo("Unrelated errand");

        assertThat(output.getAll()).contains("[AI AUDIT - UNRELATED INFO]");
        assertThat(output.getAll()).contains("NoteId: " + noteId);
        assertThat(output.getAll()).contains("Part: \"Grocery errand\"");
        assertThat(output.getAll()).contains("Reason: Unrelated errand");
    }

    @Test
    @DisplayName("audit returns empty list when raw notes list is null or empty")
    void audit_withEmptyList_returnsEmptyList(CapturedOutput output) {
        StubReferenceCodec<Note> codec = new StubReferenceCodec<>("n");

        List<NoteAuditor.InternalIgnoredNote> nullResult = auditor.audit(null, codec);
        List<NoteAuditor.InternalIgnoredNote> emptyResult = auditor.audit(Collections.emptyList(), codec);

        assertThat(nullResult).isEmpty();
        assertThat(emptyResult).isEmpty();
        assertThat(output.getAll()).doesNotContain("[AI AUDIT - UNRELATED INFO]");
    }

    @Test
    @DisplayName("audit logs note reference when codec does not match note")
    void audit_withUnmappedRef_logsRefFallback(CapturedOutput output) {
        StubReferenceCodec<Note> codec = new StubReferenceCodec<>("n");
        NoteAuditor.RawIgnoredNote raw = new NoteAuditor.RawIgnoredNote("n99", "Unknown statement", "No reason");

        List<NoteAuditor.InternalIgnoredNote> result = auditor.audit(List.of(raw), codec);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().noteId()).isNull();
        assertThat(output.getAll()).contains("[AI AUDIT - UNRELATED INFO]");
        assertThat(output.getAll()).contains("NoteId: n99");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./gradlew test --tests group.four.nyare.nyare.ai.audit.NoteAuditorTest`
Expected: Compilation failure because `NoteAuditor` does not exist.

- [ ] **Step 3: Implement `NoteAuditor`**

Create `src/main/java/group/four/nyare/nyare/ai/audit/NoteAuditor.java`:

```java
package group.four.nyare.nyare.ai.audit;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import group.four.nyare.nyare.ai.parser.StubReferenceCodec;
import group.four.nyare.nyare.model.Note;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Manages audit logging for notes and statements omitted during AI planning.
 */
@Component
public class NoteAuditor {

    private static final Logger log = LoggerFactory.getLogger(NoteAuditor.class);

    public record RawIgnoredNote(
            @JsonProperty(value = "noteRef", required = true)
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1)")
            String noteRef,

            @JsonProperty(value = "part", required = true)
            @JsonPropertyDescription("The exact statement, text, or entire note that induced the audit")
            String part,

            @JsonProperty(value = "reason", required = true)
            @JsonPropertyDescription("Explanation of why this part is unrelated or why the entire note was ignored")
            String reason) {
    }

    public record InternalIgnoredNote(
            UUID noteId,
            String part,
            String reason) {
    }

    /**
     * Audits and logs omitted or outlier notes.
     *
     * @param rawIgnoredNotes raw notes from the language model payload
     * @param noteCodec       codec used to decode reference identifiers
     * @return decoded internal ignored note records
     */
    public List<InternalIgnoredNote> audit(List<RawIgnoredNote> rawIgnoredNotes, StubReferenceCodec<Note> noteCodec) {
        if (rawIgnoredNotes == null || rawIgnoredNotes.isEmpty()) {
            return Collections.emptyList();
        }

        List<InternalIgnoredNote> ignoredNotes = rawIgnoredNotes.stream().map(i -> {
            Note note = noteCodec != null ? noteCodec.decode(i.noteRef()) : null;
            UUID noteId = note != null ? note.getId() : null;
            return new InternalIgnoredNote(noteId, i.part(), i.reason());
        }).toList();

        for (int i = 0; i < rawIgnoredNotes.size(); i++) {
            RawIgnoredNote raw = rawIgnoredNotes.get(i);
            InternalIgnoredNote internal = ignoredNotes.get(i);
            String targetId = internal.noteId() != null
                    ? internal.noteId().toString()
                    : (raw.noteRef() != null ? raw.noteRef() : "unknown");

            log.warn("[AI AUDIT - UNRELATED INFO] NoteId: {} | Part: \"{}\" | Reason: {}",
                    targetId,
                    internal.part() != null ? internal.part() : "",
                    internal.reason() != null ? internal.reason() : "No reason provided");
        }

        return ignoredNotes;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests group.four.nyare.nyare.ai.audit.NoteAuditorTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/ai/audit/NoteAuditor.java src/test/java/group/four/nyare/nyare/ai/audit/NoteAuditorTest.java
git commit -m "feat(ai): create NoteAuditor for omitted note auditing"
```

---

### Task 2: Refactor `StudyPlannerEngine` and Remove `NoteAuditAdvisor`

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`
- Delete: `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`

**Interfaces:**
- Consumes: `NoteAuditor`
- Produces: `StudyPlannerEngine` without internal auditing clutter

- [ ] **Step 1: Update `StudyPlannerEngine`**

In `StudyPlannerEngine.java`:
1. Add import: `import group.four.nyare.nyare.ai.audit.NoteAuditor;`
2. Remove import: `import group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor;`
3. Add field: `private final NoteAuditor noteAuditor;`
4. Update `@Autowired` constructor:
   - Accept `NoteAuditor noteAuditor` instead of `NoteAuditAdvisor noteAuditAdvisor`.
   - Assign `this.noteAuditor = noteAuditor != null ? noteAuditor : new NoteAuditor();`
   - Build `chatClient` without `builder.defaultAdvisors(noteAuditAdvisor)`.
5. Update package-private constructor:
   - Keep `StudyPlannerEngine(ChatClient chatClient)` that delegates to `this(chatClient, new NoteAuditor());`.
   - Add `StudyPlannerEngine(ChatClient chatClient, NoteAuditor noteAuditor)` to initialize both fields.
6. In `process(...)`:
   - Remove `noteIdMap` generation loop.
   - Remove `.advisors(a -> a.param("noteIdMap", noteIdMap))`.
   - Call `chatClient.prompt(prompt).call().entity(LlmPayload.class)`.
   - Call `noteAuditor.audit(raw.ignoredNotes(), noteCodec);` when `raw` is not null.
7. In `decodeReferences(...)`:
   - Remove the local `ignoredNotes` variable and stream decoding.
8. In `LlmPayload`:
   - Change type of `ignoredNotes` to `List<NoteAuditor.RawIgnoredNote>`.
9. Remove inner records `RawIgnoredNote` and `InternalIgnoredNote` from `StudyPlannerEngine`.

- [ ] **Step 2: Update `StudyPlannerEngineTest`**

In `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`:
1. Add import: `import group.four.nyare.nyare.ai.audit.NoteAuditor;`
2. Remove any unused `Consumer` mock matcher for advisors.
3. Update mock calls: change `.advisors(any(Consumer.class)).call()` to `.call()`.
4. Update `LlmPayload` instantiations:
   - Replace `StudyPlannerEngine.RawIgnoredNote` with `NoteAuditor.RawIgnoredNote`.
5. In `processDecodesIgnoredNotesWithPartAndNoteId`:
   - Instantiate a mock or spy `NoteAuditor`.
   - Construct `engine = new StudyPlannerEngine(chatClient, noteAuditor);`.
   - Verify that `noteAuditor.audit(any(), any())` receives the raw ignored note.

- [ ] **Step 3: Delete obsolete `NoteAuditAdvisor.java`**

Delete `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`.

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `./gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineTest`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java
git rm src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java
git commit -m "refactor(ai): delegate note auditing from StudyPlannerEngine to NoteAuditor"
```

---

### Task 3: Update Integration Tests and Verify Full Build

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`

**Interfaces:**
- Consumes: `NoteAuditor`
- Produces: Verified integration test execution

- [ ] **Step 1: Update `StudyPlannerEngineIntegrationTest`**

In `StudyPlannerEngineIntegrationTest.java`:
1. Add import: `import group.four.nyare.nyare.ai.audit.NoteAuditor;`
2. Remove import: `import group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor;` (if present).
3. Update line 48:
   - Change `@Import({StudyPlannerEngine.class, group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor.class})`
   - To `@Import({StudyPlannerEngine.class, NoteAuditor.class})`.

- [ ] **Step 2: Run targeted unit and compile checks**

Run: `./gradlew compileJava compileTestJava`
Expected: PASS with zero compiler errors.

- [ ] **Step 3: Run unit test suite**

Run: `./gradlew test --tests "group.four.nyare.nyare.ai.*"`
Expected: PASS.

- [ ] **Step 4: Update knowledge graph**

Run: `graphify update .` outside sandbox.
Expected: Knowledge graph updated successfully.

- [ ] **Step 5: Commit**

```bash
git add src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java
git commit -m "test(ai): update StudyPlannerEngineIntegrationTest to use NoteAuditor"
```

---

## Plan Self-Review Checklist

- **Spec coverage:** Does the plan extract the auditing subsystem from `StudyPlannerEngine` into a new class? Yes, `NoteAuditor`.
- **Placeholder scan:** No "TODO", "TBD", or vague placeholders exist. All code snippets and commands are explicit.
- **Type consistency:** `NoteAuditor.RawIgnoredNote` and `NoteAuditor.InternalIgnoredNote` signatures match between Tasks 1, 2, and 3.
- **ASD-STE100 compliance:** All steps use active voice and short sentences without semicolons or phrasal verbs.
