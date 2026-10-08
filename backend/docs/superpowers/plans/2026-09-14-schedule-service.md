# Schedule Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the persistence repository, data transfer objects, service contracts, and transactional business logic for recurring class `Schedule` management in the Nyare backend, with strict time-range integrity and course relationship validation.

**Architecture:** The schedule module implements a clean domain service slice: strong POJO DTOs with Jakarta Bean Validation (`ScheduleRequest`, `ScheduleResponse`), an index-ordered Spring Data JPA repository (`ScheduleRepository`), a decoupled service interface (`ScheduleService`), and a transactional implementation (`ScheduleServiceImpl`). The service validates course existence and enforces temporal ordering (`startTime < endTime`). Controllers and REST endpoints are deliberately excluded from this slice.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring Data JPA (`JpaRepository`), Jakarta Validation (`jakarta.validation`), Hibernate Community Dialects (SQLite), JUnit 5, Mockito, AssertJ, IntelliJ MCP static analysis.

**Spec:** `docs/conceptual-model.md`, `backend/docs/conventions.md`, and `backend/docs/temp/schedule-overlap-detection.md`

## Global Constraints

- **Language & Runtime**: Java 25 (`toolchain.languageVersion = 25`), Spring Boot 4.1.1.
- **Package Convention**: All packages are strictly lowercase (`group.four.nyare.nyare.dto`, `group.four.nyare.nyare.repository`, `group.four.nyare.nyare.service`, `group.four.nyare.nyare.service.impl`, `group.four.nyare.nyare.model`).
- **DTO Convention**: DTOs are standard Java classes (POJOs) with no-arg constructors, all-arg constructors, getters, and setters (no records, matching `AcademicEventRequest` / `TaskRequest` conventions).
- **Service Layer Isolation**: Entities (`Schedule`, `Course`) are fully encapsulated within the service layer. Return types and arguments for service contracts must strictly be DTOs.
- **Transaction Semantics**: Service classes declare class-level `@Transactional(readOnly = true)`. Mutating methods (`createSchedule`, `updateSchedule`, `deleteSchedule`) declare explicit `@Transactional`.
- **Domain Exceptions Only**: Throw canonical exceptions `ResourceNotFoundException` (404) for missing courses or schedules, and `BadRequestException` (400) for time integrity violations. Never create entity-specific exceptions.
- **Temporal Constraint**: `startTime` must be strictly before `endTime` (`startTime.isBefore(endTime)`). If equal or inverted, throw `BadRequestException`.
- **MVP Boundaries**:
  - **No Controller in this slice**: HTTP controller endpoints are out of scope for this plan.
  - **No Automatic Overlap Detection**: Overlap detection between class meetings on the same day is deferred per `docs/temp/schedule-overlap-detection.md`.
  - **Structural Anchor Only**: Schedules represent recurring weekly class meeting times that anchor the calendar grid, NOT student study time-blocks.
- **Verification Tier**: Tier 1 = IntelliJ MCP (`get_file_problems`), Tier 2 = `./gradlew test --tests group.four.nyare.nyare.service.ScheduleServiceTest` (or `compileJava`), Tier 3 = full test suite.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/main/java/group/four/nyare/nyare/dto/ScheduleRequest.java` | Create | Validated request payload for creating/updating recurring schedules |
| `src/main/java/group/four/nyare/nyare/dto/ScheduleResponse.java` | Create | Representation response payload for schedule entities |
| `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java` | Create | Spring Data JPA repository for `Schedule` with chronological ordering |
| `src/main/java/group/four/nyare/nyare/service/ScheduleService.java` | Create | Service interface defining schedule CRUD and query contracts |
| `src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java` | Create | Transactional business logic, time validation, and DTO mapping |
| `src/test/java/group/four/nyare/nyare/dto/ScheduleDtoValidationTest.java` | Create | Unit test validating Jakarta Bean Validation constraints on `ScheduleRequest` |
| `src/test/java/group/four/nyare/nyare/repository/ScheduleRepositoryTest.java` | Create | Repository test verifying JPQL sorting and course/day queries |
| `src/test/java/group/four/nyare/nyare/service/ScheduleServiceTest.java` | Create | Unit test verifying service logic, boundary conditions, and exceptions |

---

## Task 1: DTOs — `ScheduleRequest` and `ScheduleResponse`

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/dto/ScheduleRequest.java`
- Create: `src/main/java/group/four/nyare/nyare/dto/ScheduleResponse.java`
- Test: `src/test/java/group/four/nyare/nyare/dto/ScheduleDtoValidationTest.java`

