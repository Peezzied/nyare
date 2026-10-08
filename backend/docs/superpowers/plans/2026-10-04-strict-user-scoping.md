# Strict User Scoping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce mandatory user scoping across repositories, services, controllers, and tests by removing all fallback method overloads that omit user identification.

**Architecture:** Refactor JPA queries to require `course.user.id = :userId`. Update service contracts and implementations to mandate `userId`. Update controllers and test suites to supply the user context.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring Data JPA, Hibernate, SQLite, JUnit 5, Mockito, MockMvc.

**Spec:** Mandatory user scoping across Nyare backend domain operations.

## Global Constraints

- Use ASD-STE100 rules for all documentation and comments.
- Keep description sentences under 25 words.
- Keep instruction sentences under 20 words.
- Do not use semicolons.
- Do not execute git commit commands during task execution.

---

### Task 1: Strict Repositories and Multi-User Isolation Tests

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java`
- Modify: `src/test/java/group/four/nyare/nyare/repository/TaskRepositoryTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`
- Create: `src/test/java/group/four/nyare/nyare/repository/ScheduleRepositoryTest.java`
- Create: `src/test/java/group/four/nyare/nyare/repository/AcademicEventRepositoryTest.java`

**Interfaces:**
- Consumes: `User`, `Course`, `Task`, `Note`, `Schedule`, `AcademicEvent` entities.
- Produces: Strict user-scoped repository methods `findAllFiltered(@Param("userId") Long userId, ...)` and `findDirtyNotes(@Param("userId") Long userId, ...)`.

- [ ] **Step 1: Update repository interfaces to require mandatory userId in JPQL**

Replace `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java` content:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for task entities with mandatory user scoping.
 */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Retrieves all tasks matching user ID and optional course, status, and scheduled filters.
     *
     * @param userId    mandatory user identifier
     * @param courseId  optional course identifier
     * @param status    optional task status
     * @param scheduled optional scheduling filter
     * @return list of matching tasks ordered by creation date descending
     */
    @Query("""
            SELECT t FROM Task t
            WHERE t.course.user.id = :userId
              AND (:courseId IS NULL OR t.course.id = :courseId)
              AND (:status IS NULL OR t.status = :status)
              AND (:scheduled IS NULL
                   OR (:scheduled = true AND t.scheduledDate IS NOT NULL)
                   OR (:scheduled = false AND t.scheduledDate IS NULL))
            ORDER BY t.createdAt DESC
            """)
    List<Task> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("status") TaskStatus status,
            @Param("scheduled") Boolean scheduled
    );
}
```

Replace `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java` content:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for note entities with mandatory user scoping.
 */
public interface NoteRepository extends JpaRepository<Note, UUID> {

    /**
     * Returns notes matching mandatory user ID and optional course ID.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @return matching notes ordered newest first
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND (:courseId IS NULL OR n.course.id = :courseId)
            ORDER BY n.createdAt DESC
            """)
    List<Note> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );

    /**
     * Returns dirty notes for a user within a timestamp boundary.
     *
     * @param userId     mandatory user identifier
     * @param startOfDay start of time window
     * @param endOfDay   end of time window
     * @return dirty notes matching criteria
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND n.createdAt >= :startOfDay
              AND n.createdAt < :endOfDay
              AND (n.lastProcessedAt IS NULL OR n.updatedAt > n.lastProcessedAt)
            """)
    List<Note> findDirtyNotes(
            @Param("userId") Long userId,
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay
    );

    /**
     * Helper method to query dirty notes for a date and user.
     *
     * @param userId mandatory user identifier
     * @param date   calendar date
     * @return dirty notes matching criteria
     */
    default List<Note> findDirtyNotes(Long userId, LocalDate date) {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = date.atStartOfDay(zone).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(zone).toInstant();
        return findDirtyNotes(userId, startOfDay, endOfDay);
    }
}
```

Replace `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java` content:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Spring Data JPA repository for schedule entities with mandatory user scoping.
 */
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Retrieves schedules matching mandatory user ID and optional course ID.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @return matching schedules ordered chronologically
     */
    @Query("""
            SELECT s FROM Schedule s
            WHERE s.course.user.id = :userId
              AND (:courseId IS NULL OR s.course.id = :courseId)
            ORDER BY s.day ASC, s.startTime ASC
            """)
    List<Schedule> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );
}
```

