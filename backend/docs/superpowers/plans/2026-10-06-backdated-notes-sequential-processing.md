# Backdated Notes, Status Inspection & Sequential Multi-Day Processing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable students to view pending dirty note status before processing, create and edit backdated journal notes within a configurable horizon (`DEFAULT_MAX_BACKDATE_DAYS = 14`), and execute sequential chronological AI processing across dirty dates while anchoring final study planning to today.

**Architecture:** 
1. **Pre-flight Status**: Add `GET /api/study-planner/status` returning dirty note count, dirty dates, and involved courses so the client displays pending work before processing.
2. **Backdated Note Domain & Horizon Boundary**: Add `entryDate` (`LocalDate`, defaulting to `LocalDate.now()`) to `Note`. Enforce backdating horizon limit in `NoteServiceImpl` using constant `DEFAULT_MAX_BACKDATE_DAYS = 14` (configurable via `nyare.notes.max-backdate-days:14`), rejecting entries older than the horizon with 400 Bad Request.
3. **Dirty Note Selection**: Update `NoteRepository.findDirtyNotes` to select all dirty notes across all dates ordered by `entryDate ASC, createdAt ASC`.
4. **Two-Phase Sequential Execution**: Update `StudyPlannerServiceImpl` to clean prior uncompleted entities for edited notes and extract entities day-by-day chronologically; anchor final study planning pass to `LocalDate.now()`.
5. **SSE Progress Feedback**: Emit an initial `init` event with dirty note counts before heavy LLM processing begins.
6. **No Git Commits Execution Rule**: Do not run `git commit` commands during plan execution. Generate commit messages and record affected files using `caveman-commit`.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring Data JPA, Spring AI 2.0.0, Hibernate, SQLite, JUnit 5, Mockito, AssertJ.

**Spec:** Decisions resolved during architectural alignment:
1. Pre-flight endpoint `GET /api/study-planner/status` exposes pending note state.
2. `entryDate` on `Note` (`LocalDate`, non-null, default `LocalDate.now()`, rejected if future).
3. Backdating horizon validation: constant `DEFAULT_MAX_BACKDATE_DAYS = 14` (configurable via `nyare.notes.max-backdate-days`), rejecting notes older than 14 days with 400 Bad Request.
4. Clean up previously extracted uncompleted tasks (`status != COMPLETED`), academic events, and academic contexts for edited notes before saving new extractions.
5. Two-phase sequential processing in `StudyPlannerService`: chronological day-by-day extraction ($D_1 \rightarrow D_n$), followed by a single planning pass anchored to `LocalDate.now()`.
6. `POST /api/study-planner/process` processes all pending dirty notes without requiring date parameters.

## Global Constraints

- ASD-STE100 rules: active voice, short sentences, no semicolons, no phrasal verbs, no nominalizations.
- Invariant: do not execute `git commit` commands. Record affected files and generate `caveman-commit` messages instead.
- Invariant: do not calculate artificial numerical priority scores.
- Invariant: recommendations must target calendar dates (`scheduledDate`), not hourly time blocks.
- Invariant: unstated dates or durations must remain null.
- Canonical exceptions only: throw `ResourceNotFoundException` (404) or `BadRequestException` (400).
- Layer isolation: Controller -> Service interface -> Service impl -> Repository -> Database.
- Tests: Unit tests with JUnit 5 and Mockito; integration tests run one at a time with user approval.

---

## Logically Grouped Commits Summary (Caveman-Commit Format)

### Commit Group 1: Note Domain, Status & Horizon Validation
**Caveman Commit Message:**
```text
feat(notes): support backdated notes and pre-flight planner status

- add entryDate with 14-day horizon validation
- expose GET /api/study-planner/status for pending dirty notes
- add entity cleanup and chronological dirty queries
```
**Affected Files:**
- `src/main/java/group/four/nyare/nyare/model/Note.java`
- `src/main/java/group/four/nyare/nyare/dto/NoteRequest.java`
- `src/main/java/group/four/nyare/nyare/dto/NoteResponse.java`
- `src/main/java/group/four/nyare/nyare/dto/NoteSummaryResponse.java`
- `src/main/java/group/four/nyare/nyare/dto/PlannerStatusResponse.java`
- `src/main/java/group/four/nyare/nyare/service/NoteService.java`
- `src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`
- `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`
- `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java`
- `src/main/java/group/four/nyare/nyare/repository/AcademicContextRepository.java`
- `src/test/java/group/four/nyare/nyare/model/NoteTest.java`
- `src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`
- `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`
- `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`

