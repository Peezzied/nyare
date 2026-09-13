# Task Manager Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full CRUD REST API for `Task` management in the Nyare backend, with filtered listing by course, status, and scheduled state.

**Architecture:** The service follows a strict 3-layer architecture — `Controller` → `Service` → `Repository` — with a `DTOs` package holding immutable Java records for request and response shapes. Entity objects never escape the service layer; the controller sends and receives only DTOs. Course existence is validated in the service before any write.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring MVC (`@RestController`), Spring Data JPA (`JpaRepository`), Jakarta Bean Validation, SQLite (via `sqlite-jdbc` + `hibernate-community-dialects`), JUnit 5, `@WebMvcTest`, `@DataJpaTest`.

**Spec:** `D:\General Project Bins\Academics\CCS201\nyare\AGENTS.md` and `D:\General Project Bins\Academics\CCS201\nyare\backend\AGENTS.md`

## Global Constraints

- Java version: **25** (toolchain configured in `build.gradle.kts`)
- Spring Boot version: **4.1.1**
- Base package: `group.four.nyare.nyare`
- Persistence: SQLite via `org.xerial:sqlite-jdbc` + `org.hibernate.orm:hibernate-community-dialects`; `spring.datasource.hikari.maximum-pool-size=1`
- `spring.jpa.open-in-view=false` — lazy loading is prohibited outside transactions; all association access must happen inside `@Transactional` service methods
- IDs: `Long` for `Course`; `UUID` for `Task`, `Note`, `AcademicEvent`, `AcademicContext`
- Error contract: RFC 7807 Problem Details via Spring's built-in `ProblemDetail`; use `@ControllerAdvice` / `ResponseEntityExceptionHandler`
- Enum values: `TODO`, `IN_PROGRESS`, `COMPLETED` — stored as `STRING` in DB
- `StudyPlan` is **never** a persisted entity — do not create a table or entity for it
- Do not implement automatic task merging, splitting, reconciliation, or priority scoring
- Task `scheduledDate` (`LocalDate`) is nullable — `null` means "Later / unscheduled"
- `duration` is stored as a `Duration` (serialized by Hibernate as ISO-8601 string in SQLite)
- All timestamps use `Instant`; auditing is already enabled via `@EnableJpaAuditing` in `NyareApplication`
- Verification tier: IntelliJ MCP (`get_file_problems`) → `./gradlew compileJava` → `./gradlew test` (in that order; only escalate if the previous tier fails)

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/main/java/group/four/nyare/nyare/DTOs/TaskRequest.java` | Create | Immutable record for create/update request body |
| `src/main/java/group/four/nyare/nyare/DTOs/TaskStatusRequest.java` | Create | Immutable record for PATCH status-only request body |
| `src/main/java/group/four/nyare/nyare/DTOs/TaskResponse.java` | Create | Immutable record for all task API responses |
| `src/main/java/group/four/nyare/nyare/Repositories/TaskRepository.java` | Create | Spring Data JPA repository with filtered-list query |
| `src/main/java/group/four/nyare/nyare/Repositories/CourseRepository.java` | Create | Spring Data JPA repository for course existence checks |
| `src/main/java/group/four/nyare/nyare/Services/TaskService.java` | Create | Business logic: CRUD, validation, entity ↔ DTO mapping |
| `src/main/java/group/four/nyare/nyare/Controllers/TaskController.java` | Create | REST controller: 6 endpoints, delegates to `TaskService` |
| `src/main/java/group/four/nyare/nyare/Controllers/GlobalExceptionHandler.java` | Create | `@ControllerAdvice` mapping domain exceptions to Problem Details |
| `src/test/java/group/four/nyare/nyare/Repositories/TaskRepositoryTest.java` | Create | `@DataJpaTest` slice: filtered-list query, basic CRUD |
| `src/test/java/group/four/nyare/nyare/Services/TaskServiceTest.java` | Create | Unit tests with Mockito mocks for `TaskRepository` + `CourseRepository` |
| `src/test/java/group/four/nyare/nyare/Controllers/TaskControllerTest.java` | Create | `@WebMvcTest` slice: HTTP contract, status codes, JSON shape |

---

## Task 1: DTOs — Request and Response Records

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/DTOs/TaskRequest.java`
- Create: `src/main/java/group/four/nyare/nyare/DTOs/TaskStatusRequest.java`
- Create: `src/main/java/group/four/nyare/nyare/DTOs/TaskResponse.java`