**Interfaces:**
- Produces:
  - `ScheduleRequest(Long courseId, DayOfWeek day, LocalTime startTime, LocalTime endTime)`
  - `ScheduleResponse(Long id, Long courseId, DayOfWeek day, LocalTime startTime, LocalTime endTime)`

- [ ] **Step 1: Write failing validation test for `ScheduleRequest`**

Create `src/test/java/group/four/nyare/nyare/dto/ScheduleDtoValidationTest.java`:

```java
package group.four.nyare.nyare.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ScheduleDtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    @DisplayName("Should pass validation when all required fields are present")
    void validate_withValidPayload_hasNoViolations() {
        ScheduleRequest request = new ScheduleRequest(
                1L,
                DayOfWeek.MONDAY,
                LocalTime.of(9, 0),
                LocalTime.of(10, 30)
        );

        Set<ConstraintViolation<ScheduleRequest>> violations = validator.validate(request);

        assertThat(violations).isEmpty();
    }

    @Test
    @DisplayName("Should fail validation when required fields are null")
    void validate_withNullFields_hasViolations() {
        ScheduleRequest request = new ScheduleRequest();

        Set<ConstraintViolation<ScheduleRequest>> violations = validator.validate(request);

        assertThat(violations).hasSize(4);
        assertThat(violations)
                .extracting(ConstraintViolation::getMessage)
                .containsExactlyInAnyOrder(
                        "Course ID is required",
                        "Day of week is required",
                        "Start time is required",
                        "End time is required"
                );
    }
}
```

- [ ] **Step 2: Verify test fails to compile (missing DTO classes)**

Check via IntelliJ MCP `get_file_problems` on `ScheduleDtoValidationTest.java`.
Expected: Compilation errors for missing `ScheduleRequest`.

- [ ] **Step 3: Implement `ScheduleRequest.java` and `ScheduleResponse.java`**

Create `src/main/java/group/four/nyare/nyare/dto/ScheduleRequest.java`:

```java
package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Request payload for creating or updating a recurring class meeting schedule.
 */
public class ScheduleRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Day of week is required")
    private DayOfWeek day;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    public ScheduleRequest() {
    }

    public ScheduleRequest(Long courseId, DayOfWeek day, LocalTime startTime, LocalTime endTime) {
        this.courseId = courseId;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}
```

Create `src/main/java/group/four/nyare/nyare/dto/ScheduleResponse.java`:

```java
package group.four.nyare.nyare.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Representation response payload for a recurring class meeting schedule.
 */
public class ScheduleResponse {

    private Long id;
    private Long courseId;
    private DayOfWeek day;
    private LocalTime startTime;
    private LocalTime endTime;

    public ScheduleResponse() {
    }

    public ScheduleResponse(Long id, Long courseId, DayOfWeek day, LocalTime startTime, LocalTime endTime) {
        this.id = id;
        this.courseId = courseId;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}
```

- [ ] **Step 4: Verify test passes and static analysis reports zero errors**

Run IntelliJ MCP `get_file_problems` on:
- `ScheduleRequest.java`
- `ScheduleResponse.java`
- `ScheduleDtoValidationTest.java`

Run test:
```powershell
& "D:\General Project Bins\Academics\CCS201\nyare\backend\gradlew.bat" test --tests group.four.nyare.nyare.dto.ScheduleDtoValidationTest
```
Expected: `BUILD SUCCESSFUL`, 2 tests completed, 0 failed.

- [ ] **Step 5: Commit DTOs and validation tests**

```bash
git add src/main/java/group/four/nyare/nyare/dto/ScheduleRequest.java src/main/java/group/four/nyare/nyare/dto/ScheduleResponse.java src/test/java/group/four/nyare/nyare/dto/ScheduleDtoValidationTest.java
git commit -m "feat(schedule): add ScheduleRequest and ScheduleResponse DTOs with validation"
```

---

