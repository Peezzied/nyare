package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.model.enums.TaskStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service contract for academic task management, lifecycle transitions, and study plan operations.
 */
public interface TaskService {

    /**
     * Creates and persists a new academic task owned by the session user.
     *
     * @param request the validated task creation payload
     * @param userId  the owner user identifier from the active session
     * @return the persisted task response representation
     */
    TaskResponse createTask(TaskRequest request, Long userId);

    /**
     * Retrieves all tasks matching optional course, status, and scheduling filter criteria.
     *
     * @param courseId  optional course ID filter; {@code null} to match all courses
     * @param status    optional task status filter; {@code null} to match all statuses
     * @param scheduled optional scheduling filter: {@code true} for scheduled tasks,
     *                  {@code false} for unscheduled/later tasks, or {@code null} for all tasks
     * @param archived  {@code true} to list tasks of archived courses, {@code false} for active courses
     * @param q         optional case-insensitive substring matched against title and description
     * @param from      optional inclusive lower bound on {@code scheduledDate}
     * @param to        optional inclusive upper bound on {@code scheduledDate}
     * @return list of matching task responses, ordered by creation date descending
     */
    List<TaskResponse> listTasks(Long userId, Long courseId, TaskStatus status, Boolean scheduled,
                                 Boolean archived, String q, LocalDate from, LocalDate to);

    /**
     * Retrieves a single task owned by the session user.
     *
     * @param id     the unique UUID of the task
     * @param userId the owner user identifier from the active session
     * @return the task response representation
     */
    TaskResponse getTask(UUID id, Long userId);

    /**
     * Fully updates an existing task owned by the session user.
     *
     * @param id      the unique UUID of the task to update
     * @param request the replacement task payload
     * @param userId  the owner user identifier from the active session
     * @return the updated task response representation
     */
    TaskResponse updateTask(UUID id, TaskRequest request, Long userId);

    /**
     * Updates only the lifecycle status of an existing task owned by the session user.
     *
     * @param id      the unique UUID of the task
     * @param request the status update payload
     * @param userId  the owner user identifier from the active session
     * @return the updated task response representation
     */
    TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request, Long userId);

    /**
     * Deletes an existing task owned by the session user.
     *
     * @param id     the unique UUID of the task to delete
     * @param userId the owner user identifier from the active session
     */
    void deleteTask(UUID id, Long userId);
}
