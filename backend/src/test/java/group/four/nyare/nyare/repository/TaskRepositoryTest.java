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

import java.time.LocalDate;
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
    private Course course1;
    private Course course2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
        course1 = courseRepository.save(new Course("CS101", "Intro to CS", user1));
        course2 = courseRepository.save(new Course("CS202", "Data Structures", user2));
    }

    @Test
    @DisplayName("findAllFiltered isolates tasks between different users")
    void findAllFiltered_isolatesTasksBetweenUsers() {
        Task task1 = taskRepository.save(new Task(course1, "User 1 Task"));
        Task task2 = taskRepository.save(new Task(course2, "User 2 Task"));

        List<Task> user1Tasks = taskRepository.findAllFiltered(user1.getId(), null, null, null);
        List<Task> user2Tasks = taskRepository.findAllFiltered(user2.getId(), null, null, null);

        assertThat(user1Tasks).extracting(Task::getId).containsExactly(task1.getId());
        assertThat(user2Tasks).extracting(Task::getId).containsExactly(task2.getId());
    }

    @Test
    @DisplayName("findAllFiltered filters by course ID, status, and scheduled flag")
    void findAllFiltered_appliesFiltersCorrectly() {
        Course course1b = courseRepository.save(new Course("CS103", "Algorithms", user1));

        Task scheduledTodo = new Task(course1, "Scheduled Todo");
        scheduledTodo.setScheduledDate(LocalDate.now().plusDays(1));
        scheduledTodo.setStatus(TaskStatus.TODO);
        scheduledTodo = taskRepository.save(scheduledTodo);

        Task unscheduledInProgress = new Task(course1, "Unscheduled In Progress");
        unscheduledInProgress.setStatus(TaskStatus.IN_PROGRESS);
        unscheduledInProgress = taskRepository.save(unscheduledInProgress);

        Task otherCourseTask = taskRepository.save(new Task(course1b, "Other Course Task"));

        List<Task> course1Tasks = taskRepository.findAllFiltered(user1.getId(), course1.getId(), null, null);
        assertThat(course1Tasks).extracting(Task::getId)
                .containsExactlyInAnyOrder(scheduledTodo.getId(), unscheduledInProgress.getId());

        List<Task> scheduledTasks = taskRepository.findAllFiltered(user1.getId(), null, null, true);
        assertThat(scheduledTasks).extracting(Task::getId).containsExactly(scheduledTodo.getId());

        List<Task> unscheduledTasks = taskRepository.findAllFiltered(user1.getId(), null, null, false);
        assertThat(unscheduledTasks).extracting(Task::getId)
                .containsExactlyInAnyOrder(unscheduledInProgress.getId(), otherCourseTask.getId());

        List<Task> inProgressTasks = taskRepository.findAllFiltered(user1.getId(), null, TaskStatus.IN_PROGRESS, null);
        assertThat(inProgressTasks).extracting(Task::getId).containsExactly(unscheduledInProgress.getId());
    }
}
