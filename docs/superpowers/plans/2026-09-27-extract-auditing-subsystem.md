# Extract Auditing Subsystem Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the note auditing subsystem from `StudyPlannerEngine` into a dedicated `NoteAuditor` component to separate extraction orchestration from audit logging.

**Architecture:** Create a `NoteAuditor` component under `group.four.nyare.nyare.ai.audit` to hold audit records (`RawIgnoredNote`, `InternalIgnoredNote`) and audit processing logic. Update `StudyPlannerEngine` to delegate audit logging directly to `NoteAuditor` using typed payload data. Remove residual audit code, manual JSON string re-parsing, and temporary advisor parameter maps from `StudyPlannerEngine`.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring AI 2.0.0, Jackson, SLF4J, JUnit 5, AssertJ, Mockito.

**Spec:** [docs/conceptual-model.md](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/conceptual-model.md)

## Global Constraints

- Apply ASD-STE100 rules to all code comments and text.
- Do not use semicolons in documentation sentences.
- Use constructor injection with Spring `@Autowired(required = false)` for optional auditor collaboration.
- Do not introduce custom exception classes.
- Follow layer isolation rules.

---

### Task 1: Create NoteAuditor and Audit Model Records

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/ai/audit/NoteAuditor.java`
- Test: `src/test/java/group/four/nyare/nyare/ai/audit/NoteAuditorTest.java`

**Interfaces:**
- Produces: `NoteAuditor`, `NoteAuditor.RawIgnoredNote`, `NoteAuditor.InternalIgnoredNote`
- Consumes: `StubReferenceCodec<Note>`, `Note`

- [ ] **Step 1: Write the failing unit test for NoteAuditor**

```java
package group.four.nyare.nyare.ai.audit;