**Interfaces:**
- Produces:
  - `TaskRequest(Long courseId, String title, String description, LocalDate scheduledDate, Duration duration, TaskStatus status)`
  - `TaskStatusRequest(TaskStatus status)`
  - `TaskResponse(UUID id, Long courseId, UUID noteId, String title, String description, LocalDate scheduledDate, Duration duration, TaskStatus status, Instant createdAt, Instant updatedAt)`

- [ ] **Step 1: Write `TaskRequest.java`**

```java
package group.four.nyare.nyare.DTOs;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Duration;
import java.time.LocalDate;

/**
 * Request body for creating or fully updating a Task.
 * {@code scheduledDate} and {@code duration} are optional (null means "Later").
 */
public record TaskRequest(
        @NotNull(message = "Course ID is required")
        Long courseId,

        @NotBlank(message = "Task title is required")
        @Size(max = 255, message = "Task title cannot exceed 255 characters")
        String title,

        @Size(max = 2048, message = "Task description cannot exceed 2048 characters")
        String description,

        LocalDate scheduledDate,

        Duration duration,

        TaskStatus status
) {
}
```

- [ ] **Step 2: Write `TaskStatusRequest.java`**

```java
package group.four.nyare.nyare.DTOs;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for the PATCH status endpoint.
 * Only carries the new status value.
 */
public record TaskStatusRequest(
        @NotNull(message = "Status is required")
        TaskStatus status
) {
}
```

- [ ] **Step 3: Write `TaskResponse.java`**

```java
package group.four.nyare.nyare.DTOs;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response shape for all Task API endpoints.
 * Exposes {@code courseId} inline and {@code noteId} as nullable UUID.
 * The entity never escapes the service layer.
 */
public record TaskResponse(
        UUID id,
        Long courseId,
        UUID noteId,
        String title,
        String description,
        LocalDate scheduledDate,
        Duration duration,
        TaskStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Factory method to build a {@code TaskResponse} from a fully loaded {@link Task}.
     * Must be called inside a transaction to allow lazy-association access.
     *
     * @param task a managed {@link Task} entity
     * @return the corresponding response record
     */
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getCourse().getId(),
                task.getNote() != null ? task.getNote().getId() : null,
                task.getTitle(),
                task.getDescription(),
                task.getScheduledDate(),
                task.getDuration(),
                task.getStatus(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }
}
```

- [ ] **Step 4: Verify with IntelliJ MCP diagnostics**

Open IntelliJ MCP → `get_file_problems` on each of the three new files.  
Expected: zero errors.

If MCP is unavailable: `./gradlew compileJava -q`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/DTOs/
git commit -m "feat(tasks): add TaskRequest, TaskStatusRequest, and TaskResponse DTOs"
```

---

## Task 2: Repositories — TaskRepository and CourseRepository

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/Repositories/TaskRepository.java`
- Create: `src/main/java/group/four/nyare/nyare/Repositories/CourseRepository.java`
- Test: `src/test/java/group/four/nyare/nyare/Repositories/TaskRepositoryTest.java`

**Interfaces:**
- Consumes: `Task` (from `group.four.nyare.nyare.Models`), `Course` (from `group.four.nyare.nyare.Models`)
- Produces:
  - `TaskRepository.findAllFiltered(Long courseId, TaskStatus status, Boolean scheduled)` → `List<Task>`
  - `CourseRepository.findById(Long id)` → `Optional<Course>` (inherited from `JpaRepository`)

- [ ] **Step 1: Write the failing repository test**

