# User and Domain Ownership Implementation Plan (Phase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement user management, HTTP session authentication, and user ownership on the Course aggregate root, establishing the persistence and session foundation for Phase 2.

**Architecture:** The User entity serves as the root identity. Course belongs to a mandatory User, establishing the database link required for user-scoped queries. Standard servlet HttpSession manages session state. UserController and CourseController expose REST endpoints and interact only with service interfaces.

**Tech Stack:** Java 25, Spring Boot 4.1.1 (Spring Web MVC, Spring Data JPA), SQLite, Jakarta Servlet API, JUnit 5, Mockito.

**Spec:** Phase 1 of 2. Focuses on User entity, Course user ownership, authentication endpoints, and session cookies. Phase 2 (`domain-session-context-plan.md`) subsequently scopes all remaining domain controllers to this session context.

## Global Constraints

- Use Java 25 and Spring Boot 4.1.1.
- Do not create custom exception classes. Use `ResourceNotFoundException` and `BadRequestException` only.
- Controllers interact only with Service interfaces and DTOs.
- Endpoints return plain `List<T>` without pagination envelopes.
- Use explicit constructor injection with `private final` fields.
- Apply ASD-STE100 rules to code comments, error messages, and documentation.

---

### Task 1: Create User Entity and Repository

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/model/User.java`
- Create: `src/main/java/group/four/nyare/nyare/repository/UserRepository.java`
- Test: `src/test/java/group/four/nyare/nyare/repository/UserRepositoryTest.java`

**Interfaces:**
- Consumes: Jakarta Persistence, Spring Data JPA
- Produces: `User` entity, `UserRepository` interface with `findByUsername(String)` and `existsByUsername(String)`

- [ ] **Step 1: Write the failing repository test**

Create `src/test/java/group/four/nyare/nyare/repository/UserRepositoryTest.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsername_whenUserExists_returnsUser() {
        // given
        User user = new User("alice");
        entityManager.persistAndFlush(user);

        // when
        Optional<User> found = userRepository.findByUsername("alice");

        // then
        assertThat(found).isPresent();
        assertThat(found.get().getUsername()).isEqualTo("alice");
        assertThat(found.get().getId()).isNotNull();
    }

    @Test
    void existsByUsername_whenUserExists_returnsTrue() {
        // given
        User user = new User("bob");
        entityManager.persistAndFlush(user);

        // when
        boolean exists = userRepository.existsByUsername("bob");

        // then
        assertThat(exists).isTrue();
    }

    @Test
    void existsByUsername_whenUserDoesNotExist_returnsFalse() {
        // when
        boolean exists = userRepository.existsByUsername("charlie");

        // then
        assertThat(exists).isFalse();
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.repository.UserRepositoryTest"
```
Expected: FAIL with compilation errors.

- [ ] **Step 3: Implement User entity and UserRepository**

Create `src/main/java/group/four/nyare/nyare/model/User.java`:

```java
package group.four.nyare.nyare.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents an application user account.
 */
@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 64, message = "Username must be between 3 and 64 characters")
    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Course> courses = new ArrayList<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    /**
     * Default constructor for JPA proxy instantiation.
     */
    protected User() {
    }

    /**
     * Creates a user instance with a username.
     *
     * @param username the unique user name
     */
    public User(String username) {
        this.username = username;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public List<Course> getCourses() {
        return courses;
    }

    public void setCourses(List<Course> courses) {
        this.courses = courses;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                '}';
    }
}
```

Create `src/main/java/group/four/nyare/nyare/repository/UserRepository.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * Repository interface for User persistence operations.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their unique username.
     *
     * @param username the username to query
     * @return optional containing the user if present
     */
    Optional<User> findByUsername(String username);

    /**
     * Checks if a user exists with the given username.
     *
     * @param username the username to query
     * @return true if user exists, false otherwise
     */
    boolean existsByUsername(String username);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.repository.UserRepositoryTest"
```
Expected: PASS.

- [ ] **Step 5: Commit changes**

Commit:
`feat: add User entity and UserRepository`

---

### Task 2: Update Course Entity and Repository for Mandatory User Ownership

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/model/Course.java`
- Modify: `src/main/java/group/four/nyare/nyare/repository/CourseRepository.java`

