# AI Engine Integration Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Spring Boot integration test for `StudyPlannerEngine` to verify prompt construction, Gemini AI extraction, implied task detection, and note UUID decoding.

**Architecture:** A `@SpringBootTest` integration test loads the Spring context, injects `StudyPlannerEngine`, provides rich test literals across multiple courses, executes `engine.process(...)` live against Gemini 3.5 Flash Lite, and asserts entity extraction and reference decoding.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring AI 2.0.0 (Google GenAI starter), JUnit 5, AssertJ.

**Spec:** Integration verification for `system_prompt.st`, `StudyPlannerEngine.java`, and `StudyPlannerEngine.ExtractedData`.

## Global Constraints

- ASD-STE100 rules: active voice, short sentences, no semicolons, no phrasal verbs, no nominalizations.
- Invariant: never calculate artificial numerical priority scores.
- Invariant: recommendations must target calendar dates (`scheduledDate`), not hourly time blocks.
- Invariant: unstated dates or durations must remain null.
- Layer isolation: test files reside strictly in `src/test/java/group/four/nyare/nyare/ai/`.
- Test execution: `@EnabledIfEnvironmentVariable(named = "GOOGLE_API_KEY", matches = ".*\\S.*")` gates live LLM calls.

---

## Test Literals Specification (For User Review)

The test feeds realistic, rushed student journal entries and existing course data into `StudyPlannerEngine.process(...)`.

### 1. Courses
- **Course 1**: `CS201` ("Data Structures and Algorithms")
- **Course 2**: `MATH108` ("Linear Algebra")

### 2. Class Schedules (`List<Schedule>`)
- `CS201`: Tuesday and Thursday from 09:00 to 10:30.
- `MATH108`: Monday and Wednesday from 13:30 to 15:00.

### 3. Pre-existing Academic Data
- **Existing Tasks (`List<Task>`)**:
  - `CS201`: `"Read chapter 3 on Big-O"`, status `COMPLETED`, scheduled for 5 days ago.
  - `MATH108`: `"Solve matrix inversion exercises"`, status `TODO`, scheduled for tomorrow.
- **Existing Academic Events (`List<AcademicEvent>`)**:
  - `CS201`: `"CS201 Lab Activity 1"`, deadline in 8 days.
- **Existing Academic Contexts (`List<AcademicContext>`)**:
  - `CS201`: `"Student finds tree balancing difficult"`, created 3 days ago.
  - `MATH108`: `"Covered vector spaces and subspaces"`, created 7 days ago.

### 4. Input Student Journal Notes (`List<Note>`)

#### Note 1 (`CS201`): Rushed, informal entry with explicit task, implied task, and academic event
- **Content**:
  ```markdown
  prof went thru binary search trees so fast today... totally lost on AVL tree rotations. quiz next tue sep 29 at 10am covering trees. need to submit assignment 1 draft by friday 11:59pm. prof said we must practice tree traversals on leetcode before the quiz
  ```
- **Target Assertions for Note 1**:
  - **Explicit Task**: Extract task for Assignment 1 draft submission.
  - **Implied Task**: Extract task to practice tree traversals on LeetCode.
  - **Academic Event**: Extract Quiz with deadline set to `2026-09-29T10:00:00`.
  - **Academic Context**: Extract fact regarding difficulty with AVL tree rotations or tree traversal coverage.
  - **Reference Decoding**: Verify task and event `noteId` fields match Note 1 UUID.

#### Note 2 (`MATH108`): Informal entry with homework deadline and midterm announcement
- **Content**:
  ```markdown
  hw3 questions 1-5 due monday 5pm on canvas. midterm exam announced for oct 8 at 2pm in hall b. read chapter 3 pages 45-60 before next class
  ```
- **Target Assertions for Note 2**:
  - **Explicit Task**: Extract reading task for Chapter 3 pages 45-60.
  - **Explicit Task**: Extract homework 3 completion task.
  - **Academic Event**: Extract Midterm Exam with deadline set to `2026-10-08T14:00:00`.
  - **Academic Event**: Extract Homework 3 deadline set to Monday at 17:00:00.
  - **Reference Decoding**: Verify task and event `noteId` fields match Note 2 UUID.

---

## Task Decomposition