Replace `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java` content:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for academic event entities with mandatory user scoping.
 */
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, UUID> {

    /**
     * Retrieves events matching user ID and optional course and upcoming filters.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @param upcoming optional upcoming filter flag
     * @param now      current timestamp boundary
     * @return list of matching events ordered by deadline ascending
     */
    @Query("""
            SELECT e FROM AcademicEvent e
            WHERE e.course.user.id = :userId
              AND (:courseId IS NULL OR e.course.id = :courseId)
              AND (:upcoming IS NULL
                   OR (:upcoming = true AND e.deadline >= :now))
            ORDER BY e.deadline ASC
            """)
    List<AcademicEvent> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("upcoming") Boolean upcoming,
            @Param("now") LocalDateTime now
    );
}
```

- [ ] **Step 2: Update repository tests to verify multi-user isolation**

Replace `src/test/java/group/four/nyare/nyare/repository/TaskRepositoryTest.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.model.enums.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
    }

    @Test
    @DisplayName("findAllFiltered scopes results to user identifier")
    void findAllFiltered_scopesToUser() {
        Course c1 = courseRepository.save(new Course("CS101", "Intro", user1));
        Course c2 = courseRepository.save(new Course("CS202", "Advanced", user2));

        Task t1 = taskRepository.save(new Task(c1, "Task for User 1"));
        Task t2 = taskRepository.save(new Task(c2, "Task for User 2"));

        List<Task> user1Tasks = taskRepository.findAllFiltered(user1.getId(), null, null, null);
        List<Task> user2Tasks = taskRepository.findAllFiltered(user2.getId(), null, null, null);

        assertThat(user1Tasks).extracting(Task::getId).containsExactly(t1.getId());
        assertThat(user2Tasks).extracting(Task::getId).containsExactly(t2.getId());
    }
}
```

Replace `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class NoteRepositoryTest {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
    }

    @Test
    @DisplayName("findDirtyNotes filters clean notes and scopes to user")
    void findDirtyNotes_filtersCleanNotesAndScopesToUser() {
        Course c1 = courseRepository.save(new Course("CS101", "Intro to CS", user1));
        Course c2 = courseRepository.save(new Course("CS202", "Data Structures", user2));

        Note note1 = noteRepository.save(new Note(c1, "User 1 dirty note"));
        Note note2 = noteRepository.save(new Note(c2, "User 2 dirty note"));

        Note cleanNote = new Note(c1, "User 1 clean note");
        cleanNote.setLastProcessedAt(Instant.now().plusSeconds(60));
        noteRepository.save(cleanNote);

        List<Note> dirtyNotesUser1 = noteRepository.findDirtyNotes(user1.getId(), LocalDate.now());
        List<Note> dirtyNotesUser2 = noteRepository.findDirtyNotes(user2.getId(), LocalDate.now());

        assertThat(dirtyNotesUser1).extracting(Note::getId).containsExactly(note1.getId());
        assertThat(dirtyNotesUser2).extracting(Note::getId).containsExactly(note2.getId());
    }

    @Test
    @DisplayName("findAllFiltered scopes note listing to user")
    void findAllFiltered_scopesToUser() {
        Course c1 = courseRepository.save(new Course("CS101", "Intro to CS", user1));
        Course c2 = courseRepository.save(new Course("CS202", "Data Structures", user2));

        Note note1 = noteRepository.save(new Note(c1, "User 1 note"));
        Note note2 = noteRepository.save(new Note(c2, "User 2 note"));

        List<Note> notes1 = noteRepository.findAllFiltered(user1.getId(), null);
        List<Note> notes2 = noteRepository.findAllFiltered(user2.getId(), null);

        assertThat(notes1).extracting(Note::getId).containsExactly(note1.getId());
        assertThat(notes2).extracting(Note::getId).containsExactly(note2.getId());
    }
}
```

Create `src/test/java/group/four/nyare/nyare/repository/ScheduleRepositoryTest.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class ScheduleRepositoryTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
    }

    @Test
    @DisplayName("findAllFiltered scopes schedules to user")
    void findAllFiltered_scopesToUser() {
        Course c1 = courseRepository.save(new Course("CS101", "Intro", user1));
        Course c2 = courseRepository.save(new Course("CS202", "Advanced", user2));

        Schedule s1 = scheduleRepository.save(new Schedule(c1, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 0)));
        Schedule s2 = scheduleRepository.save(new Schedule(c2, DayOfWeek.TUESDAY, LocalTime.of(10, 0), LocalTime.of(11, 0)));

        List<Schedule> user1Schedules = scheduleRepository.findAllFiltered(user1.getId(), null);
        List<Schedule> user2Schedules = scheduleRepository.findAllFiltered(user2.getId(), null);

        assertThat(user1Schedules).extracting(Schedule::getId).containsExactly(s1.getId());
        assertThat(user2Schedules).extracting(Schedule::getId).containsExactly(s2.getId());
    }
}
```

Create `src/test/java/group/four/nyare/nyare/repository/AcademicEventRepositoryTest.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class AcademicEventRepositoryTest {

    @Autowired
    private AcademicEventRepository academicEventRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
    }

    @Test
    @DisplayName("findAllFiltered scopes events to user")
    void findAllFiltered_scopesToUser() {
        Course c1 = courseRepository.save(new Course("CS101", "Intro", user1));
        Course c2 = courseRepository.save(new Course("CS202", "Advanced", user2));

        AcademicEvent e1 = academicEventRepository.save(new AcademicEvent(c1, null, "Quiz 1", "Desc", LocalDateTime.now().plusDays(1)));
        AcademicEvent e2 = academicEventRepository.save(new AcademicEvent(c2, null, "Quiz 2", "Desc", LocalDateTime.now().plusDays(2)));

        List<AcademicEvent> user1Events = academicEventRepository.findAllFiltered(user1.getId(), null, null, null);
        List<AcademicEvent> user2Events = academicEventRepository.findAllFiltered(user2.getId(), null, null, null);

        assertThat(user1Events).extracting(AcademicEvent::getId).containsExactly(e1.getId());
        assertThat(user2Events).extracting(AcademicEvent::getId).containsExactly(e2.getId());
    }
}
```

- [ ] **Step 3: Run repository tests**

Run: `./gradlew test --tests group.four.nyare.nyare.repository.TaskRepositoryTest --tests group.four.nyare.nyare.repository.NoteRepositoryTest --tests group.four.nyare.nyare.repository.ScheduleRepositoryTest --tests group.four.nyare.nyare.repository.AcademicEventRepositoryTest`
Expected: PASS

---

### Task 2: Strict Services and Service Unit Tests

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/service/TaskService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/TaskServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/NoteService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/ScheduleService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/AcademicEventService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/AcademicEventServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- Modify: `src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`
- Create: `src/test/java/group/four/nyare/nyare/service/TaskServiceImplTest.java`
- Create: `src/test/java/group/four/nyare/nyare/service/ScheduleServiceImplTest.java`
- Create: `src/test/java/group/four/nyare/nyare/service/AcademicEventServiceImplTest.java`

**Interfaces:**
- Consumes: Strict repositories from Task 1.
- Produces: Service methods that mandate `Long userId`.

- [ ] **Step 1: Update service contracts to remove overloads without userId**

Update `src/main/java/group/four/nyare/nyare/service/TaskService.java`:
Remove `default List<TaskResponse> listTasks(Long courseId, TaskStatus status, Boolean scheduled)`. Retain single definition:
```java
List<TaskResponse> listTasks(Long userId, Long courseId, TaskStatus status, Boolean scheduled);
```

Update `src/main/java/group/four/nyare/nyare/service/NoteService.java`:
Remove `default List<NoteSummaryResponse> listNotes(Long courseId)`. Retain single definition:
```java
List<NoteSummaryResponse> listNotes(Long userId, Long courseId);
```

Update `src/main/java/group/four/nyare/nyare/service/ScheduleService.java`:
Remove `default List<ScheduleResponse> listSchedules(Long courseId, DayOfWeek day)`. Retain single definition:
```java
List<ScheduleResponse> listSchedules(Long userId, Long courseId, DayOfWeek day);
```

Update `src/main/java/group/four/nyare/nyare/service/AcademicEventService.java`:
Remove `default List<AcademicEventResponse> listEvents(Long courseId, Boolean upcoming)`. Retain single definition:
```java
List<AcademicEventResponse> listEvents(Long userId, Long courseId, Boolean upcoming);
```

Update `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`:
Remove `default ProcessSummaryResponse processNotes(LocalDate date)`. Retain single definition:
```java
ProcessSummaryResponse processNotes(LocalDate date, Long userId);
```

- [ ] **Step 2: Update service implementations**

Update `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`:
In `processNotes(LocalDate date, Long userId)`:
```java
@Override
@Transactional
public ProcessSummaryResponse processNotes(LocalDate date, Long userId) {
    if (userId == null) {
        throw new BadRequestException("User identifier is required for processing");
    }

    List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId, date);

    if (dirtyNotes.isEmpty()) {
        throw new BadRequestException("No journal notes found for " + date + " to process");
    }

    Set<Long> dirtyCourseIds = dirtyNotes.stream()
            .filter(n -> n.getCourse() != null && n.getCourse().getId() != null)
            .map(n -> n.getCourse().getId())
            .collect(Collectors.toSet());

    Map<UUID, List<Image>> noteImages = processAndPersistNoteImages(dirtyNotes);

    List<Task> existingTasks = taskRepository.findAllFiltered(userId, null, null, null).stream()
            .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
            .toList();
    List<AcademicEvent> existingEvents =
            academicEventRepository.findAllFiltered(userId, null, true, LocalDateTime.now());
    List<AcademicContext> existingContexts =
            academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(dirtyCourseIds);
    List<Schedule> schedules = scheduleRepository.findAllFiltered(userId, null);

    StudyPlannerEngine.ExtractedData extracted = studyPlannerEngine.process(
            dirtyNotes, existingTasks, existingEvents, existingContexts, schedules, noteImages);

    Map<UUID, Note> noteMap = dirtyNotes.stream()
            .filter(n -> n.getId() != null)
            .collect(Collectors.toMap(Note::getId, n -> n, (a, b) -> a));

    Map<UUID, Task> taskMap = existingTasks.stream()
            .filter(t -> t.getId() != null)
            .collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));

    List<Task> tasksToSave = new ArrayList<>();
    for (StudyPlannerEngine.ExtractedTask item : extracted.tasks()) {
        if (item.title() == null || item.title().isBlank()) {
            continue;
        }
        if (item.isPromotion()) {
            Task existing = item.taskId() != null ? taskMap.get(item.taskId()) : null;
            if (existing != null) {
                existing.setScheduledDate(item.scheduledDate());
                if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                    existing.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
                }
                tasksToSave.add(existing);
            }
        } else {
            Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
            Course course = note != null ? note.getCourse() : null;
            if (course == null) continue;
            Task task = new Task(course, item.title());
            task.setNote(note);
            task.setDescription(item.description());
            task.setScheduledDate(item.scheduledDate());
            if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                task.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
            }
            tasksToSave.add(task);
        }
    }

    List<AcademicEvent> eventsToSave = new ArrayList<>();
    for (StudyPlannerEngine.ExtractedEvent item : extracted.events()) {
        if (item.title() == null || item.title().isBlank() || item.deadline() == null) {
            continue;
        }
        Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
        Course course = note != null ? note.getCourse() : null;
        if (course == null) continue;
        eventsToSave.add(new AcademicEvent(course, note, item.title(), item.description(), item.deadline()));
    }

    List<AcademicContext> contextsToSave = new ArrayList<>();
    for (StudyPlannerEngine.ExtractedContext item : extracted.contexts()) {
        if (item.value() == null || item.value().isBlank()) {
            continue;
        }
        Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
        Course course = note != null ? note.getCourse() : null;
        if (course == null) continue;
        contextsToSave.add(new AcademicContext(course, note, item.value()));
    }

    long newTaskCount = tasksToSave.stream().filter(t -> t.getId() == null).count();

    taskRepository.saveAll(tasksToSave);
    academicEventRepository.saveAll(eventsToSave);
    academicContextRepository.saveAll(contextsToSave);

    Instant processedAt = Instant.now().plusSeconds(1);
    dirtyNotes.forEach(n -> n.setLastProcessedAt(processedAt));
    noteRepository.saveAll(dirtyNotes);

    return new ProcessSummaryResponse((int) newTaskCount, eventsToSave.size(), contextsToSave.size());
}
```

Remove `processNotes(LocalDate date)` from `StudyPlannerServiceImpl.java`.

- [ ] **Step 3: Update and create unit tests for service layer**

Update `src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`:
Update all `noteService.listNotes(...)` calls to include `userId` as first argument (e.g. `10L`).

Update `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`:
Update all `service.processNotes(DATE, 42L)` calls and mocked repository calls to use `42L`. Add a test verifying `service.processNotes(DATE, null)` throws `BadRequestException`.

Create `src/test/java/group/four/nyare/nyare/service/TaskServiceImplTest.java`:
```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private TaskServiceImpl taskService;

    @Test
    void listTasks_passesUserIdAndFiltersToRepository() {
        Course course = new Course("CS101", "Intro");
        Task task = new Task(course, "Homework 1");
        when(taskRepository.findAllFiltered(1L, 2L, TaskStatus.TODO, true)).thenReturn(List.of(task));

        List<TaskResponse> responses = taskService.listTasks(1L, 2L, TaskStatus.TODO, true);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Homework 1");
        verify(taskRepository).findAllFiltered(1L, 2L, TaskStatus.TODO, true);
    }
}
```

Create `src/test/java/group/four/nyare/nyare/service/ScheduleServiceImplTest.java`:
```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.service.impl.ScheduleServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceImplTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @Test
    void listSchedules_passesUserIdAndFilters() {
        Course course = new Course("CS101", "Intro");
        Schedule schedule = new Schedule(course, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 0));
        when(scheduleRepository.findAllFiltered(1L, 2L)).thenReturn(List.of(schedule));

        List<ScheduleResponse> responses = scheduleService.listSchedules(1L, 2L, DayOfWeek.MONDAY);

        assertThat(responses).hasSize(1);
        verify(scheduleRepository).findAllFiltered(1L, 2L);
    }
}
```

Create `src/test/java/group/four/nyare/nyare/service/AcademicEventServiceImplTest.java`:
```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.impl.AcademicEventServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicEventServiceImplTest {

    @Mock
    private AcademicEventRepository academicEventRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private NoteRepository noteRepository;

    @InjectMocks
    private AcademicEventServiceImpl academicEventService;

    @Test
    void listEvents_passesUserIdAndFilters() {
        Course course = new Course("CS101", "Intro");
        AcademicEvent event = new AcademicEvent(course, null, "Quiz 1", "Desc", LocalDateTime.now().plusDays(1));
        when(academicEventRepository.findAllFiltered(eq(1L), eq(2L), eq(true), any())).thenReturn(List.of(event));

        List<AcademicEventResponse> responses = academicEventService.listEvents(1L, 2L, true);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Quiz 1");
        verify(academicEventRepository).findAllFiltered(eq(1L), eq(2L), eq(true), any());
    }
}
```

- [ ] **Step 4: Run service tests**

Run: `./gradlew test --tests group.four.nyare.nyare.service.*`
Expected: PASS

---

### Task 3: Strict Controllers and Controller Slice Tests

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/controller/TaskController.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/NoteController.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/ScheduleController.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/AcademicEventController.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/TaskControllerTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/ScheduleControllerTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/AcademicEventControllerTest.java`