```java
package group.four.nyare.nyare.Repositories;

import group.four.nyare.nyare.Models.Course;
import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class TaskRepositoryTest {

    @Autowired
    private TestEntityManager em;

    @Autowired
    private TaskRepository taskRepository;

    private Course course;

    @BeforeEach
    void setUp() {
        course = em.persist(new Course("Algorithms", "CS301"));
        em.flush();
    }

    @Test
    void findAllFiltered_byCourseId_returnsOnlyCoursesTasks() {
        Course other = em.persist(new Course("Calculus", null));
        Task t1 = em.persist(new Task(course, "Review sorting"));
        Task t2 = em.persist(new Task(other, "Derivatives"));
        em.flush();

        List<Task> result = taskRepository.findAllFiltered(course.getId(), null, null);

        assertThat(result).containsExactly(t1);
    }

    @Test
    void findAllFiltered_byStatus_returnsMatchingTasks() {
        Task todo = em.persist(new Task(course, "Pending task"));
        Task done = em.persist(new Task(course, "Done task"));
        done.setStatus(TaskStatus.COMPLETED);
        em.flush();

        List<Task> result = taskRepository.findAllFiltered(null, TaskStatus.TODO, null);

        assertThat(result).containsExactly(todo);
    }

    @Test
    void findAllFiltered_scheduledTrue_returnsTasksWithDate() {
        Task scheduled = em.persist(new Task(course, "Has date", LocalDate.now().plusDays(1), null));
        Task unscheduled = em.persist(new Task(course, "No date"));
        em.flush();

        List<Task> result = taskRepository.findAllFiltered(null, null, true);

        assertThat(result).containsExactly(scheduled);
    }

    @Test
    void findAllFiltered_scheduledFalse_returnsTasksWithoutDate() {
        Task scheduled = em.persist(new Task(course, "Has date", LocalDate.now().plusDays(1), null));
        Task unscheduled = em.persist(new Task(course, "No date"));
        em.flush();

        List<Task> result = taskRepository.findAllFiltered(null, null, false);

        assertThat(result).containsExactly(unscheduled);
    }

    @Test
    void findAllFiltered_noFilters_returnsAllTasks() {
        Task t1 = em.persist(new Task(course, "Task one"));
        Task t2 = em.persist(new Task(course, "Task two"));
        em.flush();

        List<Task> result = taskRepository.findAllFiltered(null, null, null);

        assertThat(result).containsExactlyInAnyOrder(t1, t2);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```
./gradlew test --tests "group.four.nyare.nyare.Repositories.TaskRepositoryTest" -q
```

Expected: FAIL — `TaskRepository` does not exist yet.

- [ ] **Step 3: Write `CourseRepository.java`**

```java
package group.four.nyare.nyare.Repositories;

import group.four.nyare.nyare.Models.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for {@link Course}.
 * Used by services to validate course existence before task writes.
 */
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {
}
```

- [ ] **Step 4: Write `TaskRepository.java`**

```java
package group.four.nyare.nyare.Repositories;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link Task}.
 * Supports optional filtering by courseId, status, and scheduled state.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Returns tasks matching all supplied non-null filters.
     * Null parameters are ignored (no filter applied for that dimension).
     *
     * @param courseId  optional course ID; null means all courses
     * @param status    optional task status; null means all statuses
     * @param scheduled {@code true} = only tasks with a date,
     *                  {@code false} = only tasks without a date,
     *                  {@code null} = no filter on date presence
     */
    @Query("""
            SELECT t FROM Task t
            WHERE (:courseId IS NULL OR t.course.id = :courseId)
              AND (:status IS NULL OR t.status = :status)
              AND (:scheduled IS NULL
                   OR (:scheduled = true AND t.scheduledDate IS NOT NULL)
                   OR (:scheduled = false AND t.scheduledDate IS NULL))
            ORDER BY t.createdAt DESC
            """)
    List<Task> findAllFiltered(
            @Param("courseId") Long courseId,
            @Param("status") TaskStatus status,
            @Param("scheduled") Boolean scheduled
    );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```
./gradlew test --tests "group.four.nyare.nyare.Repositories.TaskRepositoryTest" -q
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/Repositories/
git add src/test/java/group/four/nyare/nyare/Repositories/
git commit -m "feat(tasks): add TaskRepository with filtered query and CourseRepository"
```

---

