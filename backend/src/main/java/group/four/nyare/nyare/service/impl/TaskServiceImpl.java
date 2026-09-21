package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.TaskService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service implementation for academic task management.
 * Handles task operations, course validation, note ownership verification, and transaction boundaries.
 */
@Service
@Transactional(readOnly = true)
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final CourseRepository courseRepository;
    private final NoteRepository noteRepository;

    public TaskServiceImpl(TaskRepository taskRepository,
                           CourseRepository courseRepository,
                           NoteRepository noteRepository) {
        this.taskRepository = taskRepository;
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
    }

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        Course course = findCourseOrThrow(request.getCourseId());
        Note note = validateAndGetNote(request.getNoteId(), course.getId());

        Task task = new Task(course, request.getTitle());
        task.setNote(note);
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
        Note note = validateAndGetNote(request.getNoteId(), course.getId());

        task.setCourse(course);
        task.setNote(note);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setScheduledDate(request.getScheduledDate());
        task.setDuration(request.getDuration());
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }

        Task savedTask = taskRepository.save(task);
        return toResponse(savedTask);
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request) {
        Task task = findTaskOrThrow(id);
        task.setStatus(request.getStatus());

        Task savedTask = taskRepository.save(task);
        return toResponse(savedTask);
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

    private Note validateAndGetNote(UUID noteId, Long courseId) {
        if (noteId == null) {
            return null;
        }
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + noteId));
        if (!note.getCourse().getId().equals(courseId)) {
            throw new BadRequestException("Note with ID " + noteId + " does not belong to Course with ID " + courseId);
        }
        return note;
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