**Interfaces:**
- Consumes: `User` entity
- Produces: `Course` entity with mandatory `User` relationship and `findByUserId(Long)` in `CourseRepository`

- [ ] **Step 1: Update Course entity to add mandatory User**

Modify `src/main/java/group/four/nyare/nyare/model/Course.java` to add:

```java
package group.four.nyare.nyare.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents an academic course or subject offering.
 * Acts as the aggregate root for schedules, notes, tasks, events, and academic context.
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private User user;

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    @Column(nullable = false, length = 128)
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    @Column(length = 1024)
    private String description;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Note> notes = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Schedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AcademicEvent> academicEvents = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AcademicContext> academicContexts = new ArrayList<>();

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Course() {
    }

    /**
     * Creates a new Course with required details.
     *
     * @param name        the name of the course
     * @param description optional description or course overview
     * @param user        the owner user
     */
    public Course(String name, String description, User user) {
        this.name = name;
        this.description = description;
        this.user = user;
    }

    /**
     * Overloaded constructor for tests where user is set via setter.
     *
     * @param name        the name of the course
     * @param description optional description
     */
    public Course(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public List<Note> getNotes() {
        return notes;
    }

    public void setNotes(List<Note> notes) {
        this.notes = notes;
    }

    public List<Schedule> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedule> schedules) {
        this.schedules = schedules;
    }

    public List<AcademicEvent> getAcademicEvents() {
        return academicEvents;
    }

    public void setAcademicEvents(List<AcademicEvent> academicEvents) {
        this.academicEvents = academicEvents;
    }

    public List<AcademicContext> getAcademicContexts() {
        return academicContexts;
    }

    public void setAcademicContexts(List<AcademicContext> academicContexts) {
        this.academicContexts = academicContexts;
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
```

- [ ] **Step 2: Update CourseRepository with findByUserId**

Modify `src/main/java/group/four/nyare/nyare/repository/CourseRepository.java`:

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Course} aggregate root entities.
 * Provides standard CRUD capabilities and query operations for course validation and management.
 */
public interface CourseRepository extends JpaRepository<Course, Long> {

    /**
     * Finds all courses owned by a specific user.
     *
     * @param userId the owner user identifier
     * @return list of courses for the given user
     */
    List<Course> findByUserId(Long userId);
}
```

- [ ] **Step 3: Verify compilation**

Run:
```powershell
./gradlew compileJava
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: add mandatory User relationship to Course entity and repository`

---

### Task 3: Update Existing Persistence and Integration Tests to Link Courses to Users

**Files:**
- Modify: `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/repository/TaskRepositoryTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`
- Modify: `src/test/java/group/four/nyare/nyare/ai/ImageAiProcessorIntegrationTest.java`

**Interfaces:**
- Consumes: `UserRepository`, `User` entity, `Course` entity
- Produces: Updated test suites where courses are saved with valid persisted users

- [ ] **Step 1: Update NoteRepositoryTest to persist a User before Course**

Modify `src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java` to inject `UserRepository`, persist a test `User`, and pass it to `new Course(...)`:

```java
@Autowired
private UserRepository userRepository;

private User defaultUser;

@BeforeEach
void setUp() {
    defaultUser = userRepository.save(new User("testuser_" + UUID.randomUUID()));
}
```
Update all `new Course(...)` usages in the test to include `defaultUser`.

- [ ] **Step 2: Update TaskRepositoryTest to persist a User before Course**

Modify `src/test/java/group/four/nyare/nyare/repository/TaskRepositoryTest.java` to inject `UserRepository`, persist a test `User`, and pass it to `new Course(...)`:

```java
@Autowired
private UserRepository userRepository;

private User defaultUser;

@BeforeEach
void setUp() {
    defaultUser = userRepository.save(new User("testuser_" + UUID.randomUUID()));
}
```
Update `new Course("CS101", "Intro", defaultUser)`.

- [ ] **Step 3: Update StudyPlannerControllerIntegrationTest to persist a User before Course**

Modify `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java` to persist a `User` and pass it to course instantiations.

- [ ] **Step 4: Update ImageAiProcessorIntegrationTest to persist a User before Course**

Modify `src/test/java/group/four/nyare/nyare/ai/ImageAiProcessorIntegrationTest.java` to persist a `User` and pass it to course instantiations.

- [ ] **Step 5: Run updated repository and controller tests**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest"
./gradlew test --tests "group.four.nyare.nyare.repository.TaskRepositoryTest"
```
Expected: PASS.

