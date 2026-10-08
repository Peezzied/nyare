# Domain Session Context Implementation Plan (Phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scope all domain resources (tasks, notes, schedules, academic events, and study planning) to the authenticated user from the HTTP session.

**Architecture:** A reusable SessionContext helper extracts the active user identifier from the servlet session. Repositories filter child records through the mandatory course-to-user relation (`course.user.id = :userId`). Controllers inject SessionContext to pass the current user scope down to services.

**Tech Stack:** Java 25, Spring Boot 4.1.1 (Spring Web MVC, Spring Data JPA), SQLite, JUnit 5, Mockito.

**Spec:** Phase 2 of user integration. Enforces student data isolation across all endpoints. Relies on the foundation from Phase 1 (`User` entity, `Course.user` ownership, and `UserController` session login).

## Global Constraints

- Execute this plan after completing Phase 1 (`user-session-management-plan.md`).
- Use Java 25 and Spring Boot 4.1.1.
- Do not create custom exception classes. Use `ResourceNotFoundException` and `BadRequestException` only.
- Controllers interact only with Service interfaces and DTOs.
- Endpoints return plain `List<T>` without pagination envelopes.
- Use explicit constructor injection with `private final` fields.
- Apply ASD-STE100 rules to code comments, error messages, and documentation.

---

### Task 1: Create SessionContext Component and Unit Test

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/config/SessionContext.java`
- Test: `src/test/java/group/four/nyare/nyare/config/SessionContextTest.java`

**Interfaces:**
- Consumes: `HttpServletRequest`, `HttpSession`, `UserController.SESSION_USER_ID`
- Produces: `SessionContext` component with `getUserId()` returning `Optional<Long>`

- [ ] **Step 1: Write unit test for SessionContext**

Create `src/test/java/group/four/nyare/nyare/config/SessionContextTest.java`:

```java
package group.four.nyare.nyare.config;