## Task 2: Repository — `ScheduleRepository`

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java`
- Test: `src/test/java/group/four/nyare/nyare/repository/ScheduleRepositoryTest.java`

**Interfaces:**
- Consumes: `group.four.nyare.nyare.model.Schedule`, `group.four.nyare.nyare.model.Course`
- Produces:
  - `List<Schedule> findByCourseIdOrderByDayAscStartTimeAsc(Long courseId)`
  - `List<Schedule> findByCourseIdAndDayOrderByStartTimeAsc(Long courseId, DayOfWeek day)`

- [ ] **Step 1: Write repository integration test**

Create `src/test/java/group/four/nyare/nyare/repository/ScheduleRepositoryTest.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ScheduleRepositoryTest {

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private CourseRepository courseRepository;

    private Course courseA;
    private Course courseB;

    @BeforeEach
    void setUp() {
        scheduleRepository.deleteAll();
        courseRepository.deleteAll();

        courseA = courseRepository.save(new Course("CS101", "Introduction to Computer Science"));
        courseB = courseRepository.save(new Course("MATH201", "Calculus II"));
    }

    @Test
    @DisplayName("Should find schedules by course ordered by day ascending then startTime ascending")
    void findByCourseIdOrderByDayAscStartTimeAsc_returnsOrderedSchedules() {
        Schedule wedAfternoon = scheduleRepository.save(new Schedule(
                courseA, DayOfWeek.WEDNESDAY, LocalTime.of(14, 0), LocalTime.of(15, 30)));
        Schedule monMorning = scheduleRepository.save(new Schedule(
                courseA, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30)));
        Schedule monAfternoon = scheduleRepository.save(new Schedule(
                courseA, DayOfWeek.MONDAY, LocalTime.of(13, 0), LocalTime.of(14, 30)));
        scheduleRepository.save(new Schedule(
                courseB, DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(9, 0)));

        List<Schedule> results = scheduleRepository.findByCourseIdOrderByDayAscStartTimeAsc(courseA.getId());

        assertThat(results).hasSize(3);
        assertThat(results.get(0).getId()).isEqualTo(monMorning.getId());
        assertThat(results.get(1).getId()).isEqualTo(monAfternoon.getId());
        assertThat(results.get(2).getId()).isEqualTo(wedAfternoon.getId());
    }

    @Test
    @DisplayName("Should find schedules by course and specific day ordered by startTime ascending")
    void findByCourseIdAndDayOrderByStartTimeAsc_filtersAndOrdersCorrectly() {
        Schedule mon10 = scheduleRepository.save(new Schedule(
                courseA, DayOfWeek.MONDAY, LocalTime.of(10, 0), LocalTime.of(11, 30)));
        Schedule mon08 = scheduleRepository.save(new Schedule(
                courseA, DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(9, 30)));
        scheduleRepository.save(new Schedule(
                courseA, DayOfWeek.FRIDAY, LocalTime.of(8, 0), LocalTime.of(9, 30)));

        List<Schedule> results = scheduleRepository.findByCourseIdAndDayOrderByStartTimeAsc(
                courseA.getId(), DayOfWeek.MONDAY);

        assertThat(results).hasSize(2);
        assertThat(results.get(0).getId()).isEqualTo(mon08.getId());
        assertThat(results.get(1).getId()).isEqualTo(mon10.getId());
    }
}
```

- [ ] **Step 2: Verify test fails to compile (missing `ScheduleRepository`)**

Run IntelliJ MCP `get_file_problems` on `ScheduleRepositoryTest.java`.
Expected: Cannot resolve symbol `ScheduleRepository`.

- [ ] **Step 3: Implement `ScheduleRepository.java`**

Create `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.DayOfWeek;
import java.util.List;

/**
 * Spring Data JPA repository for {@link Schedule} recurring class meeting entities.
 */
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Retrieves all schedule entries for a given course, ordered chronologically
     * by day of the week ascending and start time ascending.
     *
     * @param courseId the ID of the course
     * @return list of schedules ordered by day and start time
     */
    List<Schedule> findByCourseIdOrderByDayAscStartTimeAsc(Long courseId);

    /**
     * Retrieves schedule entries for a specific course on a given day of the week,
     * ordered chronologically by start time ascending.
     *
     * @param courseId the ID of the course
     * @param day      the day of the week
     * @return list of schedules matching the course and day, ordered by start time
     */
    List<Schedule> findByCourseIdAndDayOrderByStartTimeAsc(Long courseId, DayOfWeek day);
}
```

- [ ] **Step 4: Run repository tests and verify they pass**

Verify zero problems with IntelliJ MCP `get_file_problems` on `ScheduleRepository.java`.
Execute targeted test:
```powershell
& "D:\General Project Bins\Academics\CCS201\nyare\backend\gradlew.bat" test --tests group.four.nyare.nyare.repository.ScheduleRepositoryTest
```
Expected: `BUILD SUCCESSFUL`, 2 tests completed, 0 failed.

- [ ] **Step 5: Commit `ScheduleRepository`**

```bash
git add src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java src/test/java/group/four/nyare/nyare/repository/ScheduleRepositoryTest.java
git commit -m "feat(schedule): add ScheduleRepository with course and day ordering queries"
```

---

## Task 3: Service Contract — `ScheduleService` Interface

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/service/ScheduleService.java`