## Task 3: Service Layer — TaskService

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/Services/TaskService.java`
- Test: `src/test/java/group/four/nyare/nyare/Services/TaskServiceTest.java`

**Interfaces:**
- Consumes:
  - `TaskRepository.findAllFiltered(Long, TaskStatus, Boolean)` → `List<Task>`
  - `TaskRepository.findById(UUID)` → `Optional<Task>`
  - `TaskRepository.save(Task)` → `Task`
  - `TaskRepository.delete(Task)` → `void`
  - `CourseRepository.findById(Long)` → `Optional<Course>`
  - `TaskRequest(Long courseId, String title, String description, LocalDate scheduledDate, Duration duration, TaskStatus status)`
  - `TaskStatusRequest(TaskStatus status)`
- Produces:
  - `TaskService.createTask(TaskRequest)` → `TaskResponse`
  - `TaskService.listTasks(Long courseId, TaskStatus status, Boolean scheduled)` → `List<TaskResponse>`
  - `TaskService.getTask(UUID id)` → `TaskResponse`
  - `TaskService.updateTask(UUID id, TaskRequest request)` → `TaskResponse`
  - `TaskService.updateTaskStatus(UUID id, TaskStatusRequest request)` → `TaskResponse`
  - `TaskService.deleteTask(UUID id)` → `void`
  - Throws `ResourceNotFoundException(String message)` when a task or course is not found (a plain `RuntimeException` subclass; the handler in Task 4 maps it to 404)

- [ ] **Step 1: Write the failing service unit tests**

```java
package group.four.nyare.nyare.Services;