import group.four.nyare.nyare.ai.parser.StubReferenceCodec;
import group.four.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import org.junit.jupiter.api.BeforeEach;
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

    private NoteAuditor auditor;

    @BeforeEach
    void setUp() {
        auditor = new NoteAuditor();
    }

    @Test
    @DisplayName("audit logs warning with decoded noteId, part, and reason for valid raw ignored notes")
    void audit_withValidIgnoredNotes_logsWarningWithDecodedNoteId(CapturedOutput output) {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, new NoteContent("Personal errand notes", null));
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        StubReferenceCodec<Note> noteCodec = new StubReferenceCodec<>("n");
        String noteRef = noteCodec.encode(note);

        NoteAuditor.RawIgnoredNote rawNote = new NoteAuditor.RawIgnoredNote(
                noteRef,
                "bought groceries and watched anime",
                "Unrelated personal activity"
        );

        auditor.audit(List.of(rawNote), noteCodec);

        assertThat(output.getAll()).contains("[AI AUDIT - UNRELATED INFO]");
        assertThat(output.getAll()).contains("NoteId: " + noteId);
        assertThat(output.getAll()).contains("Part: \"bought groceries and watched anime\"");
        assertThat(output.getAll()).contains("Reason: Unrelated personal activity");
    }

    @Test
    @DisplayName("audit logs fallback noteRef when noteCodec cannot resolve note entity")
    void audit_withUnresolvableNoteRef_logsFallbackNoteRef(CapturedOutput output) {
        StubReferenceCodec<Note> noteCodec = new StubReferenceCodec<>("n");

        NoteAuditor.RawIgnoredNote rawNote = new NoteAuditor.RawIgnoredNote(
                "n99",
                "unrelated text snippet",
                "Course mismatch"
        );

        auditor.audit(List.of(rawNote), noteCodec);

        assertThat(output.getAll()).contains("[AI AUDIT - UNRELATED INFO]");
        assertThat(output.getAll()).contains("NoteId: n99");
        assertThat(output.getAll()).contains("Part: \"unrelated text snippet\"");
        assertThat(output.getAll()).contains("Reason: Course mismatch");
    }

    @Test
    @DisplayName("audit does nothing when ignored notes list is null or empty")
    void audit_withNullOrEmptyList_doesNothing(CapturedOutput output) {
        StubReferenceCodec<Note> noteCodec = new StubReferenceCodec<>("n");

        auditor.audit(null, noteCodec);
        auditor.audit(Collections.emptyList(), noteCodec);

        assertThat(output.getAll()).doesNotContain("[AI AUDIT - UNRELATED INFO]");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `gradlew test --tests group.four.nyare.nyare.ai.audit.NoteAuditorTest`
Expected: Compilation failure because `NoteAuditor` does not exist yet.

- [ ] **Step 3: Implement NoteAuditor**

```java
package group.four.nyare.nyare.ai.audit;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import group.four.nyare.nyare.ai.parser.StubReferenceCodec;
import group.four.nyare.nyare.model.Note;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Handles audit logging for omitted statements and ignored outlier notes.
 */
@Component
public class NoteAuditor {

    private static final Logger log = LoggerFactory.getLogger(NoteAuditor.class);

    /**
     * Audits and logs warnings for omitted statements and ignored notes.
     *
     * @param rawIgnoredNotes list of raw ignored note entries from the LLM payload
     * @param noteCodec       codec to decode stub reference to Note entity
     */
    public void audit(List<RawIgnoredNote> rawIgnoredNotes, StubReferenceCodec<Note> noteCodec) {
        if (rawIgnoredNotes == null || rawIgnoredNotes.isEmpty()) {
            return;
        }

        for (RawIgnoredNote raw : rawIgnoredNotes) {
            if (raw == null) {
                continue;
            }
            Note note = noteCodec != null ? noteCodec.decode(raw.noteRef()) : null;
            UUID noteId = note != null ? note.getId() : null;
            String reference = noteId != null ? noteId.toString() : (raw.noteRef() != null ? raw.noteRef() : "unknown");
            String part = raw.part() != null ? raw.part() : "";
            String reason = raw.reason() != null ? raw.reason() : "No reason provided";

            log.warn("[AI AUDIT - UNRELATED INFO] NoteId: {} | Part: \"{}\" | Reason: {}", reference, part, reason);
        }
    }

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
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `gradlew test --tests group.four.nyare.nyare.ai.audit.NoteAuditorTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/ai/audit/NoteAuditor.java src/test/java/group/four/nyare/nyare/ai/audit/NoteAuditorTest.java
git commit -m "feat(ai): create NoteAuditor and audit model records"
```

---

### Task 2: Refactor StudyPlannerEngine to Delegate to NoteAuditor

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- Delete: `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`

**Interfaces:**
- Consumes: `NoteAuditor`, `NoteAuditor.RawIgnoredNote`
- Produces: `StudyPlannerEngine.process(...)` (audit delegation decoupled from LLM prompt execution)

- [ ] **Step 1: Update StudyPlannerEngine to inject NoteAuditor and remove legacy audit code**

Update `StudyPlannerEngine.java`:
1. Import `group.four.nyare.nyare.ai.audit.NoteAuditor`.
2. Inject `@Autowired(required = false) NoteAuditor noteAuditor` in constructor.
3. Remove `@Autowired(required = false) NoteAuditAdvisor noteAuditAdvisor` and `builder.defaultAdvisors(...)`.
4. In `process()`:
   - Remove `noteIdMap` creation loop.
   - Remove `.advisors(a -> a.param("noteIdMap", noteIdMap))` on `chatClient.prompt(...)`.
   - Call `if (raw != null && noteAuditor != null) { noteAuditor.audit(raw.ignoredNotes(), noteCodec); }`.
5. In `decodeReferences()`:
   - Remove dead `ignoredNotes` decoding.
6. In `LlmPayload`:
   - Change `List<RawIgnoredNote> ignoredNotes` to `List<NoteAuditor.RawIgnoredNote> ignoredNotes`.
7. Remove inner records `RawIgnoredNote` and `InternalIgnoredNote` from `StudyPlannerEngine.java`.

- [ ] **Step 2: Delete NoteAuditAdvisor and update tests**

1. Delete `src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java`.
2. Update `StudyPlannerEngineIntegrationTest.java`:
   - Replace `@Import({StudyPlannerEngine.class, group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor.class})` with `@Import({StudyPlannerEngine.class, group.four.nyare.nyare.ai.audit.NoteAuditor.class})`.
3. Update `StudyPlannerEngineTest.java`:
   - Add unit test verifying `NoteAuditor.audit` invocation when `LlmPayload` contains ignored notes.

- [ ] **Step 3: Run targeted unit tests**

Run: `gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineTest`
Expected: PASS

- [ ] **Step 4: Run integration tests**

Run: `gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineIntegrationTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java
git rm src/main/java/group/four/nyare/nyare/ai/advisor/NoteAuditAdvisor.java
git commit -m "refactor(ai): extract auditing subsystem from StudyPlannerEngine to NoteAuditor"
```

---

### Task 3: Full Verification and Knowledge Graph Update

**Files:**
- Modify: `graphify-out/` (via CLI update)

- [ ] **Step 1: Run complete test suite**

Run: `gradlew test`
Expected: All tests PASS.

- [ ] **Step 2: Update graphify knowledge graph**

Run: `graphify update .` (with `BypassSandbox: true` and `Cwd` set to backend directory)
Expected: AST update completes successfully without error.

- [ ] **Step 3: Commit graph updates if needed**

```bash
git add graphify-out/
git commit -m "chore: update knowledge graph after auditing subsystem extraction"
```

## Verification Plan

### Automated Tests
- `gradlew test --tests group.four.nyare.nyare.ai.audit.NoteAuditorTest`
- `gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineTest`
- `gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineIntegrationTest`
- `gradlew test`

### Manual Verification
- Review diff of `StudyPlannerEngine.java` to confirm no residual audit parsing, dead decoding code, or advisor parameter map creation remains.
- Verify that `[AI AUDIT - UNRELATED INFO]` warning logs appear with correct Note UUID and statement text when testing mixed or outlier notes.