**Interfaces:**
- Consumes: `ScheduleRequest`, `ScheduleResponse`, `DayOfWeek`
- Produces:
  - `ScheduleResponse createSchedule(ScheduleRequest request)`
  - `List<ScheduleResponse> listSchedules(Long courseId, DayOfWeek day)`
  - `ScheduleResponse getSchedule(Long id)`
  - `ScheduleResponse updateSchedule(Long id, ScheduleRequest request)`
  - `void deleteSchedule(Long id)`

- [ ] **Step 1: Define `ScheduleService.java` contract**

Create `src/main/java/group/four/nyare/nyare/service/ScheduleService.java`:

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.time.DayOfWeek;
import java.util.List;

/**
 * Service contract for recurring weekly class schedule management.
 * <p>
 * Schedules represent fixed class meeting slots that anchor weekly calendar views
 * and provide temporal context for daily academic planning.
 */
public interface ScheduleService {

    /**
     * Creates and persists a new recurring class meeting slot for a course.
     *
     * @param request the validated schedule creation payload
     * @return the persisted schedule response
     * @throws ResourceNotFoundException if the specified course does not exist
     * @throws BadRequestException       if {@code startTime} is not strictly before {@code endTime}
     */
    ScheduleResponse createSchedule(ScheduleRequest request);

    /**
     * Retrieves schedules for a course, optionally filtered by day of the week,
     * ordered chronologically by day and start time.
     *
     * @param courseId the required course ID to query schedules for
     * @param day      optional day of the week filter; {@code null} matches all days
     * @return list of matching schedule responses
     * @throws ResourceNotFoundException if the specified course does not exist
     */
    List<ScheduleResponse> listSchedules(Long courseId, DayOfWeek day);

    /**
     * Retrieves a single schedule entry by its unique identifier.
     *
     * @param id the unique identifier of the schedule
     * @return the schedule response representation
     * @throws ResourceNotFoundException if no schedule exists with the given identifier
     */
    ScheduleResponse getSchedule(Long id);

    /**
     * Fully updates an existing schedule with replacement time or day details.
     *
     * @param id      the unique identifier of the schedule to update
     * @param request the replacement schedule payload
     * @return the updated schedule response representation
     * @throws ResourceNotFoundException if the schedule does not exist, or the target course does not exist
     * @throws BadRequestException       if {@code startTime} is not strictly before {@code endTime}
     */
    ScheduleResponse updateSchedule(Long id, ScheduleRequest request);

    /**
     * Deletes an existing schedule entry by its unique identifier.
     *
     * @param id the unique identifier of the schedule to delete
     * @throws ResourceNotFoundException if no schedule exists with the given identifier
     */
    void deleteSchedule(Long id);
}
```

- [ ] **Step 2: Verify static analysis on `ScheduleService.java`**

Run IntelliJ MCP `get_file_problems` on `ScheduleService.java`.
Expected: Zero errors.

- [ ] **Step 3: Commit `ScheduleService` interface**

```bash
git add src/main/java/group/four/nyare/nyare/service/ScheduleService.java
git commit -m "feat(schedule): add ScheduleService business interface contract"
```

---

## Task 4: Service Implementation & Business Logic — `ScheduleServiceImpl`

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java`
- Test: `src/test/java/group/four/nyare/nyare/service/ScheduleServiceTest.java`

**Interfaces:**
- Consumes: `ScheduleService`, `ScheduleRepository`, `CourseRepository`, `ScheduleRequest`, `ScheduleResponse`
- Enforces:
  1. `startTime.isBefore(endTime)` restriction
  2. `Course` existence check before persisting or listing
  3. `Schedule` existence check on read/update/delete
  4. Manual entity-to-DTO conversion