- [ ] **Step 6: Commit changes**

Commit:
`test: update repository and integration tests to link courses with users`

---

### Task 4: Create User and Course DTOs

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/dto/UserRequest.java`
- Create: `src/main/java/group/four/nyare/nyare/dto/LoginRequest.java`
- Create: `src/main/java/group/four/nyare/nyare/dto/UserResponse.java`
- Create: `src/main/java/group/four/nyare/nyare/dto/CourseRequest.java`
- Create: `src/main/java/group/four/nyare/nyare/dto/CourseResponse.java`

**Interfaces:**
- Consumes: Jakarta Validation annotations
- Produces: Request and response DTO classes for User and Course operations

- [ ] **Step 1: Create UserRequest DTO**

Create `src/main/java/group/four/nyare/nyare/dto/UserRequest.java`:

```java
package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating a user.
 */
public class UserRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 64, message = "Username must be between 3 and 64 characters")
    private String username;

    public UserRequest() {
    }

    public UserRequest(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
```

- [ ] **Step 2: Create LoginRequest DTO**

Create `src/main/java/group/four/nyare/nyare/dto/LoginRequest.java`:

```java
package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request payload for user authentication.
 */
public class LoginRequest {

    @NotBlank(message = "Username is required")
    private String username;

    public LoginRequest() {
    }

    public LoginRequest(String username) {
        this.username = username;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }
}
```

- [ ] **Step 3: Create UserResponse DTO**

Create `src/main/java/group/four/nyare/nyare/dto/UserResponse.java`:

```java
package group.four.nyare.nyare.dto;

import java.time.Instant;

/**
 * Response payload representing a user.
 */
public class UserResponse {

    private Long id;
    private String username;
    private Instant createdAt;
    private Instant updatedAt;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.username = username;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
```

- [ ] **Step 4: Create CourseRequest DTO**

Create `src/main/java/group/four/nyare/nyare/dto/CourseRequest.java`:

```java
package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating or updating a course.
 */
public class CourseRequest {

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    private String description;

    private Long userId;

    public CourseRequest() {
    }

    public CourseRequest(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public CourseRequest(String name, String description, Long userId) {
        this.name = name;
        this.description = description;
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
```

- [ ] **Step 5: Create CourseResponse DTO**

Create `src/main/java/group/four/nyare/nyare/dto/CourseResponse.java`:

```java
package group.four.nyare.nyare.dto;

/**
 * Response payload representing a course.
 */
public class CourseResponse {

    private Long id;
    private String name;
    private String description;
    private Long userId;

    public CourseResponse() {
    }

    public CourseResponse(Long id, String name, String description, Long userId) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userId = userId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}
```

- [ ] **Step 6: Verify compile**

Run:
```powershell
./gradlew compileJava
```
Expected: PASS.

- [ ] **Step 7: Commit changes**

Commit:
`feat: create UserRequest, UserResponse, LoginRequest, CourseRequest, and CourseResponse DTOs`

---

### Task 5: Implement UserService and UserServiceImpl

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/service/UserService.java`
- Create: `src/main/java/group/four/nyare/nyare/service/impl/UserServiceImpl.java`
- Test: `src/test/java/group/four/nyare/nyare/service/UserServiceImplTest.java`

**Interfaces:**
- Consumes: `UserRepository`, `UserRequest`, `LoginRequest`, `UserResponse`, `ResourceNotFoundException`, `BadRequestException`
- Produces: `UserService` contract and `@Service` implementation

- [ ] **Step 1: Write the unit test for UserServiceImpl**

Create `src/test/java/group/four/nyare/nyare/service/UserServiceImplTest.java`:

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new User("alice");
        ReflectionTestUtils.setField(sampleUser, "id", 1L);
        ReflectionTestUtils.setField(sampleUser, "createdAt", Instant.now());
        ReflectionTestUtils.setField(sampleUser, "updatedAt", Instant.now());
    }

    @Test
    void createUser_withValidRequest_returnsResponse() {
        // given
        UserRequest request = new UserRequest("alice");
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        // when
        UserResponse response = userService.createUser(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUsername()).isEqualTo("alice");
    }

    @Test
    void createUser_withDuplicateUsername_throwsBadRequestException() {
        // given
        UserRequest request = new UserRequest("alice");
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        // when & then
        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Username already exists: alice");
    }

    @Test
    void listUsers_returnsAllUsers() {
        // given
        when(userRepository.findAll()).thenReturn(List.of(sampleUser));

        // when
        List<UserResponse> users = userService.listUsers();

        // then
        assertThat(users).hasSize(1);
        assertThat(users.get(0).getUsername()).isEqualTo("alice");
    }

    @Test
    void getUserById_withValidId_returnsResponse() {
        // given
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // when
        UserResponse response = userService.getUserById(1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
    }

    @Test
    void getUserById_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 99");
    }

    @Test
    void deleteUser_withValidId_deletesUser() {
        // given
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        // when
        userService.deleteUser(1L);

        // then
        verify(userRepository).delete(sampleUser);
    }

    @Test
    void deleteUser_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.deleteUser(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 99");
    }

    @Test
    void authenticate_withValidUsername_returnsResponse() {
        // given
        LoginRequest request = new LoginRequest("alice");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(sampleUser));

        // when
        UserResponse response = userService.authenticate(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUsername()).isEqualTo("alice");
    }

    @Test
    void authenticate_withUnknownUsername_throwsResourceNotFoundException() {
        // given
        LoginRequest request = new LoginRequest("unknown");
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> userService.authenticate(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with username: unknown");
    }
}
```

- [ ] **Step 2: Implement UserService and UserServiceImpl**

Create `src/main/java/group/four/nyare/nyare/service/UserService.java`:

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;

/**
 * Service contract for user management and authentication operations.
 */
public interface UserService {

    /**
     * Creates a new user account.
     *
     * @param request the validated user payload
     * @return the created user response
     * @throws BadRequestException if the username already exists
     */
    UserResponse createUser(UserRequest request);

    /**
     * Retrieves all registered users.
     *
     * @return list of user responses
     */
    List<UserResponse> listUsers();

    /**
     * Retrieves a user by identifier.
     *
     * @param id the user identifier
     * @return the user response
     * @throws ResourceNotFoundException if user does not exist
     */
    UserResponse getUserById(Long id);

    /**
     * Deletes a user by identifier.
     *
     * @param id the user identifier
     * @throws ResourceNotFoundException if user does not exist
     */
    void deleteUser(Long id);

    /**
     * Authenticates a user by username.
     *
     * @param request the login payload
     * @return the authenticated user response
     * @throws ResourceNotFoundException if user does not exist
     */
    UserResponse authenticate(LoginRequest request);
}
```

Create `src/main/java/group/four/nyare/nyare/service/impl/UserServiceImpl.java`:

```java
package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for user lifecycle and authentication.
 */
@Service
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists: " + request.getUsername());
        }

        User user = new User(request.getUsername());
        User savedUser = userRepository.save(user);
        return toResponse(savedUser);
    }

    @Override
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        return toResponse(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + id));
        userRepository.delete(user);
    }

    @Override
    public UserResponse authenticate(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + request.getUsername()));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
```

- [ ] **Step 3: Run test to verify it passes**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.service.UserServiceImplTest"
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: implement UserService and UserServiceImpl`

---

### Task 6: Implement CourseService and CourseServiceImpl

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/service/CourseService.java`
- Create: `src/main/java/group/four/nyare/nyare/service/impl/CourseServiceImpl.java`
- Test: `src/test/java/group/four/nyare/nyare/service/CourseServiceImplTest.java`

**Interfaces:**
- Consumes: `CourseRepository`, `UserRepository`, `CourseRequest`, `CourseResponse`, `ResourceNotFoundException`, `BadRequestException`
- Produces: `CourseService` contract and `@Service` implementation

- [ ] **Step 1: Write the unit test for CourseServiceImpl**

Create `src/test/java/group/four/nyare/nyare/service/CourseServiceImplTest.java`:

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.CourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseServiceImpl courseService;

    private User sampleUser;
    private Course sampleCourse;

    @BeforeEach
    void setUp() {
        sampleUser = new User("alice");
        ReflectionTestUtils.setField(sampleUser, "id", 1L);

        sampleCourse = new Course("CS101", "Intro to CS", sampleUser);
        ReflectionTestUtils.setField(sampleCourse, "id", 10L);
    }

    @Test
    void createCourse_withSessionUser_createsAndReturnsCourse() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenReturn(sampleCourse);

        // when
        CourseResponse response = courseService.createCourse(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("CS101");
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    void createCourse_withFallbackUserIdInRequest_createsAndReturnsCourse() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS", 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenReturn(sampleCourse);

        // when
        CourseResponse response = courseService.createCourse(request, null);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    void createCourse_withoutUser_throwsBadRequestException() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");

        // when & then
        assertThatThrownBy(() -> courseService.createCourse(request, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User identifier is required to create a course");
    }

    @Test
    void listCourses_withSessionUser_returnsUserCourses() {
        // given
        when(courseRepository.findByUserId(1L)).thenReturn(List.of(sampleCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(1L, null);

        // then
        assertThat(courses).hasSize(1);
        assertThat(courses.get(0).getName()).isEqualTo("CS101");
    }

    @Test
    void listCourses_withoutFilter_returnsAllCourses() {
        // given
        when(courseRepository.findAll()).thenReturn(List.of(sampleCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(null, null);

        // then
        assertThat(courses).hasSize(1);
    }

    @Test
    void getCourse_withValidId_returnsCourse() {
        // given
        when(courseRepository.findById(10L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.getCourse(10L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    void deleteCourse_withValidId_deletesCourse() {
        // given
        when(courseRepository.findById(10L)).thenReturn(Optional.of(sampleCourse));

        // when
        courseService.deleteCourse(10L);

        // then
        verify(courseRepository).delete(sampleCourse);
    }
}
```

- [ ] **Step 2: Implement CourseService and CourseServiceImpl**

Create `src/main/java/group/four/nyare/nyare/service/CourseService.java`:

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;

/**
 * Service contract for course offering management.
 */
public interface CourseService {

    /**
     * Creates and persists a new course for a user.
     *
     * @param request       the validated course payload
     * @param sessionUserId optional user identifier from the active session
     * @return the created course response
     * @throws BadRequestException if no user identifier can be resolved
     * @throws ResourceNotFoundException if resolved user does not exist
     */
    CourseResponse createCourse(CourseRequest request, Long sessionUserId);

    /**
     * Lists courses filtered by user if present, or all courses.
     *
     * @param sessionUserId the active session user identifier
     * @param queryUserId   optional query parameter user identifier
     * @return list of course responses
     */
    List<CourseResponse> listCourses(Long sessionUserId, Long queryUserId);

    /**
     * Retrieves a single course by identifier.
     *
     * @param id the course identifier
     * @return the course response
     * @throws ResourceNotFoundException if course does not exist
     */
    CourseResponse getCourse(Long id);

    /**
     * Deletes a course by identifier.
     *
     * @param id the course identifier
     * @throws ResourceNotFoundException if course does not exist
     */
    void deleteCourse(Long id);
}
```

Create `src/main/java/group/four/nyare/nyare/service/impl/CourseServiceImpl.java`:

```java
package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.CourseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for course management.
 */
@Service
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CourseServiceImpl(CourseRepository courseRepository, UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CourseRequest request, Long sessionUserId) {
        Long targetUserId = sessionUserId != null ? sessionUserId : request.getUserId();
        if (targetUserId == null) {
            throw new BadRequestException("User identifier is required to create a course");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        Course course = new Course(request.getName(), request.getDescription(), user);
        Course savedCourse = courseRepository.save(course);
        return toResponse(savedCourse);
    }

    @Override
    public List<CourseResponse> listCourses(Long sessionUserId, Long queryUserId) {
        Long targetUserId = sessionUserId != null ? sessionUserId : queryUserId;
        if (targetUserId != null) {
            return courseRepository.findByUserId(targetUserId).stream()
                    .map(this::toResponse)
                    .toList();
        }

        return courseRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CourseResponse getCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        return toResponse(course);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        courseRepository.delete(course);
    }

    private CourseResponse toResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getUser() != null ? course.getUser().getId() : null
        );
    }
}
```

- [ ] **Step 3: Run test to verify it passes**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.service.CourseServiceImplTest"
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: implement CourseService and CourseServiceImpl`

---

### Task 7: Configure CORS Credential Support in WebConfig

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/config/WebConfig.java`
- Modify: `src/test/java/group/four/nyare/nyare/config/WebConfigTest.java`

**Interfaces:**
- Consumes: Spring Web MVC `CorsRegistry`
- Produces: CORS mapping with `.allowCredentials(true)` for cross-origin session cookies

- [ ] **Step 1: Update WebConfig to enable allowCredentials(true)**

Modify `src/main/java/group/four/nyare/nyare/config/WebConfig.java`:

```java
package group.four.nyare.nyare.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration enabling Cross-Origin Resource Sharing (CORS) for development.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:5173", "http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

- [ ] **Step 2: Run WebConfigTest**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.config.WebConfigTest"
```
Expected: PASS.

- [ ] **Step 3: Commit changes**

Commit:
`feat: enable allowCredentials in WebConfig CORS configuration`

---

### Task 8: Implement UserController with Session Authentication

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/controller/UserController.java`
- Test: `src/test/java/group/four/nyare/nyare/controller/UserControllerTest.java`

**Interfaces:**
- Consumes: `UserService`, `HttpSession`, `HttpServletRequest`, `UserRequest`, `LoginRequest`, `UserResponse`
- Produces: REST endpoints at `/api/users` (`POST`, `GET`, `GET /{id}`, `DELETE /{id}`, `POST /login`, `POST /logout`, `GET /me`)

- [ ] **Step 1: Write UserControllerTest**

Create `src/test/java/group/four/nyare/nyare/controller/UserControllerTest.java`:

```java
package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UserResponse sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new UserResponse(1L, "alice", Instant.now(), Instant.now());
    }

    @Test
    void createUser_withValidRequest_returnsCreated() throws Exception {
        // given
        UserRequest request = new UserRequest("alice");
        when(userService.createUser(any(UserRequest.class))).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/users/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void createUser_withInvalidUsername_returnsBadRequest() throws Exception {
        // given
        UserRequest request = new UserRequest("");

        // when & then
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listUsers_returnsList() throws Exception {
        // given
        when(userService.listUsers()).thenReturn(List.of(sampleUser));

        // when & then
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("alice"));
    }

    @Test
    void getUserById_withValidId_returnsUser() throws Exception {
        // given
        when(userService.getUserById(1L)).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void login_withValidUsername_setsSessionAttributeAndReturnsUser() throws Exception {
        // given
        LoginRequest request = new LoginRequest("alice");
        when(userService.authenticate(any(LoginRequest.class))).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(request().sessionAttribute(UserController.SESSION_USER_ID, 1L))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void logout_withActiveSession_invalidatesSession() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);

        // when & then
        mockMvc.perform(post("/api/users/logout").session(session))
                .andExpect(status().isNoContent());

        org.assertj.core.api.Assertions.assertThat(session.isInvalid()).isTrue();
    }

    @Test
    void getCurrentUser_withActiveSession_returnsUser() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        when(userService.getUserById(1L)).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void getCurrentUser_withoutActiveSession_returnsUnauthorized() throws Exception {
        // when & then
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteUser_withActiveSession_invalidatesSessionAndReturnsNoContent() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        doNothing().when(userService.deleteUser(1L));

        // when & then
        mockMvc.perform(delete("/api/users/1").session(session))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(1L);
        org.assertj.core.api.Assertions.assertThat(session.isInvalid()).isTrue();
    }
}
```

- [ ] **Step 2: Implement UserController**

Create `src/main/java/group/four/nyare/nyare/controller/UserController.java`:

```java
package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * REST controller managing user accounts and HTTP session authentication.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    public static final String SESSION_USER_ID = "USER_ID";

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        UserResponse createdUser = userService.createUser(request);
        URI location = URI.create("/api/users/" + createdUser.getId());
        return ResponseEntity.created(location).body(createdUser);
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> listUsers() {
        List<UserResponse> users = userService.listUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        userService.deleteUser(id);

        HttpSession session = request.getSession(false);
        if (session != null) {
            Long loggedInUserId = (Long) session.getAttribute(SESSION_USER_ID);
            if (id.equals(loggedInUserId)) {
                session.invalidate();
            }
        }

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request,
                                             HttpServletRequest httpRequest) {
        UserResponse authenticatedUser = userService.authenticate(request);
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(SESSION_USER_ID, authenticatedUser.getId());
        return ResponseEntity.ok(authenticatedUser);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        if (session == null || session.getAttribute(SESSION_USER_ID) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = (Long) session.getAttribute(SESSION_USER_ID);
        UserResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(user);
    }
}
```

- [ ] **Step 3: Run test to verify it passes**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.controller.UserControllerTest"
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: implement UserController with session authentication`

---

### Task 9: Implement CourseController

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/controller/CourseController.java`
- Test: `src/test/java/group/four/nyare/nyare/controller/CourseControllerTest.java`

**Interfaces:**
- Consumes: `CourseService`, `HttpSession`, `HttpServletRequest`, `CourseRequest`, `CourseResponse`
- Produces: REST endpoints at `/api/courses` (`POST`, `GET`, `GET /{id}`, `DELETE /{id}`)

- [ ] **Step 1: Write CourseControllerTest**

Create `src/test/java/group/four/nyare/nyare/controller/CourseControllerTest.java`:

```java
package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.service.CourseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CourseController.class)
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CourseService courseService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private CourseResponse sampleCourse;

    @BeforeEach
    void setUp() {
        sampleCourse = new CourseResponse(10L, "CS101", "Intro to CS", 1L);
    }

    @Test
    void createCourse_withSessionUser_returnsCreated() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        when(courseService.createCourse(any(CourseRequest.class), eq(1L))).thenReturn(sampleCourse);

        // when & then
        mockMvc.perform(post("/api/courses")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/courses/10"))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS101"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    void listCourses_withSession_returnsUserCourses() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        when(courseService.listCourses(eq(1L), any())).thenReturn(List.of(sampleCourse));

        // when & then
        mockMvc.perform(get("/api/courses").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("CS101"));
    }

    @Test
    void getCourse_withValidId_returnsCourse() throws Exception {
        // given
        when(courseService.getCourse(10L)).thenReturn(sampleCourse);

        // when & then
        mockMvc.perform(get("/api/courses/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS101"));
    }

    @Test
    void deleteCourse_withValidId_returnsNoContent() throws Exception {
        // given
        doNothing().when(courseService.deleteCourse(10L));

        // when & then
        mockMvc.perform(delete("/api/courses/10"))
                .andExpect(status().isNoContent());

        verify(courseService).deleteCourse(10L);
    }
}
```

- [ ] **Step 2: Implement CourseController**

Create `src/main/java/group/four/nyare/nyare/controller/CourseController.java`:

```java
package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.service.CourseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * REST controller managing course offerings.
 */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request,
                                                       HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        Long sessionUserId = session != null ? (Long) session.getAttribute(UserController.SESSION_USER_ID) : null;

        CourseResponse createdCourse = courseService.createCourse(request, sessionUserId);
        URI location = URI.create("/api/courses/" + createdCourse.getId());
        return ResponseEntity.created(location).body(createdCourse);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> listCourses(
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        Long sessionUserId = session != null ? (Long) session.getAttribute(UserController.SESSION_USER_ID) : null;

        List<CourseResponse> courses = courseService.listCourses(sessionUserId, userId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable Long id) {
        CourseResponse course = courseService.getCourse(id);
        return ResponseEntity.ok(course);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 3: Run test to verify it passes**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"
```
Expected: PASS.

- [ ] **Step 4: Commit changes**

Commit:
`feat: implement CourseController for course management`

---

### Task 10: Run Full Verification

**Files:**
- None (verification phase)

- [ ] **Step 1: Run all unit and slice tests for User and Course features**

Run:
```powershell
./gradlew test --tests "group.four.nyare.nyare.repository.UserRepositoryTest"
./gradlew test --tests "group.four.nyare.nyare.repository.NoteRepositoryTest"
./gradlew test --tests "group.four.nyare.nyare.repository.TaskRepositoryTest"
./gradlew test --tests "group.four.nyare.nyare.service.UserServiceImplTest"
./gradlew test --tests "group.four.nyare.nyare.service.CourseServiceImplTest"
./gradlew test --tests "group.four.nyare.nyare.controller.UserControllerTest"
./gradlew test --tests "group.four.nyare.nyare.controller.CourseControllerTest"
./gradlew test --tests "group.four.nyare.nyare.config.WebConfigTest"
```
Expected: All test classes PASS.

- [ ] **Step 2: Update knowledge graph**

Run:
```powershell
graphify update .
```
Expected: Graph updated.
