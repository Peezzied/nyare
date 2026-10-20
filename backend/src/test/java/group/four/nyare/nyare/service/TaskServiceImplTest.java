package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.impl.TaskServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

    private Course sampleCourse;
    private Task sampleTask;
    private UUID taskId;

    @BeforeEach
    void setUp() {
        sampleCourse = new Course("Algorithms", "Core CS");
        ReflectionTestUtils.setField(sampleCourse, "id", 1L);

        sampleTask = new Task(sampleCourse, "Implement Dijkstra");
        taskId = UUID.randomUUID();
        ReflectionTestUtils.setField(sampleTask, "id", taskId);
    }

    @Test
    @DisplayName("createTask creates and returns task when course exists")
    void createTask_withValidRequest_returnsResponse() {
        TaskRequest request = new TaskRequest(1L, "Implement Dijkstra", "Shortest path",
                LocalDate.of(2026, 10, 5), Duration.ofMinutes(90), TaskStatus.TODO);
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(sampleCourse));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            ReflectionTestUtils.setField(t, "id", taskId);
            return t;
        });

        TaskResponse response = taskService.createTask(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Implement Dijkstra");
        assertThat(response.getCourseId()).isEqualTo(1L);
        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    @DisplayName("createTask defaults status to TODO when status is null")
    void createTask_withNullStatus_defaultsToTodo() {
        TaskRequest request = new TaskRequest(1L, "Implement Dijkstra", "Shortest path",
                null, null, null);
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(sampleCourse));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            ReflectionTestUtils.setField(t, "id", taskId);
            return t;
        });

        TaskResponse response = taskService.createTask(request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    @DisplayName("createTask throws ResourceNotFoundException when course is not found")
    void createTask_withUnknownCourse_throwsResourceNotFoundException() {
        TaskRequest request = new TaskRequest(99L, "Implement Dijkstra", null, null, null, null);
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.createTask(request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("createTask throws ResourceNotFoundException when the course belongs to another user")
    void createTask_courseOfOtherUser_throwsResourceNotFound() {
        TaskRequest request = new TaskRequest(1L, "Implement Dijkstra", null, null, null, null);
        when(courseRepository.findByIdAndUserId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.createTask(request, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("listTasks scopes results to the session user")
    void listTasks_scopedToUser_returnsOnlyOwnData() {
        Task otherTask = new Task(sampleCourse, "Write report");
        ReflectionTestUtils.setField(otherTask, "id", UUID.randomUUID());
        when(taskRepository.findAllFiltered(42L, 1L, TaskStatus.TODO, true))
                .thenReturn(List.of(sampleTask, otherTask));

        List<TaskResponse> responses = taskService.listTasks(42L, 1L, TaskStatus.TODO, true);

        assertThat(responses).hasSize(2);
        verify(taskRepository).findAllFiltered(42L, 1L, TaskStatus.TODO, true);
    }

    @Test
    @DisplayName("getTask returns task when found")
    void getTask_withValidId_returnsTask() {
        when(taskRepository.findByIdAndCourseUserId(taskId, 1L)).thenReturn(Optional.of(sampleTask));

        TaskResponse response = taskService.getTask(taskId, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(taskId);
        assertThat(response.getTitle()).isEqualTo("Implement Dijkstra");
    }

    @Test
    @DisplayName("getTask throws ResourceNotFoundException when task not found")
    void getTask_withUnknownId_throwsResourceNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        when(taskRepository.findByIdAndCourseUserId(unknownId, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTask(unknownId, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Task not found with ID: " + unknownId);
    }

    @Test
    @DisplayName("getTask throws ResourceNotFoundException when the task belongs to another user")
    void getTask_otherUser_throwsResourceNotFound() {
        when(taskRepository.findByIdAndCourseUserId(taskId, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTask(taskId, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateTask updates task and course when valid")
    void updateTask_withValidRequest_updatesAndReturnsTask() {
        TaskRequest request = new TaskRequest(1L, "Updated Title", "Updated Description",
                LocalDate.of(2026, 10, 6), Duration.ofMinutes(45), TaskStatus.IN_PROGRESS);
        when(taskRepository.findByIdAndCourseUserId(taskId, 1L)).thenReturn(Optional.of(sampleTask));
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(sampleCourse));

        TaskResponse response = taskService.updateTask(taskId, request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Updated Title");
        assertThat(response.getDescription()).isEqualTo("Updated Description");
        assertThat(response.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("updateTask throws ResourceNotFoundException when task not found")
    void updateTask_withUnknownTask_throwsResourceNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        TaskRequest request = new TaskRequest(1L, "Title", null, null, null, null);
        when(taskRepository.findByIdAndCourseUserId(unknownId, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(unknownId, request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Task not found with ID: " + unknownId);
    }

    @Test
    @DisplayName("updateTask throws ResourceNotFoundException when course not found")
    void updateTask_withUnknownCourse_throwsResourceNotFoundException() {
        TaskRequest request = new TaskRequest(99L, "Title", null, null, null, null);
        when(taskRepository.findByIdAndCourseUserId(taskId, 1L)).thenReturn(Optional.of(sampleTask));
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(taskId, request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("updateTask throws ResourceNotFoundException when the task belongs to another user")
    void updateTask_otherUser_throwsResourceNotFound() {
        TaskRequest request = new TaskRequest(1L, "Title", null, null, null, null);
        when(taskRepository.findByIdAndCourseUserId(taskId, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(taskId, request, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateTaskStatus updates status when task exists")
    void updateTaskStatus_withValidId_updatesStatus() {
        TaskStatusRequest request = new TaskStatusRequest(TaskStatus.COMPLETED);
        when(taskRepository.findByIdAndCourseUserId(taskId, 1L)).thenReturn(Optional.of(sampleTask));

        TaskResponse response = taskService.updateTaskStatus(taskId, request, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    @DisplayName("updateTaskStatus throws ResourceNotFoundException when the task belongs to another user")
    void updateTaskStatus_otherUser_throwsResourceNotFound() {
        TaskStatusRequest request = new TaskStatusRequest(TaskStatus.COMPLETED);
        when(taskRepository.findByIdAndCourseUserId(taskId, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTaskStatus(taskId, request, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteTask deletes task when task exists")
    void deleteTask_withValidId_deletesTask() {
        when(taskRepository.findByIdAndCourseUserId(taskId, 1L)).thenReturn(Optional.of(sampleTask));

        taskService.deleteTask(taskId, 1L);

        verify(taskRepository).delete(sampleTask);
    }

    @Test
    @DisplayName("deleteTask throws ResourceNotFoundException when task not found")
    void deleteTask_withUnknownId_throwsResourceNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        when(taskRepository.findByIdAndCourseUserId(unknownId, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.deleteTask(unknownId, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Task not found with ID: " + unknownId);
    }

    @Test
    @DisplayName("deleteTask throws ResourceNotFoundException when the task belongs to another user")
    void deleteTask_otherUser_throwsResourceNotFound() {
        when(taskRepository.findByIdAndCourseUserId(taskId, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.deleteTask(taskId, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