- [ ] **Step 1: Write comprehensive unit test suite in `ScheduleServiceTest.java`**

Create `src/test/java/group/four/nyare/nyare/service/ScheduleServiceTest.java`:

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.service.impl.ScheduleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private Course sampleCourse;

    @BeforeEach
    void setUp() {
        sampleCourse = new Course("CS101", "Computer Science I");
        ReflectionTestUtils.setField(sampleCourse, "id", 1L);
    }

    @Nested
    @DisplayName("createSchedule")
    class CreateScheduleTests {

        @Test
        @DisplayName("Should successfully create and persist a valid schedule")
        void createSchedule_withValidPayload_persistsAndReturnsResponse() {
            ScheduleRequest request = new ScheduleRequest(
                    1L,
                    DayOfWeek.MONDAY,
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 30)
            );

            when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
                Schedule schedule = invocation.getArgument(0);
                ReflectionTestUtils.setField(schedule, "id", 42L);
                return schedule;
            });

            ScheduleResponse response = scheduleService.createSchedule(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(42L);
            assertThat(response.getCourseId()).isEqualTo(1L);
            assertThat(response.getDay()).isEqualTo(DayOfWeek.MONDAY);
            assertThat(response.getStartTime()).isEqualTo(LocalTime.of(9, 0));
            assertThat(response.getEndTime()).isEqualTo(LocalTime.of(10, 30));
            verify(scheduleRepository).save(any(Schedule.class));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when course does not exist")
        void createSchedule_withNonExistentCourse_throwsResourceNotFoundException() {
            ScheduleRequest request = new ScheduleRequest(
                    999L,
                    DayOfWeek.MONDAY,
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 30)
            );

            when(courseRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.createSchedule(request))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Course not found: 999");
            verify(scheduleRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw BadRequestException when startTime is after endTime")
        void createSchedule_withStartTimeAfterEndTime_throwsBadRequestException() {
            ScheduleRequest request = new ScheduleRequest(
                    1L,
                    DayOfWeek.MONDAY,
                    LocalTime.of(11, 0),
                    LocalTime.of(10, 0)
            );

            assertThatThrownBy(() -> scheduleService.createSchedule(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Start time must be strictly before end time");
            verify(scheduleRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw BadRequestException when startTime equals endTime")
        void createSchedule_withStartTimeEqualToEndTime_throwsBadRequestException() {
            ScheduleRequest request = new ScheduleRequest(
                    1L,
                    DayOfWeek.MONDAY,
                    LocalTime.of(10, 0),
                    LocalTime.of(10, 0)
            );

            assertThatThrownBy(() -> scheduleService.createSchedule(request))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Start time must be strictly before end time");
            verify(scheduleRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("listSchedules")
    class ListSchedulesTests {

        @Test
        @DisplayName("Should list all schedules for a course when day is null")
        void listSchedules_withCourseIdOnly_returnsAllSchedulesForCourse() {
            Schedule s1 = new Schedule(sampleCourse, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 0));
            ReflectionTestUtils.setField(s1, "id", 101L);
            Schedule s2 = new Schedule(sampleCourse, DayOfWeek.WEDNESDAY, LocalTime.of(9, 0), LocalTime.of(10, 0));
            ReflectionTestUtils.setField(s2, "id", 102L);

            when(courseRepository.existsById(1L)).thenReturn(true);
            when(scheduleRepository.findByCourseIdOrderByDayAscStartTimeAsc(1L)).thenReturn(List.of(s1, s2));

            List<ScheduleResponse> responses = scheduleService.listSchedules(1L, null);

            assertThat(responses).hasSize(2);
            assertThat(responses.get(0).getId()).isEqualTo(101L);
            assertThat(responses.get(1).getId()).isEqualTo(102L);
        }

        @Test
        @DisplayName("Should list schedules for a course filtered by specific day")
        void listSchedules_withCourseIdAndDay_returnsFilteredSchedules() {
            Schedule s1 = new Schedule(sampleCourse, DayOfWeek.FRIDAY, LocalTime.of(13, 0), LocalTime.of(15, 0));
            ReflectionTestUtils.setField(s1, "id", 103L);

            when(courseRepository.existsById(1L)).thenReturn(true);
            when(scheduleRepository.findByCourseIdAndDayOrderByStartTimeAsc(1L, DayOfWeek.FRIDAY))
                    .thenReturn(List.of(s1));

            List<ScheduleResponse> responses = scheduleService.listSchedules(1L, DayOfWeek.FRIDAY);

            assertThat(responses).hasSize(1);
            assertThat(responses.get(0).getId()).isEqualTo(103L);
            assertThat(responses.get(0).getDay()).isEqualTo(DayOfWeek.FRIDAY);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when course does not exist")
        void listSchedules_withNonExistentCourse_throwsResourceNotFoundException() {
            when(courseRepository.existsById(999L)).thenReturn(false);

            assertThatThrownBy(() -> scheduleService.listSchedules(999L, null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Course not found: 999");
        }
    }

    @Nested
    @DisplayName("getSchedule")
    class GetScheduleTests {

        @Test
        @DisplayName("Should return schedule response when schedule exists")
        void getSchedule_withExistingId_returnsResponse() {
            Schedule schedule = new Schedule(sampleCourse, DayOfWeek.TUESDAY, LocalTime.of(10, 0), LocalTime.of(11, 30));
            ReflectionTestUtils.setField(schedule, "id", 55L);

            when(scheduleRepository.findById(55L)).thenReturn(Optional.of(schedule));

            ScheduleResponse response = scheduleService.getSchedule(55L);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(55L);
            assertThat(response.getDay()).isEqualTo(DayOfWeek.TUESDAY);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when schedule does not exist")
        void getSchedule_withNonExistentId_throwsResourceNotFoundException() {
            when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.getSchedule(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Schedule not found: 999");
        }
    }

    @Nested
    @DisplayName("updateSchedule")
    class UpdateScheduleTests {

        @Test
        @DisplayName("Should successfully update schedule fields")
        void updateSchedule_withValidPayload_updatesAndReturnsResponse() {
            Schedule existingSchedule = new Schedule(sampleCourse, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 0));
            ReflectionTestUtils.setField(existingSchedule, "id", 10L);

            ScheduleRequest updateRequest = new ScheduleRequest(
                    1L,
                    DayOfWeek.THURSDAY,
                    LocalTime.of(14, 0),
                    LocalTime.of(16, 0)
            );

            when(scheduleRepository.findById(10L)).thenReturn(Optional.of(existingSchedule));
            when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
            when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ScheduleResponse response = scheduleService.updateSchedule(10L, updateRequest);

            assertThat(response.getDay()).isEqualTo(DayOfWeek.THURSDAY);
            assertThat(response.getStartTime()).isEqualTo(LocalTime.of(14, 0));
            assertThat(response.getEndTime()).isEqualTo(LocalTime.of(16, 0));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when schedule does not exist")
        void updateSchedule_withNonExistentSchedule_throwsResourceNotFoundException() {
            ScheduleRequest updateRequest = new ScheduleRequest(
                    1L,
                    DayOfWeek.THURSDAY,
                    LocalTime.of(14, 0),
                    LocalTime.of(16, 0)
            );

            when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.updateSchedule(999L, updateRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Schedule not found: 999");
        }

        @Test
        @DisplayName("Should throw BadRequestException when updated time range is invalid")
        void updateSchedule_withInvalidTimeRange_throwsBadRequestException() {
            ScheduleRequest updateRequest = new ScheduleRequest(
                    1L,
                    DayOfWeek.THURSDAY,
                    LocalTime.of(16, 0),
                    LocalTime.of(14, 0)
            );

            assertThatThrownBy(() -> scheduleService.updateSchedule(10L, updateRequest))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Start time must be strictly before end time");
        }
    }

    @Nested
    @DisplayName("deleteSchedule")
    class DeleteScheduleTests {

        @Test
        @DisplayName("Should successfully delete existing schedule")
        void deleteSchedule_withExistingId_deletesSuccessfully() {
            Schedule existingSchedule = new Schedule(sampleCourse, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 0));
            ReflectionTestUtils.setField(existingSchedule, "id", 20L);

            when(scheduleRepository.findById(20L)).thenReturn(Optional.of(existingSchedule));

            scheduleService.deleteSchedule(20L);

            verify(scheduleRepository).delete(existingSchedule);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when deleting non-existent schedule")
        void deleteSchedule_withNonExistentId_throwsResourceNotFoundException() {
            when(scheduleRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.deleteSchedule(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Schedule not found: 999");
            verify(scheduleRepository, never()).delete(any());
        }
    }
}
```

- [ ] **Step 2: Verify test fails to compile (missing `ScheduleServiceImpl`)**

Run IntelliJ MCP `get_file_problems` on `ScheduleServiceTest.java`.
Expected: Cannot resolve symbol `ScheduleServiceImpl`.

- [ ] **Step 3: Implement `ScheduleServiceImpl.java`**

Create `src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java`:

```java
package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.service.ScheduleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.util.List;

/**
 * Production implementation of {@link ScheduleService}.
 * Enforces course reference integrity, time range validity, and transactional consistency.
 */
@Service
@Transactional(readOnly = true)
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository, CourseRepository courseRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request) {
        validateTimeRange(request);

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + request.getCourseId()));

        Schedule schedule = new Schedule(
                course,
                request.getDay(),
                request.getStartTime(),
                request.getEndTime()
        );

        Schedule savedSchedule = scheduleRepository.save(schedule);
        return toResponse(savedSchedule);
    }

    @Override
    public List<ScheduleResponse> listSchedules(Long courseId, DayOfWeek day) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found: " + courseId);
        }

        List<Schedule> schedules;
        if (day != null) {
            schedules = scheduleRepository.findByCourseIdAndDayOrderByStartTimeAsc(courseId, day);
        } else {
            schedules = scheduleRepository.findByCourseIdOrderByDayAscStartTimeAsc(courseId);
        }

        return schedules.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ScheduleResponse getSchedule(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + id));
        return toResponse(schedule);
    }

    @Override
    @Transactional
    public ScheduleResponse updateSchedule(Long id, ScheduleRequest request) {
        validateTimeRange(request);

        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + id));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + request.getCourseId()));

        schedule.setCourse(course);
        schedule.setDay(request.getDay());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());

        Schedule updated = scheduleRepository.save(schedule);
        return toResponse(updated);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + id));
        scheduleRepository.delete(schedule);
    }

    private void validateTimeRange(ScheduleRequest request) {
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new BadRequestException("Start time and end time are required");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new BadRequestException("Start time must be strictly before end time");
        }
    }

    private ScheduleResponse toResponse(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getCourse().getId(),
                schedule.getDay(),
                schedule.getStartTime(),
                schedule.getEndTime()
        );
    }
}
```

- [ ] **Step 4: Run unit tests and static analysis**

Verify zero problems with IntelliJ MCP `get_file_problems` on:
- `ScheduleServiceImpl.java`
- `ScheduleServiceTest.java`

Execute targeted unit test:
```powershell
& "D:\General Project Bins\Academics\CCS201\nyare\backend\gradlew.bat" test --tests group.four.nyare.nyare.service.ScheduleServiceTest
```
Expected: `BUILD SUCCESSFUL`, 12 tests completed, 0 failed.

- [ ] **Step 5: Commit `ScheduleServiceImpl` and unit tests**

```bash
git add src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java src/test/java/group/four/nyare/nyare/service/ScheduleServiceTest.java
git commit -m "feat(schedule): implement ScheduleServiceImpl with course and time validation"
```

---

## Task 5: Boundaries & Architecture Verification

**Files:**
- Test all created schedule files across the suite.

- [ ] **Step 1: Run comprehensive static check across all schedule classes**

Run IntelliJ MCP `get_file_problems` on:
1. `src/main/java/group/four/nyare/nyare/dto/ScheduleRequest.java`
2. `src/main/java/group/four/nyare/nyare/dto/ScheduleResponse.java`
3. `src/main/java/group/four/nyare/nyare/repository/ScheduleRepository.java`
4. `src/main/java/group/four/nyare/nyare/service/ScheduleService.java`
5. `src/main/java/group/four/nyare/nyare/service/impl/ScheduleServiceImpl.java`

Expected: 0 errors on all files.

- [ ] **Step 2: Run all schedule-related unit and repository tests**

```powershell
& "D:\General Project Bins\Academics\CCS201\nyare\backend\gradlew.bat" test --tests "group.four.nyare.nyare.*Schedule*"
```
Expected: All tests pass without warnings or failures.

- [ ] **Step 3: Update knowledge graph topology**

Execute graphify update:
```powershell
graphify update .
```

- [ ] **Step 4: Final verification commit**

```bash
git commit --allow-empty -m "chore(schedule): verify schedule service architectural boundaries and clean test suite"
```
