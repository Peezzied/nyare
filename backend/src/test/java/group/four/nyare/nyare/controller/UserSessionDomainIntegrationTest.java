package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserSessionDomainIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private AcademicEventRepository academicEventRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private AcademicContextRepository academicContextRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void cleanDatabase() {
        academicContextRepository.deleteAll();
        academicEventRepository.deleteAll();
        taskRepository.deleteAll();
        noteRepository.deleteAll();
        scheduleRepository.deleteAll();
        courseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("user lifecycle: registers, prevents duplicates, lists, logs in, accesses me, and logs out")
    void userLifecycle_registersLogsInChecksMeAndLogsOut() throws Exception {
        // Register User A
        UserRequest requestAlice = new UserRequest("alice");
        MvcResult createResult = mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestAlice)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.username").value("alice"))
                .andReturn();

        Number aliceIdNum = com.jayway.jsonpath.JsonPath.read(createResult.getResponse().getContentAsString(), "$.id");
        Long aliceId = aliceIdNum.longValue();

        // Duplicate registration must fail with 400 Bad Request
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestAlice)))
                .andExpect(status().isBadRequest());

        // Register User B
        UserRequest requestBob = new UserRequest("bob");
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestBob)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("bob"));

        // List all users
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].username").value("alice"))
                .andExpect(jsonPath("$[1].username").value("bob"));

        // Get user by ID
        mockMvc.perform(get("/api/users/" + aliceId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(aliceId))
                .andExpect(jsonPath("$.username").value("alice"));

        // Unauthenticated access to /api/users/me returns 401 Unauthorized
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());

        // Log in as Alice
        LoginRequest loginAlice = new LoginRequest("alice");
        MvcResult loginResult = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAlice)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(aliceId))
                .andExpect(jsonPath("$.username").value("alice"))
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();
        assertThat(session).isNotNull();
        assertThat(session.getAttribute(UserController.SESSION_USER_ID)).isEqualTo(aliceId);

        // Authenticated access to /api/users/me returns Alice profile
        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(aliceId))
                .andExpect(jsonPath("$.username").value("alice"));

        // Log out Alice
        mockMvc.perform(post("/api/users/logout").session(session))
                .andExpect(status().isNoContent());

        // Subsequent access with invalidated session returns 401 Unauthorized
        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("session scoped access: isolates tasks, notes, and academic events strictly by session user")
    void sessionScopedAccess_tasksNotesAndEvents_isolatesDataBetweenUsers() throws Exception {
        // Given: Seed User A with Course, Task, Note, and Event
        User userA = userRepository.save(new User("user_a"));
        Course courseA = courseRepository.save(new Course("Computer Science 1", "Intro course", userA));

        Task taskA = new Task(courseA, "Task A - Binary Trees");
        taskA.setScheduledDate(LocalDate.now().plusDays(1));
        taskA.setStatus(TaskStatus.TODO);
        taskRepository.save(taskA);

        Note noteA = noteRepository.save(new Note(courseA, "Notes for CS1 Lecture 1"));
        AcademicEvent eventA = academicEventRepository.save(new AcademicEvent(
                courseA, noteA, "Midterm Exam CS1", "Covers Trees", LocalDateTime.now().plusDays(5)
        ));

        // Given: Seed User B with Course, Task, Note, and Event
        User userB = userRepository.save(new User("user_b"));
        Course courseB = courseRepository.save(new Course("Math 2", "Calculus course", userB));

        Task taskB = new Task(courseB, "Task B - Integration by parts");
        taskB.setScheduledDate(LocalDate.now().plusDays(2));
        taskB.setStatus(TaskStatus.TODO);
        taskRepository.save(taskB);

        Note noteB = noteRepository.save(new Note(courseB, "Notes for Math 2 Lecture 1"));
        AcademicEvent eventB = academicEventRepository.save(new AcademicEvent(
                courseB, noteB, "Quiz 1 Math 2", "Integration test", LocalDateTime.now().plusDays(3)
        ));

        // Login as User A
        MvcResult loginResultA = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("user_a"))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession sessionA = (MockHttpSession) loginResultA.getRequest().getSession();

        // Login as User B
        MvcResult loginResultB = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("user_b"))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession sessionB = (MockHttpSession) loginResultB.getRequest().getSession();

        // When User A requests tasks, notes, events -> User A receives only their own records
        mockMvc.perform(get("/api/tasks").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Task A - Binary Trees"))
                .andExpect(jsonPath("$[0].courseId").value(courseA.getId()));

        mockMvc.perform(get("/api/notes").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].courseId").value(courseA.getId()));

        mockMvc.perform(get("/api/academic-events").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Midterm Exam CS1"))
                .andExpect(jsonPath("$[0].courseId").value(courseA.getId()));

        // When User B requests tasks, notes, events -> User B receives only their own records
        mockMvc.perform(get("/api/tasks").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Task B - Integration by parts"))
                .andExpect(jsonPath("$[0].courseId").value(courseB.getId()));

        mockMvc.perform(get("/api/notes").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].courseId").value(courseB.getId()));

        mockMvc.perform(get("/api/academic-events").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Quiz 1 Math 2"))
                .andExpect(jsonPath("$[0].courseId").value(courseB.getId()));
    }

    @Test
    @DisplayName("cascading deletion: deleting a course purges child tasks, notes, events, and schedules")
    void cascadingDeletion_courseDeletion_removesChildTasksNotesEventsAndSchedules() throws Exception {
        // Given: User and Course with child entities
        User user = userRepository.save(new User("cascade_user"));
        Course course = courseRepository.save(new Course("Physics 101", "Mechanics", user));

        Task task = taskRepository.save(new Task(course, "Lab report"));
        Note note = noteRepository.save(new Note(course, "Kinematics formula note"));
        AcademicEvent event = academicEventRepository.save(new AcademicEvent(
                course, note, "Physics Prelim", "Covers Chapter 1-3", LocalDateTime.now().plusDays(4)
        ));
        Schedule schedule = scheduleRepository.save(new Schedule(
                course, DayOfWeek.MONDAY, LocalTime.of(8, 0), LocalTime.of(10, 0)
        ));

        assertThat(courseRepository.count()).isEqualTo(1);
        assertThat(taskRepository.count()).isEqualTo(1);
        assertThat(noteRepository.count()).isEqualTo(1);
        assertThat(academicEventRepository.count()).isEqualTo(1);
        assertThat(scheduleRepository.count()).isEqualTo(1);

        // When: Delete course via endpoint
        mockMvc.perform(delete("/api/courses/" + course.getId()))
                .andExpect(status().isNoContent());

        // Then: Course and all child records are removed
        assertThat(courseRepository.findById(course.getId())).isEmpty();
        assertThat(taskRepository.findById(task.getId())).isEmpty();
        assertThat(noteRepository.findById(note.getId())).isEmpty();
        assertThat(academicEventRepository.findById(event.getId())).isEmpty();
        assertThat(scheduleRepository.findById(schedule.getId())).isEmpty();

        // User persists
        assertThat(userRepository.findById(user.getId())).isPresent();
    }

    @Test
    @DisplayName("cascading deletion: deleting a user purges courses, child records, and invalidates session")
    void cascadingDeletion_userDeletion_removesCoursesAndAllChildRecords() throws Exception {
        // Given: User with Course and child entities
        User user = userRepository.save(new User("user_to_delete"));
        Course course = courseRepository.save(new Course("Biology 1", "General Bio", user));

        Task task = taskRepository.save(new Task(course, "Dissection report"));
        Note note = noteRepository.save(new Note(course, "Cell structure lecture"));
        AcademicEvent event = academicEventRepository.save(new AcademicEvent(
                course, note, "Bio Quiz", "Cell division", LocalDateTime.now().plusDays(2)
        ));
        Schedule schedule = scheduleRepository.save(new Schedule(
                course, DayOfWeek.FRIDAY, LocalTime.of(13, 0), LocalTime.of(15, 0)
        ));

        // Login as the user
        MvcResult loginResult = mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest("user_to_delete"))))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();

        // When: Delete user via endpoint with active session
        mockMvc.perform(delete("/api/users/" + user.getId()).session(session))
                .andExpect(status().isNoContent());

        // Then: User, Course, and all child entities are removed
        assertThat(userRepository.findById(user.getId())).isEmpty();
        assertThat(courseRepository.findById(course.getId())).isEmpty();
        assertThat(taskRepository.findById(task.getId())).isEmpty();
        assertThat(noteRepository.findById(note.getId())).isEmpty();
        assertThat(academicEventRepository.findById(event.getId())).isEmpty();
        assertThat(scheduleRepository.findById(schedule.getId())).isEmpty();

        // Session was invalidated
        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isUnauthorized());
    }
}