import group.four.nyare.nyare.DTOs.TaskRequest;
import group.four.nyare.nyare.DTOs.TaskResponse;
import group.four.nyare.nyare.DTOs.TaskStatusRequest;
import group.four.nyare.nyare.Models.Course;
import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;
import group.four.nyare.nyare.Repositories.CourseRepository;
import group.four.nyare.nyare.Repositories.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private TaskService taskService;

    private Course course;
    private Task task;

    @BeforeEach
    void setUp() {
        course = new Course("Algorithms", "CS301");
        // Simulate persisted course with id=1
        try {
            var idField = Course.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(course, 1L);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        task = new Task(course, "Review quicksort");
    }

    @Test
    void createTask_withValidCourse_returnsTaskResponse() {
        TaskRequest req = new TaskRequest(1L, "Review quicksort", null, null, null, null);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.createTask(req);

        assertThat(response.title()).isEqualTo("Review quicksort");
        assertThat(response.courseId()).isEqualTo(1L);
        assertThat(response.status()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    void createTask_withUnknownCourse_throwsResourceNotFoundException() {
        TaskRequest req = new TaskRequest(99L, "Task", null, null, null, null);
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.createTask(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void listTasks_delegatesToRepository() {
        when(taskRepository.findAllFiltered(1L, TaskStatus.TODO, true))
                .thenReturn(List.of(task));

        List<TaskResponse> result = taskService.listTasks(1L, TaskStatus.TODO, true);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Review quicksort");
        verify(taskRepository).findAllFiltered(1L, TaskStatus.TODO, true);
    }

    @Test
    void getTask_withExistingId_returnsTaskResponse() {
        UUID id = UUID.randomUUID();
        when(taskRepository.findById(id)).thenReturn(Optional.of(task));

        TaskResponse response = taskService.getTask(id);

        assertThat(response.title()).isEqualTo("Review quicksort");
    }

    @Test
    void getTask_withUnknownId_throwsResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(taskRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTask(id))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(id.toString());
    }

    @Test
    void updateTask_withValidData_updatesAndReturnsResponse() {
        UUID id = UUID.randomUUID();
        TaskRequest req = new TaskRequest(1L, "Updated title", "desc", LocalDate.now(), Duration.ofHours(2), TaskStatus.IN_PROGRESS);
        when(taskRepository.findById(id)).thenReturn(Optional.of(task));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.updateTask(id, req);

        verify(taskRepository).save(task);
    }

    @Test
    void updateTaskStatus_setsNewStatus() {
        UUID id = UUID.randomUUID();
        TaskStatusRequest req = new TaskStatusRequest(TaskStatus.COMPLETED);
        when(taskRepository.findById(id)).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.updateTaskStatus(id, req);

        verify(taskRepository).save(task);
        assertThat(task.getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    void deleteTask_withExistingId_deletesEntity() {
        UUID id = UUID.randomUUID();
        when(taskRepository.findById(id)).thenReturn(Optional.of(task));

        taskService.deleteTask(id);

        verify(taskRepository).delete(task);
    }

    @Test
    void deleteTask_withUnknownId_throwsResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(taskRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.deleteTask(id))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
```

- [ ] **Step 2: Run the test to verify it fails**

```
./gradlew test --tests "group.four.nyare.nyare.Services.TaskServiceTest" -q
```

Expected: FAIL — `TaskService` and `ResourceNotFoundException` do not exist yet.

- [ ] **Step 3: Write `ResourceNotFoundException.java`**

This is a plain unchecked exception. Place it at `group.four.nyare.nyare.Services.ResourceNotFoundException` so it lives alongside the service that uses it.

```java
package group.four.nyare.nyare.Services;

/**
 * Thrown when a requested resource (Task, Course, etc.) cannot be found.
 * Mapped to HTTP 404 Not Found by {@link group.four.nyare.nyare.Controllers.GlobalExceptionHandler}.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

- [ ] **Step 4: Write `TaskService.java`**

```java
package group.four.nyare.nyare.Services;

import group.four.nyare.nyare.DTOs.TaskRequest;
import group.four.nyare.nyare.DTOs.TaskResponse;
import group.four.nyare.nyare.DTOs.TaskStatusRequest;
import group.four.nyare.nyare.Models.Course;
import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;
import group.four.nyare.nyare.Repositories.CourseRepository;
import group.four.nyare.nyare.Repositories.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Business logic for Task management.
 * All public methods run inside transactions to allow lazy-association access
 * (required because {@code spring.jpa.open-in-view=false}).
 */
@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final CourseRepository courseRepository;

    public TaskService(TaskRepository taskRepository, CourseRepository courseRepository) {
        this.taskRepository = taskRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Creates a new Task for the given course.
     *
     * @param request task creation payload
     * @return the persisted task as a {@link TaskResponse}
     * @throws ResourceNotFoundException if the course does not exist
     */
    public TaskResponse createTask(TaskRequest request) {
        Course course = findCourseOrThrow(request.courseId());

        Task task = new Task(course, request.title());
        task.setDescription(request.description());
        task.setScheduledDate(request.scheduledDate());
        task.setDuration(request.duration());
        if (request.status() != null) {
            task.setStatus(request.status());
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    /**
     * Lists tasks matching the supplied optional filters.
     * Any null filter parameter is ignored.
     *
     * @param courseId  optional course ID filter
     * @param status    optional status filter
     * @param scheduled {@code true} = scheduled only, {@code false} = unscheduled only, {@code null} = all
     * @return list of matching tasks as responses
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(Long courseId, TaskStatus status, Boolean scheduled) {
        return taskRepository.findAllFiltered(courseId, status, scheduled)
                .stream()
                .map(TaskResponse::from)
                .toList();
    }

    /**
     * Retrieves a single task by ID.
     *
     * @param id the task UUID
     * @return the task as a {@link TaskResponse}
     * @throws ResourceNotFoundException if no task with the given ID exists
     */
    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID id) {
        return TaskResponse.from(findTaskOrThrow(id));
    }

    /**
     * Fully replaces a task's mutable fields.
     * The course may be changed as part of an update.
     *
     * @param id      the task UUID
     * @param request replacement payload
     * @return the updated task as a {@link TaskResponse}
     * @throws ResourceNotFoundException if the task or new course does not exist
     */
    public TaskResponse updateTask(UUID id, TaskRequest request) {
        Task task = findTaskOrThrow(id);
        Course course = findCourseOrThrow(request.courseId());

        task.setCourse(course);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setScheduledDate(request.scheduledDate());
        task.setDuration(request.duration());
        if (request.status() != null) {
            task.setStatus(request.status());
        }

        return TaskResponse.from(taskRepository.save(task));
    }

    /**
     * Updates only the status of an existing task.
     *
     * @param id      the task UUID
     * @param request status-only payload
     * @return the updated task as a {@link TaskResponse}
     * @throws ResourceNotFoundException if no task with the given ID exists
     */
    public TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request) {
        Task task = findTaskOrThrow(id);
        task.setStatus(request.status());
        return TaskResponse.from(taskRepository.save(task));
    }

    /**
     * Deletes a task by ID.
     *
     * @param id the task UUID
     * @throws ResourceNotFoundException if no task with the given ID exists
     */
    public void deleteTask(UUID id) {
        Task task = findTaskOrThrow(id);
        taskRepository.delete(task);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private Task findTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Task not found with id: " + id));
    }

    private Course findCourseOrThrow(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found with id: " + courseId));
    }
}
```

- [ ] **Step 5: Run the service tests to verify they pass**

```
./gradlew test --tests "group.four.nyare.nyare.Services.TaskServiceTest" -q
```

Expected: all 8 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/Services/
git add src/test/java/group/four/nyare/nyare/Services/
git commit -m "feat(tasks): add TaskService and ResourceNotFoundException"
```

---

## Task 4: Exception Handler — GlobalExceptionHandler

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/Controllers/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: `ResourceNotFoundException` (from `group.four.nyare.nyare.Services`)
- Produces: HTTP 404 responses with RFC 7807 `ProblemDetail` body; HTTP 400 for validation failures (already handled by Spring's `ResponseEntityExceptionHandler` — we extend it)

> **Note:** Spring Boot 4.x / Spring Framework 7 ships `ResponseEntityExceptionHandler` which already handles `MethodArgumentNotValidException` (Bean Validation failures) as Problem Details when extended. We only add a handler for our custom `ResourceNotFoundException`.

- [ ] **Step 1: Write `GlobalExceptionHandler.java`**

There is no isolated unit test for this class — it is covered by the `@WebMvcTest` tests in Task 5 which exercise 404 and 400 paths end-to-end.

```java
package group.four.nyare.nyare.Controllers;

import group.four.nyare.nyare.Services.ResourceNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Translates domain exceptions into RFC 7807 Problem Details responses.
 * Extends {@link ResponseEntityExceptionHandler} to inherit Spring MVC's
 * built-in handling for validation errors ({@code MethodArgumentNotValidException}).
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    /**
     * Maps {@link ResourceNotFoundException} to HTTP 404 Not Found.
     *
     * @param ex the exception carrying the "not found" message
     * @return a Problem Detail body with status 404
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        return problem;
    }
}
```

- [ ] **Step 2: Verify with IntelliJ MCP diagnostics**

`get_file_problems` on `GlobalExceptionHandler.java`.  
Expected: zero errors.

If MCP unavailable: `./gradlew compileJava -q`  
Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/Controllers/GlobalExceptionHandler.java
git commit -m "feat(tasks): add GlobalExceptionHandler for RFC 7807 Problem Details"
```

---

## Task 5: REST Controller — TaskController

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/Controllers/TaskController.java`
- Test: `src/test/java/group/four/nyare/nyare/Controllers/TaskControllerTest.java`

**Interfaces:**
- Consumes:
  - `TaskService.createTask(TaskRequest)` → `TaskResponse`
  - `TaskService.listTasks(Long, TaskStatus, Boolean)` → `List<TaskResponse>`
  - `TaskService.getTask(UUID)` → `TaskResponse`
  - `TaskService.updateTask(UUID, TaskRequest)` → `TaskResponse`
  - `TaskService.updateTaskStatus(UUID, TaskStatusRequest)` → `TaskResponse`
  - `TaskService.deleteTask(UUID)` → `void`
- Produces: HTTP contract

| Method | Path | Success | Error |
|--------|------|---------|-------|
| `POST` | `/api/tasks` | `201 Created` | `400` on validation failure |
| `GET` | `/api/tasks` | `200 OK` | — |
| `GET` | `/api/tasks/{id}` | `200 OK` | `404` when not found |
| `PUT` | `/api/tasks/{id}` | `200 OK` | `404`, `400` |
| `PATCH` | `/api/tasks/{id}/status` | `200 OK` | `404`, `400` |
| `DELETE` | `/api/tasks/{id}` | `204 No Content` | `404` |

- [ ] **Step 1: Write the failing controller tests**

```java
package group.four.nyare.nyare.Controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import group.four.nyare.nyare.DTOs.TaskRequest;
import group.four.nyare.nyare.DTOs.TaskResponse;
import group.four.nyare.nyare.DTOs.TaskStatusRequest;
import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Services.ResourceNotFoundException;
import group.four.nyare.nyare.Services.TaskService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskService taskService;

    private TaskResponse sampleResponse() {
        return new TaskResponse(
                UUID.randomUUID(), 1L, null,
                "Review quicksort", null, null, null,
                TaskStatus.TODO, Instant.now(), Instant.now()
        );
    }

    @Test
    void postTask_validRequest_returns201() throws Exception {
        TaskRequest req = new TaskRequest(1L, "Review quicksort", null, null, null, null);
        when(taskService.createTask(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Review quicksort"))
                .andExpect(jsonPath("$.status").value("TODO"));
    }

    @Test
    void postTask_missingTitle_returns400() throws Exception {
        TaskRequest req = new TaskRequest(1L, "", null, null, null, null);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postTask_missingCourseId_returns400() throws Exception {
        TaskRequest req = new TaskRequest(null, "Title", null, null, null, null);

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getTasks_noFilters_returns200WithList() throws Exception {
        when(taskService.listTasks(null, null, null)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getTasks_withFilters_passesFiltersToService() throws Exception {
        when(taskService.listTasks(1L, TaskStatus.TODO, true)).thenReturn(List.of());

        mockMvc.perform(get("/api/tasks")
                        .param("courseId", "1")
                        .param("status", "TODO")
                        .param("scheduled", "true"))
                .andExpect(status().isOk());

        verify(taskService).listTasks(1L, TaskStatus.TODO, true);
    }

    @Test
    void getTask_existingId_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        when(taskService.getTask(id)).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Review quicksort"));
    }

    @Test
    void getTask_unknownId_returns404WithProblemDetail() throws Exception {
        UUID id = UUID.randomUUID();
        when(taskService.getTask(id)).thenThrow(new ResourceNotFoundException("Task not found with id: " + id));

        mockMvc.perform(get("/api/tasks/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.detail").value("Task not found with id: " + id));
    }

    @Test
    void putTask_validRequest_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        TaskRequest req = new TaskRequest(1L, "Updated title", null, null, null, TaskStatus.IN_PROGRESS);
        when(taskService.updateTask(eq(id), any())).thenReturn(sampleResponse());

        mockMvc.perform(put("/api/tasks/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void putTask_unknownId_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        TaskRequest req = new TaskRequest(1L, "Title", null, null, null, null);
        when(taskService.updateTask(eq(id), any())).thenThrow(new ResourceNotFoundException("Task not found with id: " + id));

        mockMvc.perform(put("/api/tasks/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void patchTaskStatus_validRequest_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        TaskStatusRequest req = new TaskStatusRequest(TaskStatus.COMPLETED);
        when(taskService.updateTaskStatus(eq(id), any())).thenReturn(sampleResponse());

        mockMvc.perform(patch("/api/tasks/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void patchTaskStatus_missingStatus_returns400() throws Exception {
        UUID id = UUID.randomUUID();
        TaskStatusRequest req = new TaskStatusRequest(null);

        mockMvc.perform(patch("/api/tasks/" + id + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteTask_existingId_returns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(taskService).deleteTask(id);

        mockMvc.perform(delete("/api/tasks/" + id))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteTask_unknownId_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Task not found with id: " + id))
                .when(taskService).deleteTask(id);

        mockMvc.perform(delete("/api/tasks/" + id))
                .andExpect(status().isNotFound());
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

```
./gradlew test --tests "group.four.nyare.nyare.Controllers.TaskControllerTest" -q
```

Expected: FAIL — `TaskController` does not exist yet.

- [ ] **Step 3: Write `TaskController.java`**

```java
package group.four.nyare.nyare.Controllers;

import group.four.nyare.nyare.DTOs.TaskRequest;
import group.four.nyare.nyare.DTOs.TaskResponse;
import group.four.nyare.nyare.DTOs.TaskStatusRequest;
import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Services.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for Task management.
 * All endpoints delegate to {@link TaskService}.
 * Error responses follow RFC 7807 Problem Details (handled by {@link GlobalExceptionHandler}).
 */
@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * {@code POST /api/tasks} — Create a new task.
     *
     * @param request task creation payload (validated)
     * @return {@code 201 Created} with the created task
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request));
    }

    /**
     * {@code GET /api/tasks} — List tasks with optional filters.
     *
     * @param courseId  optional; filter by course
     * @param status    optional; filter by status
     * @param scheduled optional; {@code true} = scheduled, {@code false} = unscheduled
     * @return {@code 200 OK} with list of matching tasks
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> listTasks(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Boolean scheduled
    ) {
        return ResponseEntity.ok(taskService.listTasks(courseId, status, scheduled));
    }

    /**
     * {@code GET /api/tasks/{id}} — Get a single task by ID.
     *
     * @param id the task UUID
     * @return {@code 200 OK} with the task, or {@code 404} if not found
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable UUID id) {
        return ResponseEntity.ok(taskService.getTask(id));
    }

    /**
     * {@code PUT /api/tasks/{id}} — Fully update a task.
     *
     * @param id      the task UUID
     * @param request replacement payload (validated)
     * @return {@code 200 OK} with updated task, or {@code 404} if not found
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID id,
            @Valid @RequestBody TaskRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    /**
     * {@code PATCH /api/tasks/{id}/status} — Update only the task status.
     *
     * @param id      the task UUID
     * @param request status-only payload (validated)
     * @return {@code 200 OK} with updated task, or {@code 404} if not found
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID id,
            @Valid @RequestBody TaskStatusRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, request));
    }

    /**
     * {@code DELETE /api/tasks/{id}} — Delete a task.
     *
     * @param id the task UUID
     * @return {@code 204 No Content}, or {@code 404} if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable UUID id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run all controller tests to verify they pass**

```
./gradlew test --tests "group.four.nyare.nyare.Controllers.TaskControllerTest" -q
```

Expected: all 13 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/Controllers/
git add src/test/java/group/four/nyare/nyare/Controllers/
git commit -m "feat(tasks): add TaskController with full CRUD endpoints"
```

---

## Task 6: Final Verification

**Files:** (none new)

- [ ] **Step 1: Run the full test suite**

```
./gradlew test -q
```

Expected: all tests pass. The baseline `contextLoads` test in `NyareApplicationTests` must also pass (it tests the full Spring context boots with the new beans).

- [ ] **Step 2: Check for any remaining compilation issues**

Use IntelliJ MCP → `get_file_problems` across all new files, or:

```
./gradlew compileJava compileTestJava -q
```

Expected: `BUILD SUCCESSFUL`, zero errors.

- [ ] **Step 3: Update the graphify knowledge graph**

Run this with `BypassSandbox: true` and `Cwd` set to the backend project root:

```
graphify update .
```

Expected: graph updated to reflect the new `Controllers`, `Services`, `Repositories`, and `DTOs` packages.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore(tasks): final verification pass — all tests green"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Requirement | Covered By |
|-----------------|-----------|
| Task is course-linked | `TaskRequest.courseId`; `TaskService.findCourseOrThrow` |
| Task status: TODO / IN_PROGRESS / COMPLETED | `TaskStatus` enum used throughout; PATCH endpoint |
| `scheduledDate` is nullable (flexible planning) | `TaskRequest.scheduledDate` optional; `scheduled` filter param |
| Do NOT persist StudyPlan | No `StudyPlan` entity or table anywhere in this plan |
| No automatic task merging/splitting/scoring | No such logic in `TaskService` |
| Errors as Problem Details (RFC 7807) | `GlobalExceptionHandler` + `ResponseEntityExceptionHandler` |
| `open-in-view=false` safe | All service methods are `@Transactional`; `TaskResponse.from()` called inside transaction |
| Course existence validated before task write | `findCourseOrThrow` in `createTask` and `updateTask` |

### Placeholder Scan

No "TBD", "TODO", "fill in details", or vague steps found. All code blocks are complete.

### Type Consistency

- `TaskResponse.from(Task)` accesses `task.getCourse().getId()` — `Course.getId()` returns `Long` ✓
- `TaskResponse.from(Task)` accesses `task.getNote().getId()` — `Note.getId()` returns `UUID` ✓
- `TaskRepository.findAllFiltered` parameters: `Long, TaskStatus, Boolean` — match service call `listTasks(Long, TaskStatus, Boolean)` ✓
- `TaskService.deleteTask(UUID)` — controller calls `taskService.deleteTask(id)` with `UUID` ✓
- `ResourceNotFoundException` package: `group.four.nyare.nyare.Services` — imported consistently in handler and tests ✓