**Interfaces:**
- Consumes: Strict service interfaces from Task 2 and `SessionContext`.
- Produces: HTTP endpoints routing `sessionContext.getUserId()` to services.

- [ ] **Step 1: Verify controllers resolve session user and pass to service**

Ensure all controllers extract `sessionContext.getUserId().orElse(null)` and invoke service methods with the user ID.

- [ ] **Step 2: Update controller slice tests**

Update `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`:
Update `listNotes_withCourseId_returns200AndList` and `listNotes_withoutCourseId_returns200AndList` to mock `sessionContext.getUserId()` returning `Optional.of(1L)` and verify `noteService.listNotes(1L, courseId)`.

Update `src/test/java/group/four/nyare/nyare/controller/TaskControllerTest.java`:
Verify `taskService.listTasks(42L, null, null, null)` on `listTasks_withSessionUser_passesUserIdToService`.

Update `src/test/java/group/four/nyare/nyare/controller/ScheduleControllerTest.java`:
Verify `scheduleService.listSchedules(42L, null, null)`.

Update `src/test/java/group/four/nyare/nyare/controller/AcademicEventControllerTest.java`:
Verify `academicEventService.listEvents(42L, null, null)`.

- [ ] **Step 3: Run controller slice tests**

Run: `./gradlew test --tests group.four.nyare.nyare.controller.TaskControllerTest --tests group.four.nyare.nyare.controller.NoteControllerTest --tests group.four.nyare.nyare.controller.ScheduleControllerTest --tests group.four.nyare.nyare.controller.AcademicEventControllerTest`
Expected: PASS