import group.four.nyare.nyare.controller.UserController;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class SessionContextTest {

    @Test
    void getUserId_withActiveSession_returnsUserId() {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 42L);
        request.setSession(session);

        SessionContext context = new SessionContext(request);

        // when
        Optional<Long> userId = context.getUserId();

        // then
        assertThat(userId).contains(42L);
    }

    @Test
    void getUserId_withoutSession_returnsEmpty() {
        // given
        MockHttpServletRequest request = new MockHttpServletRequest();
        SessionContext context = new SessionContext(request);

        // when
        Optional<Long> userId = context.getUserId();

        // then
        assertThat(userId).isEmpty();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.config.SessionContextTest"
```
Expected: FAIL with compilation errors.

- [ ] **Step 3: Implement SessionContext**

Create `src/main/java/group/four/nyare/nyare/config/SessionContext.java`:

```java
package group.four.nyare.nyare.config;

import group.four.nyare.nyare.controller.UserController;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;

import java.util.Optional;

/**
 * Request-scoped helper component resolving the authenticated user identifier from the HTTP session.
 */
@Component
@RequestScope
public class SessionContext {

    private final HttpServletRequest request;

    public SessionContext(HttpServletRequest request) {
        this.request = request;
    }

    /**
     * Resolves the current user identifier from the active session.
     *
     * @return optional containing the user identifier if an authenticated session exists
     */
    public Optional<Long> getUserId() {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return Optional.empty();
        }
        Object userIdAttr = session.getAttribute(UserController.SESSION_USER_ID);
        if (userIdAttr instanceof Long userId) {
            return Optional.of(userId);
        }
        return Optional.empty();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.config.SessionContextTest"
```
Expected: PASS.

- [ ] **Step 5: Commit changes**

Commit:
`feat: create SessionContext component to resolve session user`

---

### Task 2: Scope Task Queries to Session User

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/TaskService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/TaskServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/TaskController.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/TaskControllerTest.java`

**Interfaces:**
- Consumes: `SessionContext`, `TaskRepository`, `TaskService`
- Produces: User-scoped task listing on `GET /api/tasks`

- [ ] **Step 1: Update TaskRepository with userId filter**

Modify `src/main/java/group/four/nyare/nyare/repository/TaskRepository.java`:

```java
@Query("""
        SELECT t FROM Task t
        WHERE (:userId IS NULL OR t.course.user.id = :userId)
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
```

- [ ] **Step 2: Update TaskService interface and TaskServiceImpl**

Modify `src/main/java/group/four/nyare/nyare/service/TaskService.java`:
Update `listTasks` signature to:
```java
List<TaskResponse> listTasks(Long userId, Long courseId, TaskStatus status, Boolean scheduled);
```

Modify `src/main/java/group/four/nyare/nyare/service/impl/TaskServiceImpl.java`:
```java
@Override
public List<TaskResponse> listTasks(Long userId, Long courseId, TaskStatus status, Boolean scheduled) {
    return taskRepository.findAllFiltered(userId, courseId, status, scheduled)
            .stream()
            .map(this::toResponse)
            .toList();
}
```

- [ ] **Step 3: Update TaskController to inject SessionContext**

Modify `src/main/java/group/four/nyare/nyare/controller/TaskController.java`:
Inject `SessionContext sessionContext` into constructor.
Update `listTasks`:
```java
@GetMapping
public ResponseEntity<List<TaskResponse>> listTasks(
        @RequestParam(required = false) Long courseId,
        @RequestParam(required = false) TaskStatus status,
        @RequestParam(required = false) Boolean scheduled) {
    Long userId = sessionContext.getUserId().orElse(null);
    List<TaskResponse> tasks = taskService.listTasks(userId, courseId, status, scheduled);
    return ResponseEntity.ok(tasks);
}
```

- [ ] **Step 4: Update TaskControllerTest and verify**

Update `TaskControllerTest` to mock `SessionContext` and verify user-scoped invocation.

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.controller.TaskControllerTest"
```
Expected: PASS.

- [ ] **Step 5: Commit changes**

Commit:
`feat: scope Task queries to session user`

---

### Task 3: Scope Note Queries to Session User

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/NoteService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/NoteController.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`

**Interfaces:**
- Consumes: `SessionContext`, `NoteRepository`, `NoteService`
- Produces: User-scoped note listing on `GET /api/notes`

- [ ] **Step 1: Update NoteRepository with user filter queries**

Modify `src/main/java/group/four/nyare/nyare/repository/NoteRepository.java`:
Add:
```java
@Query("""
        SELECT n FROM Note n
        WHERE (:userId IS NULL OR n.course.user.id = :userId)
          AND (:courseId IS NULL OR n.course.id = :courseId)
        ORDER BY n.createdAt DESC
        """)
List<Note> findAllFiltered(@Param("userId") Long userId, @Param("courseId") Long courseId);
```

- [ ] **Step 2: Update NoteService and NoteServiceImpl**

Modify `src/main/java/group/four/nyare/nyare/service/NoteService.java`:
```java
List<NoteSummaryResponse> listNotes(Long userId, Long courseId);
```

Modify `src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`:
Use `noteRepository.findAllFiltered(userId, courseId)` and map to summary responses.

- [ ] **Step 3: Update NoteController to inject SessionContext**

Modify `src/main/java/group/four/nyare/nyare/controller/NoteController.java`:
Inject `SessionContext sessionContext`.
Update `listNotes`:
```java
@GetMapping
public ResponseEntity<List<NoteSummaryResponse>> listNotes(
        @RequestParam(required = false) Long courseId) {
    Long userId = sessionContext.getUserId().orElse(null);
    List<NoteSummaryResponse> notes = noteService.listNotes(userId, courseId);
    return ResponseEntity.ok(notes);
}
```

- [ ] **Step 4: Update NoteControllerTest and verify**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.controller.NoteControllerTest"
```
Expected: PASS.

- [ ] **Step 5: Commit changes**

Commit:
`feat: scope Note queries to session user`

---

### Task 4: Scope Schedule and AcademicEvent Queries to Session User

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/ScheduleService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/ScheduleController.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/AcademicEventRepository.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/AcademicEventService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/AcademicEventServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/AcademicEventController.java`

**Interfaces:**
- Consumes: `SessionContext`, `ScheduleRepository`, `AcademicEventRepository`
- Produces: Scoped schedule meetings and academic events for the active user

- [ ] **Step 1: Add user filters to ScheduleRepository and AcademicEventRepository**

In `ScheduleRepository.java`:
```java
@Query("""
        SELECT s FROM Schedule s
        WHERE (:userId IS NULL OR s.course.user.id = :userId)
          AND (:courseId IS NULL OR s.course.id = :courseId)
        """)
List<Schedule> findAllFiltered(@Param("userId") Long userId, @Param("courseId") Long courseId);
```

In `AcademicEventRepository.java`:
```java
@Query("""
        SELECT e FROM AcademicEvent e
        WHERE (:userId IS NULL OR e.course.user.id = :userId)
          AND (:courseId IS NULL OR e.course.id = :courseId)
          AND (:upcoming IS NULL OR (:upcoming = true AND e.deadline >= CURRENT_TIMESTAMP))
        ORDER BY e.deadline ASC
        """)
List<AcademicEvent> findAllFiltered(
        @Param("userId") Long userId,
        @Param("courseId") Long courseId,
        @Param("upcoming") Boolean upcoming
);
```

- [ ] **Step 2: Update services and controllers for Schedule and AcademicEvent**

Update `ScheduleServiceImpl` and `AcademicEventServiceImpl` to pass `userId`.
Update `ScheduleController` and `AcademicEventController` to inject `SessionContext` and pass the resolved user identifier.

- [ ] **Step 3: Run slice tests**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.controller.AcademicEventControllerTest"
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: scope Schedule and AcademicEvent queries to session user`

---

### Task 5: Scope StudyPlanner AI Processing to Session User

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- Modify: `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`

**Interfaces:**
- Consumes: `SessionContext`, `StudyPlannerService`
- Produces: AI note processing strictly restricted to the courses owned by the session user

- [ ] **Step 1: Update StudyPlannerService to accept userId**

Modify `src/main/java/group/four/nyare/nyare/service/StudyPlannerService.java`:
```java
ProcessSummaryResponse processNotes(LocalDate targetDate, Long userId);
```

Modify `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`:
When fetching today's notes and open courses, restrict the query to courses matching `course.user.id = :userId`.

- [ ] **Step 2: Update StudyPlannerController to pass session userId**

Modify `src/main/java/group/four/nyare/nyare/controller/StudyPlannerController.java`:
Inject `SessionContext sessionContext`.
Extract `Long userId = sessionContext.getUserId().orElse(null);` and forward to `studyPlannerService.processNotes(LocalDate.now(), userId);`.

- [ ] **Step 3: Run integration test**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.controller.StudyPlannerControllerIntegrationTest"
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: scope StudyPlanner AI note processing to session user`

---

### Task 6: Full Verification of Phase 2

**Files:**
- None (verification phase)

- [ ] **Step 1: Run complete test suite**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.config.SessionContextTest"
./gradlew test --tests "group.four.nyare.nyare.controller.TaskControllerTest"
./gradlew test --tests "group.four.nyare.nyare.controller.NoteControllerTest"
./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"
./gradlew test --tests "group.four.nyare.nyare.controller.UserControllerTest"
```
Expected: All tests PASS.

- [ ] **Step 2: Update knowledge graph**

Run:
```powershell
graphify update .
```
Expected: Graph updated.
