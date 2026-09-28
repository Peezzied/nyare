---
name: generating-test-notes
description: Use when authoring student journal note fixtures, generating realistic rushed test entries, or creating edge-case test notes for Nyare academic planning evaluation.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Generating Test Notes for Nyare

## Overview

This skill guides the creation of realistic student journal notes for test fixtures and integration tests in Nyare.
Nyare evaluates AI extraction and planning against authentic university student behavior.

**REQUIRED SUB-SKILL:** Consult `prompt-engineering` for prompt architecture, CSV tag structures, and extraction invariants. Consult `man-spring` for Spring AI ChatClient testing.

---

## When to Use

- Authoring integration test fixtures for `StudyPlannerEngine` and `StudyPlannerService`.
- Benchmarking AI model performance against rushed, informal, or fragmented notes.
- Constructing edge cases: mixed academic/personal notes, implied tasks, and outliers.
- Verifying temporal anchoring of relative dates against university schedules.

### When NOT to Use

- Generating system prompts or StringTemplate templates (use `prompt-engineering`).
- Authoring production API request payloads or REST controllers (use `dr-jskill`).
- Creating generic unit test mocks without AI extraction logic.

---

## Note Taxonomy & Archetypes

University students rarely write well-structured, formal notes.
Students write informal, rushed, fragmented, and mixed-language (e.g., Taglish) notes.

| Archetype | Characteristics | Example Snippet | Expected Extraction |
| :--- | :--- | :--- | :--- |
| **1. Rushed / Fragmented** | Shorthand, typos, mixed language, incomplete sentences. | `"grabe sabaw ako sa lab 3 kanina sa a-205 puro inheritance..."` | Extracts context on difficulty, normalizes to English. |
| **2. Implied Tasks** | Inferred duties from professor instructions or announcements. | `"sabi rin ni prof mag-practice daw kami ng java abstract classes before thursday"` | Extracts implied task: "Practice Java abstract classes". |
| **3. Fixed Events & Deadlines** | Rigid constraints with relative or absolute timestamps. | `"may pa-lab report si sir due next tue oct 6 ng 1:30pm bago mag-start lab"` | Extracts academic event with precise ISO deadline. |
| **4. Academic Context Facts** | Subjective struggles, syllabus progress, or comprehension state. | `"intro pa lang sa android studio setup pero shookt kami biglang announced quiz"` | Extracts context fact regarding quiz coverage and setup. |
| **5. Mixed Content** | Valid academic work mixed with personal errands or leisure. | `"Kailangan ko tapusin uml class diagram asap. Tapos nag-kape ako sa Starbucks."` | Extracts UML task; omits and audits Starbucks errand. |
| **6. Pure Outlier** | Statements with zero academic relevance to the linked course. | `"bumili ako ng shampoo, sabon, tsaka kape tapos nanood ako ng anime buong gabi"` | Extracts zero entities; audits entire note exclusion. |

---

## Core Fixture Pattern (Java)

When constructing test notes in Java integration tests, use a clean helper factory to link courses and inject mock UUIDs:

```java
private static Note createNote(Course course, String text) {
    UUID noteId = UUID.randomUUID();
    Note note = new Note(course, new NoteContent(text, null));
    ReflectionTestUtils.setField(note, "id", noteId);
    return note;
}
```

### Linking with Academic State & Schedules

Always anchor test notes to recurring class schedules and reference time.
Grounding relative expressions ("before thursday lecture", "next tue lab") requires:
1. Defined `Course` objects.
2. Recurring `Schedule` entries matching the course meeting times.
3. Relative expressions resolved against the temporal context date.

```java
Course oop = new Course("Object-Oriented Programming", "CS Core Course");
Schedule oopLab = new Schedule(oop, DayOfWeek.TUESDAY, LocalTime.of(13, 30), LocalTime.of(16, 30));

String noteText = "may pa-lab report si sir due next tue ng 1:30pm bago mag-start lab. " +
                  "kailangan ko tapusin yung uml class diagram asap.";
Note note = createNote(oop, noteText);
```

---

## Assertion & Verification Patterns

### 1. Clean Domain Extraction
Assert that `ExtractedData` contains only clean domain entities without internal audit fields:

```java
StudyPlannerEngine.ExtractedData result = engine.process(
        List.of(note), existingTasks, existingEvents, existingContexts, schedules);

assertThat(result.tasks()).isNotEmpty();
assertThat(result.tasks()).allMatch(t -> t.noteId().equals(note.getId()));
```

### 2. Auditing Mixed or Outlier Content
Use Spring Boot's `OutputCaptureExtension` to verify that `NoteAuditAdvisor` logged the omitted statements:

```java
@ExtendWith(OutputCaptureExtension.class)
@SpringBootTest(classes = TestConfig.class)
class StudyPlannerEngineIntegrationTest {

    @Test
    void process_withMixedNote_extractsEntitiesAndAuditsUnrelated(CapturedOutput output) {
        // ... process mixed note ...

        // Assert valid tasks extracted
        assertThat(result.tasks()).anyMatch(t -> t.title().toLowerCase().contains("uml"));

        // Assert advisor logged the omitted personal errand
        assertThat(output.getAll()).contains("[AI AUDIT - UNRELATED INFO]");
        assertThat(output.getAll()).contains("n1");
    }
}
```

---

## Common Mistakes

| Mistake | Impact | Fix |
| :--- | :--- | :--- |
| Writing formal textbook English | Fails to test model robustness on real student notes. | Use colloquial phrasing, abbreviations, or mixed language. |
| Missing recurring schedule anchors | Model cannot resolve relative expressions like "bago mag-lab". | Provide realistic `Schedule` objects for the linked course. |
| Hardcoding fixed dates in note text | Tests break when reference date shifts. | Use relative terms ("next tuesday", "before thursday class"). |
| Checking audit fields in `ExtractedData` | Violates domain model isolation. | Assert audit events via `CapturedOutput` on `NoteAuditAdvisor`. |