---

### Commit Group 2: Sequential Multi-Day AI Planner & Integration Verification
**Caveman Commit Message:**
```text
feat(planner): implement two-phase sequential multi-day AI processing

- ground relative dates in prompt with note entry_date
- process dirty dates sequentially with entity cleanup
- anchor final study planning pass to today
- emit SSE init event with dirty note metadata
```
**Affected Files:**
- `src/main/resources/planner_sys-prompt.st`
- `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`
- `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`

---

## File Structure & Responsibilities

1. **DTOs & Models**:
   - `src/main/java/group/four/nyare/nyare/model/Note.java`: Add `entryDate` column, getters, setters, and constructors.
   - `src/main/java/group/four/nyare/nyare/dto/NoteRequest.java`: Add `@PastOrPresent LocalDate entryDate`.
   - `src/main/java/group/four/nyare/nyare/dto/NoteResponse.java`: Expose `entryDate`.
   - `src/main/java/group/four/nyare/nyare/dto/NoteSummaryResponse.java`: Expose `entryDate`.
   - `src/main/java/group/four/nyare/nyare/dto/PlannerStatusResponse.java`: New DTO reporting `hasPendingNotes`, `dirtyNoteCount`, `dirtyDates`, `courseNames`.
2. **Repositories**:
   - `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`: Remove `createdAt` single-day filter from `findDirtyNotes`. Order by `entryDate ASC, createdAt ASC`.
   - `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`: Add `deleteByNoteInAndStatusNot(List<Note> notes, TaskStatus status)`.
   - `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java`: Add `deleteByNoteIn(List<Note> notes)`.
   - `src/main/java/group/four/nyare/nyare/repository/AcademicContextRepository.java`: Add `deleteByNoteIn(List<Note> notes)`.
3. **Services**:
   - `src/main/java/group/four/nyare/nyare/service/NoteService.java` & `NoteServiceImpl.java`: Map `entryDate`, default to `LocalDate.now()` when null. Enforce `DEFAULT_MAX_BACKDATE_DAYS = 14`.
   - `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java` & `StudyPlannerServiceImpl.java`: Add `getPlannerStatus(Long userId)`, implement two-phase multi-day sequential extraction, and anchor final planning to `LocalDate.now()`.
4. **Controllers**:
   - `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`: Add `GET /api/study-planner/status` and emit initial `init` event in `/process`.
5. **AI Prompt**:
   - `src/main/resources/planner_sys-prompt.st`: Add `entry_date` to `{journal}` CSV table format specification.

---

## Task Decomposition

### Task 1: Add Pre-flight `PlannerStatusResponse` and Status Endpoint

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/dto/PlannerStatusResponse.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- Test: `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

**Interfaces:**
- Produces: `PlannerStatusResponse getPlannerStatus(Long userId)`
- Produces: `GET /api/study-planner/status` endpoint

- [ ] **Step 1: Create `PlannerStatusResponse.java`**

Create `src/main/java/group/four/nyare/nyare/dto/PlannerStatusResponse.java`:
```java
package group.four.nyare.nyare.dto;

import java.time.LocalDate;
import java.util.List;

public class PlannerStatusResponse {

    private boolean hasPendingNotes;
    private int dirtyNoteCount;
    private List<LocalDate> dirtyDates;
    private List<String> courseNames;

    public PlannerStatusResponse() {
    }

    public PlannerStatusResponse(boolean hasPendingNotes, int dirtyNoteCount, List<LocalDate> dirtyDates, List<String> courseNames) {
        this.hasPendingNotes = hasPendingNotes;
        this.dirtyNoteCount = dirtyNoteCount;
        this.dirtyDates = dirtyDates;
        this.courseNames = courseNames;
    }

    public boolean isHasPendingNotes() {
        return hasPendingNotes;
    }

    public void setHasPendingNotes(boolean hasPendingNotes) {
        this.hasPendingNotes = hasPendingNotes;
    }

    public int getDirtyNoteCount() {
        return dirtyNoteCount;
    }

    public void setDirtyNoteCount(int dirtyNoteCount) {
        this.dirtyNoteCount = dirtyNoteCount;
    }

    public List<LocalDate> getDirtyDates() {
        return dirtyDates;
    }

    public void setDirtyDates(List<LocalDate> dirtyDates) {
        this.dirtyDates = dirtyDates;
    }

    public List<String> getCourseNames() {
        return courseNames;
    }

