package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.TaskService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final CourseRepository courseRepository;

    public TaskServiceImpl(TaskRepository taskRepository,
                           CourseRepository courseRepository) {
        this.taskRepository = taskRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        Course course = findCourseOrThrow(request.getCourseId());

        Task task = new Task(course, request.getTitle());
        task.setDescription(request.getDescription());
        task.setScheduledDate(request.getScheduledDate());
        task.setDuration(request.getDuration());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        } else {
            task.setStatus(TaskStatus.TODO);
        }

        Task savedTask = taskRepository.save(task);
        return toResponse(savedTask);
    }

    @Override
    public List<TaskResponse> listTasks(Long courseId, TaskStatus status, Boolean scheduled) {
        return taskRepository.findAllFiltered(courseId, status, scheduled)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TaskResponse getTask(UUID id) {
        Task task = findTaskOrThrow(id);
        return toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID id, TaskRequest request) {
        Task task = findTaskOrThrow(id);
        Course course = findCourseOrThrow(request.getCourseId());

        task.setCourse(course);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setScheduledDate(request.getScheduledDate());
        task.setDuration(request.getDuration());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        return toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request) {
        Task task = findTaskOrThrow(id);
        task.setStatus(request.getStatus());

        return toResponse(task);
    }

    @Override
    @Transactional
    public void deleteTask(UUID id) {
        Task task = findTaskOrThrow(id);
        taskRepository.delete(task);
    }

    private Task findTaskOrThrow(UUID id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));
    }

    private Course findCourseOrThrow(Long courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));
    }

    private TaskResponse toResponse(Task task) {
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