---

### Task 4: Cascade to Integration Tests and Full Suite Verification

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/FullStudyPlannerEngineIntegrationTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/ImageAiProcessorIntegrationTest.java`

**Interfaces:**
- Consumes: Complete strictly-scoped stack.
- Produces: Fully verified integration test suite.

- [ ] **Step 1: Update StudyPlannerControllerIntegrationTest with session cookie**

Update `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`:
Pass `sessionAttr("NYARE_USER_ID", testUser.getId())` to `mockMvc.perform(post("/api/study-planner/process").sessionAttr("NYARE_USER_ID", testUser.getId()))`.

Update verification to call `noteRepository.findDirtyNotes(testUser.getId(), LocalDate.now())` and `taskRepository.findAllFiltered(testUser.getId(), null, null, null)`.

- [ ] **Step 2: Update FullStudyPlannerEngineIntegrationTest and ImageAiProcessorIntegrationTest**

In `src/test/java/group/four/nyare/nyare/ai/FullStudyPlannerEngineIntegrationTest.java`:
- Add `UserRepository userRepository` injection and clean `userRepository.deleteAll()` in `@BeforeEach`.
- In `seedCourses(User user)`: pass the seeded `user` to all `Course` entities.
- In `serviceProcessesNotesEndToEndWithImages`: seed a `User user = userRepository.save(new User("full_planner_user"))`, seed courses with `user`, and call `studyPlannerService.processNotes(LocalDate.now(), user.getId())`.

In `src/test/java/group/four/nyare/nyare/ai/ImageAiProcessorIntegrationTest.java`:
- In `processNotes_endToEnd_updatesImageMetadataAndExtractsPlan`: update line 115 from `studyPlannerService.processNotes(today)` to `studyPlannerService.processNotes(today, user.getId())`.

- [ ] **Step 3: Run targeted integration tests one at a time**

Run: `./gradlew test --tests group.four.nyare.nyare.ai.ImageAiProcessorIntegrationTest.verifyImageAiProcessorBeanLoads`
Expected: PASS

Run: `./gradlew test --tests group.four.nyare.nyare.controller.StudyPlannerControllerIntegrationTest.process_withNoDirtyNotes_emitsSseErrorEvent400`
Expected: PASS

- [ ] **Step 4: Run full test suite verification**

Run: `./gradlew testClasses` and final suite verification.
Expected: All tests pass.