    public void setCourseNames(List<String> courseNames) {
        this.courseNames = courseNames;
    }
}
```

- [ ] **Step 2: Write failing unit test in `StudyPlannerServiceImplTest.java`**

In `StudyPlannerServiceImplTest.java`:
```java
    @Test
    @DisplayName("getPlannerStatus returns pending note counts and distinct dates")
    void getPlannerStatus_withDirtyNotes_returnsPendingSummary() {
        Course course = courseWithId(1L, "CS101");
        Note note1 = new Note(course, "Monday note", LocalDate.of(2026, 10, 1));
        Note note2 = new Note(course, "Wednesday note", LocalDate.of(2026, 10, 3));
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of(note1, note2));

        PlannerStatusResponse response = service.getPlannerStatus(USER_ID);

        assertThat(response.isHasPendingNotes()).isTrue();
        assertThat(response.getDirtyNoteCount()).isEqualTo(2);
        assertThat(response.getDirtyDates()).containsExactly(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 3));
        assertThat(response.getCourseNames()).containsExactly("CS101");
    }
```

- [ ] **Step 3: Implement `getPlannerStatus` in service and controller**

In `StudyPlannerService.java`:
Add: `PlannerStatusResponse getPlannerStatus(Long userId);`

In `StudyPlannerServiceImpl.java`:
```java
    @Override
    public PlannerStatusResponse getPlannerStatus(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User identifier is required");
        }
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId);
        if (dirtyNotes.isEmpty()) {
            return new PlannerStatusResponse(false, 0, List.of(), List.of());
        }
        List<LocalDate> dirtyDates = dirtyNotes.stream()
                .map(n -> n.getEntryDate() != null ? n.getEntryDate() : LocalDate.now())
                .distinct()
                .sorted()
                .toList();
        List<String> courseNames = dirtyNotes.stream()
                .filter(n -> n.getCourse() != null && n.getCourse().getName() != null)
                .map(n -> n.getCourse().getName())
                .distinct()
                .sorted()
                .toList();
        return new PlannerStatusResponse(true, dirtyNotes.size(), dirtyDates, courseNames);
    }
