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

    private User defaultUser;

    @BeforeEach
    void setUp() {
        defaultUser = userRepository.save(new User("testuser_" + UUID.randomUUID()));
    }

    @Test
    @DisplayName("findByStatusNotOrderByCreatedAtDesc excludes COMPLETED tasks across all courses")
    void findByStatusNot_excludesCompleted() {
        Course c1 = courseRepository.save(new Course("CS101", "Intro", defaultUser));
        Course c2 = courseRepository.save(new Course("CS202", "Data Structures", defaultUser));

        Task todo = taskRepository.save(new Task(c1, "Todo task"));

        Task inProgress = new Task(c2, "In-progress task");
        inProgress.setStatus(TaskStatus.IN_PROGRESS);
        inProgress = taskRepository.save(inProgress);

        Task completed = new Task(c1, "Completed task");
        completed.setStatus(TaskStatus.COMPLETED);
        completed = taskRepository.save(completed);

        List<Task> open = taskRepository.findByStatusNotOrderByCreatedAtDesc(TaskStatus.COMPLETED);

        assertThat(open).extracting(Task::getId)
                .containsExactlyInAnyOrder(todo.getId(), inProgress.getId())
                .doesNotContain(completed.getId());
    }
}
