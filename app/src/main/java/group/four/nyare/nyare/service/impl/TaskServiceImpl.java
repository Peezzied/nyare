package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.MutationAction;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.ai.observability.event.TriggerSource;
import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.TaskService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TaskServiceImpl implements TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskServiceImpl.class);

    private final TaskRepository taskRepository;
    private final CourseRepository courseRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TaskServiceImpl(TaskRepository taskRepository,
                           CourseRepository courseRepository,
                           ApplicationEventPublisher eventPublisher) {
        this.taskRepository = taskRepository;
        this.courseRepository = courseRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request, Long userId) {
        Course course = findCourseOrThrow(request.getCourseId(), userId);
        requireActiveCourse(course);

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
        publishMutation(MutationAction.CREATE, savedTask, userId,
                "Task created: '" + savedTask.getTitle() + "'");
        return toResponse(savedTask);
    }

    @Override
    public List<TaskResponse> listTasks(Long userId, Long courseId, TaskStatus status, Boolean scheduled,
                                        Boolean archived, String q, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("from must not be after to");
        }
        String pattern = (q == null || q.isBlank()) ? null : '%' + q.toLowerCase() + '%';
        return taskRepository.findAllFiltered(userId, courseId, status, scheduled, archived, pattern, from, to)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public TaskResponse getTask(UUID id, Long userId) {
        Task task = findTaskOrThrow(id, userId);
        return toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse updateTask(UUID id, TaskRequest request, Long userId) {
        Task task = findTaskOrThrow(id, userId);
        requireActiveCourse(task.getCourse());
        Course course = findCourseOrThrow(request.getCourseId(), userId);
        requireActiveCourse(course);

        task.setCourse(course);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setScheduledDate(request.getScheduledDate());
        task.setDuration(request.getDuration());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        publishMutation(MutationAction.UPDATE, task, userId,
                "Task updated: '" + task.getTitle() + "'");
        return toResponse(task);
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request, Long userId) {
        Task task = findTaskOrThrow(id, userId);
        requireActiveCourse(task.getCourse());
        task.setStatus(request.getStatus());

        publishMutation(MutationAction.UPDATE, task, userId,
                "Task status changed to " + task.getStatus() + ": '" + task.getTitle() + "'");
        return toResponse(task);
    }

    @Override
    @Transactional
    public void deleteTask(UUID id, Long userId) {
        Task task = findTaskOrThrow(id, userId);
        requireActiveCourse(task.getCourse());
        taskRepository.delete(task);
        publishMutation(MutationAction.DELETE, task, userId,
                "Task deleted: '" + task.getTitle() + "'");
    }

    /**
     * Publishes a {@link AuditCategory#DATA_MUTATION} trace event for a task
     * mutation. Listener failures are swallowed: dev tooling must never break
     * a mutation.
     */
    private void publishMutation(MutationAction action, Task task, Long userId, String summary) {
        try {
            Course course = task.getCourse();
            User user = course != null ? course.getUser() : null;
            Note note = task.getNote();
            AuditTraceEvent event = new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                    summary, userId, user != null ? user.getUsername() : null,
                    TriggerSource.WEB_SESSION, action, TraceKind.task,
                    String.valueOf(task.getId()), summary,
                    null, note != null ? note.getId() : null, task.getId(), null, null,
                    course != null ? course.getId() : null,
                    null, null, null, null, null, null);
            // Defer until afterCommit so a commit-time rollback cannot leave a
            // phantom mutation event in the dev trace feed.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        publishEvent(event);
                    }
                });
            } else {
                publishEvent(event);
            }
        } catch (Exception e) {
            log.warn("Audit trace listener failed for task {} event: {}", action, e.getMessage());
        }
    }

    private void publishEvent(AuditTraceEvent event) {
        try {
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.warn("Audit trace listener failed for {} {} event: {}",
                    event.entityKind(), event.mutationAction(), e.getMessage());
        }
    }

    private Task findTaskOrThrow(UUID id, Long userId) {
        return taskRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));
    }

    private Course findCourseOrThrow(Long courseId, Long userId) {
        return courseRepository.findByIdAndUserId(courseId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + courseId));
    }

    private void requireActiveCourse(Course course) {
        if (course.getArchivedAt() != null) {
            throw new BadRequestException("Course is archived");
        }
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