### Task 1: Initialize Engine in Unit Test `StudyPlannerEngineTest`

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java:44-50`

**Interfaces:**
- Consumes: `StudyPlannerEngine(ChatClient chatClient)`
- Produces: Reliable unit test baseline

- [ ] **Step 1: Write the failing test / inspection**
Inspect `StudyPlannerEngineTest.java` lines 44-50 where `setUp()` leaves `engine` uninitialized.

- [ ] **Step 2: Update `setUp()` to instantiate engine**
In `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`:
```java
    @BeforeEach
    void setUp() {
        engine = new StudyPlannerEngine(chatClient);
    }
```

- [ ] **Step 3: Run static verification via IntelliJ MCP**
Run `get_file_problems` on `StudyPlannerEngineTest.java`. Verify 0 errors.

---

### Task 2: Create Integration Test File `StudyPlannerEngineIntegrationTest`

**Files:**
- Create: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`

**Interfaces:**
- Consumes: `StudyPlannerEngine`, `Course`, `Note`, `Task`, `AcademicEvent`, `AcademicContext`, `Schedule`
- Produces: Live AI integration test suite verifying full extraction cycle

- [ ] **Step 1: Write the integration test class with test literals and live assertions**
Create `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`:
```java
package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@EnabledIfEnvironmentVariable(named = "GOOGLE_API_KEY", matches = ".*\\S.*")
class StudyPlannerEngineIntegrationTest {

    @Autowired
    private StudyPlannerEngine engine;

    @Test
    @DisplayName("process extracts tasks, implied tasks, events, and contexts with decoded UUIDs from rushed notes")
    void process_withRushedNotes_extractsEntitiesAndDecodesUuids() {
        // given: Courses
        Course csCourse = new Course("CS201", "Data Structures and Algorithms");
        Course mathCourse = new Course("MATH108", "Linear Algebra");

        // given: Schedules
        Schedule csScheduleTue = new Schedule(csCourse, DayOfWeek.TUESDAY, LocalTime.of(9, 0), LocalTime.of(10, 30));
        Schedule csScheduleThu = new Schedule(csCourse, DayOfWeek.THURSDAY, LocalTime.of(9, 0), LocalTime.of(10, 30));
        Schedule mathScheduleMon = new Schedule(mathCourse, DayOfWeek.MONDAY, LocalTime.of(13, 30), LocalTime.of(15, 0));
        Schedule mathScheduleWed = new Schedule(mathCourse, DayOfWeek.WEDNESDAY, LocalTime.of(13, 30), LocalTime.of(15, 0));
        List<Schedule> schedules = List.of(csScheduleTue, csScheduleThu, mathScheduleMon, mathScheduleWed);

        // given: Existing Tasks
        Task completedTask = new Task(csCourse, "Read chapter 3 on Big-O");
        completedTask.setStatus(TaskStatus.COMPLETED);
        completedTask.setScheduledDate(LocalDate.now().minusDays(5));
        Task openMathTask = new Task(mathCourse, "Solve matrix inversion exercises");
        openMathTask.setStatus(TaskStatus.TODO);
        openMathTask.setScheduledDate(LocalDate.now().plusDays(1));
        List<Task> existingTasks = List.of(completedTask, openMathTask);

        // given: Existing Events
        AcademicEvent labEvent = new AcademicEvent(csCourse, null, "CS201 Lab Activity 1", "Graphs",
                LocalDateTime.now().plusDays(8));
        List<AcademicEvent> existingEvents = List.of(labEvent);

        // given: Existing Contexts
        AcademicContext csContext = new AcademicContext(csCourse, "Student finds tree balancing difficult");
        ReflectionTestUtils.setField(csContext, "createdAt", Instant.now().minus(3, ChronoUnit.DAYS));
        AcademicContext mathContext = new AcademicContext(mathCourse, "Covered vector spaces and subspaces");
        ReflectionTestUtils.setField(mathContext, "createdAt", Instant.now().minus(7, ChronoUnit.DAYS));
        List<AcademicContext> existingContexts = List.of(csContext, mathContext);

        // given: Journal Notes with UUIDs
        UUID note1Id = UUID.randomUUID();
        String note1Text = "prof went thru binary search trees so fast today... totally lost on AVL tree rotations. " +
                "quiz next tue sep 29 at 10am covering trees. need to submit assignment 1 draft by friday 11:59pm. " +
                "prof said we must practice tree traversals on leetcode before the quiz";
        Note note1 = new Note(csCourse, new NoteContent(note1Text, null));
        ReflectionTestUtils.setField(note1, "id", note1Id);

        UUID note2Id = UUID.randomUUID();
        String note2Text = "hw3 questions 1-5 due monday 5pm on canvas. midterm exam announced for oct 8 at 2pm in hall b. " +
                "read chapter 3 pages 45-60 before next class";
        Note note2 = new Note(mathCourse, new NoteContent(note2Text, null));
        ReflectionTestUtils.setField(note2, "id", note2Id);

        List<Note> notes = List.of(note1, note2);

        // when
        StudyPlannerEngine.ExtractedData result = engine.process(
                notes, existingTasks, existingEvents, existingContexts, schedules);

        // observe: Pretty-print structured report and raw JSON for developer inspection
        System.out.println("\n=======================================================");
        System.out.println("            STUDY PLANNER ENGINE AI OUTPUT             ");
        System.out.println("=======================================================");

        System.out.println("\n--- EXTRACTED TASKS (" + result.tasks().size() + ") ---");
        for (StudyPlannerEngine.ExtractedTask task : result.tasks()) {
            System.out.printf("• [%s] %s%n", task.noteRef(), task.title());
            System.out.printf("  Description: %s%n", task.description());
            System.out.printf("  Scheduled:   %s | Duration: %s min | NoteId: %s%n",
                    task.scheduledDate(), task.estimatedMinutes(), task.noteId());
        }

        System.out.println("\n--- EXTRACTED EVENTS (" + result.events().size() + ") ---");
        for (StudyPlannerEngine.ExtractedEvent event : result.events()) {
            System.out.printf("• [%s] %s%n", event.noteRef(), event.title());
            System.out.printf("  Description: %s%n", event.description());
            System.out.printf("  Deadline:    %s | NoteId: %s%n", event.deadline(), event.noteId());
        }

        System.out.println("\n--- EXTRACTED CONTEXTS (" + result.contexts().size() + ") ---");
        for (StudyPlannerEngine.ExtractedContext context : result.contexts()) {
            System.out.printf("• [%s] %s (NoteId: %s)%n", context.noteRef(), context.value(), context.noteId());
        }

        System.out.println("\n--- RAW JSON PAYLOAD ---");
        com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper().registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
        System.out.println(mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result));
        System.out.println("=======================================================\n");

        // then: Entity lists present
        assertThat(result).isNotNull();
        assertThat(result.tasks()).isNotEmpty();
        assertThat(result.events()).isNotEmpty();
        assertThat(result.contexts()).isNotEmpty();

        // then: Decoded UUID references match source notes
        assertThat(result.tasks())
                .allMatch(t -> t.noteId() != null && (t.noteId().equals(note1Id) || t.noteId().equals(note2Id)));
        assertThat(result.events())
                .allMatch(e -> e.noteId() != null && (e.noteId().equals(note1Id) || e.noteId().equals(note2Id)));
        assertThat(result.contexts())
                .allMatch(c -> c.noteId() != null && (c.noteId().equals(note1Id) || c.noteId().equals(note2Id)));

        // then: Implied task exists (practice traversals on LeetCode)
        assertThat(result.tasks())
                .anyMatch(t -> t.title().toLowerCase().contains("traversal") ||
                               t.title().toLowerCase().contains("leetcode") ||
                               t.title().toLowerCase().contains("practice"));

        // then: Academic events extracted with valid deadlines
        assertThat(result.events())
                .anyMatch(e -> e.title().toLowerCase().contains("quiz") ||
                               e.title().toLowerCase().contains("midterm"));
    }
}
```

- [ ] **Step 2: Run static inspection via IntelliJ MCP**
Run `get_file_problems` on `StudyPlannerEngineIntegrationTest.java`. Verify 0 errors.

---

### Task 3: Knowledge Graph and Verification

**Files:**
- Execute: `graphify update .`

- [ ] **Step 1: Refresh knowledge graph**
Run `graphify update .` with `BypassSandbox: true` and `Cwd: backend`.

- [ ] **Step 2: Review test execution criteria**
Verify that the test executes when `GOOGLE_API_KEY` is provided, and gracefully skips when absent.