```

In `StudyPlannerController.java`:
```java
    @GetMapping("/status")
    public ResponseEntity<PlannerStatusResponse> getStatus() {
        Long userId = sessionContext.getUserId().orElse(null);
        PlannerStatusResponse response = studyPlannerService.getPlannerStatus(userId);
        return ResponseEntity.ok(response);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest.getPlannerStatus_withDirtyNotes_returnsPendingSummary"`
Expected: PASS.

- [ ] **Step 5: Record affected files (no git commit)**

Record affected files:
- `src/main/java/group/four/nyare/nyare/dto/PlannerStatusResponse.java`
- `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

---

### Task 2: Add `entryDate` to `Note` Entity and DTOs

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/model/Note.java`
- Modify: `src/main/java/group/four/nyare/nyare/dto/NoteRequest.java`
- Modify: `src/main/java/group/four/nyare/nyare/dto/NoteResponse.java`
- Modify: `src/main/java/group/four/nyare/nyare/dto/NoteSummaryResponse.java`
- Test: `src/test/java/group/four/nyare/nyare/model/NoteTest.java`

**Interfaces:**
- Consumes: `LocalDate`
- Produces: `Note.getEntryDate()`, `Note.setEntryDate(LocalDate)`, `NoteRequest.getEntryDate()`, `NoteResponse.getEntryDate()`

- [ ] **Step 1: Write failing test in `NoteTest.java`**

In `src/test/java/group/four/nyare/nyare/model/NoteTest.java`:
```java
    @Test
    @DisplayName("Note stores and updates entryDate")
    void noteStoresAndUpdatesEntryDate() {
        Course course = new Course("CS101", "Computer Science");
        LocalDate pastDate = LocalDate.now().minusDays(2);
        Note note = new Note(course, "Past lecture content", pastDate);

        assertThat(note.getEntryDate()).isEqualTo(pastDate);

        LocalDate updatedDate = LocalDate.now().minusDays(1);
        note.setEntryDate(updatedDate);
        assertThat(note.getEntryDate()).isEqualTo(updatedDate);
    }
```

- [ ] **Step 2: Run test to verify failure**

Run: `./gradlew test --tests "group.four.nyare.nyare.model.NoteTest.noteStoresAndUpdatesEntryDate"`
Expected: FAIL.

- [ ] **Step 3: Update `Note.java`, `NoteRequest.java`, `NoteResponse.java`, `NoteSummaryResponse.java`**

In `Note.java`:
```java
    @NotNull(message = "Entry date is required")
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    public Note(Course course, String content) {
        this(course, content, LocalDate.now());
    }

    public Note(Course course, String content, LocalDate entryDate) {
        this.course = course;
        this.content = content;
        this.entryDate = entryDate != null ? entryDate : LocalDate.now();
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
    }
```

In `NoteRequest.java`:
Add `@PastOrPresent(message = "Entry date cannot be in the future") private LocalDate entryDate;` with getters, setters, and constructors.

In `NoteResponse.java` and `NoteSummaryResponse.java`:
Add `LocalDate entryDate` field, getters, and constructor parameters.

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests "group.four.nyare.nyare.model.NoteTest.noteStoresAndUpdatesEntryDate"`
Expected: PASS.

- [ ] **Step 5: Record affected files (no git commit)**

Record affected files:
- `src/main/java/group/four/nyare/nyare/model/Note.java`
- `src/main/java/group/four/nyare/nyare/dto/NoteRequest.java`
- `src/main/java/group/four/nyare/nyare/dto/NoteResponse.java`
- `src/main/java/group/four/nyare/nyare/dto/NoteSummaryResponse.java`
- `src/test/java/group/four/nyare/nyare/model/NoteTest.java`

---

### Task 3: Update `NoteServiceImpl` for `entryDate` and Backdating Horizon Validation

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- Modify: `src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`

**Interfaces:**
- Consumes: Constant `DEFAULT_MAX_BACKDATE_DAYS = 14`, `@Value("${nyare.notes.max-backdate-days:14}") int maxBackdateDays`
- Produces: 400 `BadRequestException` when `entryDate` is older than horizon or in the future

- [ ] **Step 1: Write failing service tests for horizon limits**

In `src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`:
```java
    @Test
    void createNote_withCustomEntryDate_setsEntryDateOnNote() {
        LocalDate customDate = LocalDate.now().minusDays(3);
        NoteRequest request = new NoteRequest(1L, "Past note content", customDate);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

        NoteResponse response = noteService.createNote(request);

        assertThat(response).isNotNull();
        assertThat(response.getEntryDate()).isEqualTo(customDate);
    }

    @Test
    void createNote_withEntryDateOlderThanHorizon_throwsBadRequestException() {
        LocalDate tooOldDate = LocalDate.now().minusDays(15);
        NoteRequest request = new NoteRequest(1L, "Ancient note content", tooOldDate);

        assertThatThrownBy(() -> noteService.createNote(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Entry date cannot be older than 14 days");
    }
```

In `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`:
```java
    @Test
    void createNote_withFutureEntryDate_returns400ProblemDetail() throws Exception {
        NoteRequest request = new NoteRequest(1L, "Future content", LocalDate.now().plusDays(2));

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }
```

- [ ] **Step 2: Run tests to verify failure**

Run: `./gradlew test --tests "group.four.nyare.nyare.service.NoteServiceImplTest.createNote_withEntryDateOlderThanHorizon_throwsBadRequestException"`
Expected: FAIL.

- [ ] **Step 3: Implement horizon validation in `NoteServiceImpl.java`**

In `NoteServiceImpl.java`:
```java
    public static final int DEFAULT_MAX_BACKDATE_DAYS = 14;

    @Value("${nyare.notes.max-backdate-days:14}")
    private int maxBackdateDays = DEFAULT_MAX_BACKDATE_DAYS;

    private void validateEntryDate(LocalDate entryDate) {
        if (entryDate == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        if (entryDate.isAfter(today)) {
            throw new BadRequestException("Entry date cannot be in the future");
        }
        LocalDate oldestAllowed = today.minusDays(maxBackdateDays);
        if (entryDate.isBefore(oldestAllowed)) {
            throw new BadRequestException("Entry date cannot be older than " + maxBackdateDays + " days");
        }
    }
```
Call `validateEntryDate(request.getEntryDate())` in `createNote` and `updateNote`.
Update `createNote`:
```java
        validateEntryDate(request.getEntryDate());
        LocalDate entryDate = request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now();
        Note note = new Note(course, request.getContent(), entryDate);
```
Update `updateNote`:
```java
        if (request.getEntryDate() != null) {
            validateEntryDate(request.getEntryDate());
            note.setEntryDate(request.getEntryDate());
        }
```
Update `toResponse` and `toSummary` to map `note.getEntryDate()`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `./gradlew test --tests "group.four.nyare.nyare.service.NoteServiceImplTest"`
Run: `./gradlew test --tests "group.four.nyare.nyare.controller.NoteControllerTest"`
Expected: PASS.

- [ ] **Step 5: Record affected files (no git commit)**

Record affected files:
- `src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- `src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`
- `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`

---

### Task 4: Update Repositories for Multi-Day Dirty Query and Entity Cleanup

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/AcademicContextRepository.java`
- Test: `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`

**Interfaces:**
- Produces: `List<Note> findDirtyNotes(@Param("userId") Long userId)`
- Produces: `TaskRepository.deleteByNoteInAndStatusNot(List<Note> notes, TaskStatus status)`
- Produces: `AcademicEventRepository.deleteByNoteIn(List<Note> notes)`
- Produces: `AcademicContextRepository.deleteByNoteIn(List<Note> notes)`

- [ ] **Step 1: Write failing repository test in `NoteRepositoryTest.java`**

In `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`:
```java
    @Test
    @DisplayName("findDirtyNotes returns backdated dirty notes ordered chronologically")
    void findDirtyNotes_returnsBackdatedDirtyNotesOrdered() {
        Note olderNote = new Note(course1, "Monday note", LocalDate.now().minusDays(2));
        Note newerNote = new Note(course1, "Wednesday note", LocalDate.now());
        noteRepository.save(newerNote);
        noteRepository.save(olderNote);

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId());

        assertThat(dirtyNotes).extracting(Note::getId)
                .containsExactly(olderNote.getId(), newerNote.getId());
    }
```

- [ ] **Step 2: Run test to verify failure**

Run: `./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest.findDirtyNotes_returnsBackdatedDirtyNotesOrdered"`
Expected: FAIL.

- [ ] **Step 3: Implement repository updates**

In `NoteRepository.java`:
```java
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND (n.lastProcessedAt IS NULL OR n.updatedAt > n.lastProcessedAt)
            ORDER BY n.entryDate ASC, n.createdAt ASC
            """)
    List<Note> findDirtyNotes(@Param("userId") Long userId);
```

In `TaskRepository.java`:
```java
    @Modifying
    @Query("DELETE FROM Task t WHERE t.note IN :notes AND t.status != :status")
    void deleteByNoteInAndStatusNot(@Param("notes") List<Note> notes, @Param("status") TaskStatus status);
```

In `AcademicEventRepository.java`:
```java
    @Modifying
    @Query("DELETE FROM AcademicEvent e WHERE e.note IN :notes")
    void deleteByNoteIn(@Param("notes") List<Note> notes);
```

In `AcademicContextRepository.java`:
```java
    @Modifying
    @Query("DELETE FROM AcademicContext c WHERE c.note IN :notes")
    void deleteByNoteIn(@Param("notes") List<Note> notes);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest.findDirtyNotes_returnsBackdatedDirtyNotesOrdered"`
Expected: PASS.

- [ ] **Step 5: Record affected files (no git commit)**

Record affected files:
- `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`
- `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`
- `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java`
- `src/main/java/group/four/nyare/nyare/repository/AcademicContextRepository.java`
- `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`

---

### Task 5: Update AI Prompt and Engine with `entry_date`

**Files:**
- Modify: `src/main/resources/planner_sys-prompt.st`
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`

**Interfaces:**
- Consumes: Note CSV rows with `note_ref, course, entry_date, content`
- Produces: Grounded temporal relative expression resolution

- [ ] **Step 1: Update `planner_sys-prompt.st`**

Update `{journal}` input format description:
```text
- `{journal}`: CSV table of student notes (`note_ref`, `course`, `entry_date`, `content`).
```
Add extraction rule:
```text
- Resolve relative timing expressions (such as "next class", "in 2 days", or "tomorrow") relative to the note's `entry_date`.
```

- [ ] **Step 2: Update `StudyPlannerEngine.java` to format `entry_date`**

In `StudyPlannerEngine.java`, format `note.getEntryDate()` as `YYYY-MM-DD` inside the journal CSV generator.

- [ ] **Step 3: Run unit tests**

Run: `./gradlew test --tests "group.four.nyare.nyare.ai.StudyPlannerEngineTest"`
Expected: PASS.

- [ ] **Step 4: Record affected files (no git commit)**

Record affected files:
- `src/main/resources/planner_sys-prompt.st`
- `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`

---

### Task 6: Implement Two-Phase Sequential Processing and SSE `init` Event

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- Modify: `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

**Interfaces:**
- Produces: `ProcessSummaryResponse processNotes(Long userId)`
- Emits: SSE `init` event before entity extraction

- [ ] **Step 1: Write failing service test for multi-day sequential processing**

In `StudyPlannerServiceImplTest.java`:
Write test verifying sequential day-by-day processing, cleanup of prior uncompleted entities for edited notes, and anchor of task recommendations to `LocalDate.now()`.

- [ ] **Step 2: Run test to verify failure**

Run: `./gradlew test --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest"`
Expected: FAIL.

- [ ] **Step 3: Implement two-phase processing in `StudyPlannerServiceImpl.java`**

In `StudyPlannerServiceImpl.java`:
1. Retrieve dirty notes: `List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId)`.
   If empty, throw `BadRequestException("No journal notes found to process")`.
2. Group dirty notes into `SortedMap<LocalDate, List<Note>>`.
3. Loop through each date:
   - Delete previous uncompleted tasks, events, and contexts for `dateNotes`:
     `taskRepository.deleteByNoteInAndStatusNot(dateNotes, TaskStatus.COMPLETED);`
     `academicEventRepository.deleteByNoteIn(dateNotes);`
     `academicContextRepository.deleteByNoteIn(dateNotes);`
   - Retrieve current DB state.
   - Run AI extraction via `studyPlannerEngine.process(...)`.
   - Save extracted items.
   - Stamp `lastProcessedAt = Instant.now()` and save `dateNotes`.
4. Run planning pass anchored to `LocalDate.now()` for involved courses:
   - Generate tasks for academic events within 14 days.
   - Update `scheduledDate` and `duration` on open tasks.
5. Return aggregate `ProcessSummaryResponse`.

In `StudyPlannerController.java`:
Before virtual thread starts heavy AI extraction, emit `init` SSE event with dirty note metadata.

- [ ] **Step 4: Run tests to verify they pass**

Run: `./gradlew test --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest"`
Expected: PASS.

- [ ] **Step 5: Record affected files (no git commit)**

Record affected files:
- `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

---

### Task 7: Integration Verification for Backdated Note Editing & Processing

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`

**Interfaces:**
- Consumes: Complete HTTP endpoints `GET /api/study-planner/status` and `POST /api/study-planner/process`
- Produces: Verified end-to-end multi-day note processing with pre-flight status check

- [ ] **Step 1: Add integration tests in `StudyPlannerControllerIntegrationTest.java`**

1. Verify `GET /api/study-planner/status` accurately reports pending dirty note counts and dates before processing.
2. Verify `POST /api/study-planner/process` handles backdated note creation, edited note entity replacement, and sequential processing.

- [ ] **Step 2: Run static MCP verification**

Run `get_file_problems` on `StudyPlannerControllerIntegrationTest.java`. Verify 0 errors.

- [ ] **Step 3: Request user approval before executing the single integration test**
*(Rule: Always ask user before running integration tests)*

- [ ] **Step 4: Record affected files (no git commit)**

Record affected files:
- `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`

---

## Verification Plan

### Automated Tests
1. Compile check:
   `./gradlew compileJava`
2. Run targeted unit test suite:
   `./gradlew test --tests "group.four.nyare.nyare.model.NoteTest"`
   `./gradlew test --tests "group.four.nyare.nyare.service.NoteServiceImplTest"`
   `./gradlew test --tests "group.four.nyare.nyare.controller.NoteControllerTest"`
   `./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest"`
   `./gradlew test --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest"`
3. Targeted integration test (requires user permission before running):
   `./gradlew test --tests "group.four.nyare.nyare.controller.StudyPlannerControllerIntegrationTest.getStatus_withDirtyNotes_returnsPendingSummary"`

### Manual Verification
1. Create a backdated note with `entryDate = 2026-10-01` via `POST /api/notes`.
2. Attempt to create a note older than 14 days (e.g. `entryDate = 2026-09-01`); verify 400 Bad Request error.
3. Call `GET /api/study-planner/status`. Verify `hasPendingNotes: true`, `dirtyNoteCount: 1`, `dirtyDates: ["2026-10-01"]`.
4. Call `POST /api/study-planner/process`. Verify initial `init` event, `done` event, and database entities created.
5. Call `GET /api/study-planner/status` again. Verify `hasPendingNotes: false`, `dirtyNoteCount: 0`.
