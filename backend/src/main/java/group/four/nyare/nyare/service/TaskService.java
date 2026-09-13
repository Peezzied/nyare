package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.dto.TaskStatusRequest;
import group.four.nyare.nyare.model.enums.TaskStatus;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for academic task management, lifecycle transitions, and study plan operations.
 */
public interface TaskService {

    /**
     * Creates and persists a new academic task associated with a valid course offering.
     *
     * @param request the validated task creation payload
     * @return the persisted task response representation
     */
    TaskResponse createTask(TaskRequest request);

    /**
     * Retrieves all tasks matching optional course, status, and scheduling filter criteria.
     *
     * @param courseId  optional course ID filter; {@code null} to match all courses
     * @param status    optional task status filter; {@code null} to match all statuses
     * @param scheduled optional scheduling filter: {@code true} for scheduled tasks,
     *                  {@code false} for unscheduled/later tasks, or {@code null} for all tasks
     * @return list of matching task responses, ordered by creation date descending
     */
    List<TaskResponse> listTasks(Long courseId, TaskStatus status, Boolean scheduled);

    /**
     * Retrieves a single task by its unique identifier.
     *
     * @param id the unique UUID of the task
     * @return the task response representation
     */
    TaskResponse getTask(UUID id);

    /**
     * Fully updates an existing task with replacement data, including potential course re-association.
     *
     * @param id      the unique UUID of the task to update
     * @param request the replacement task payload
     * @return the updated task response representation
     */
    TaskResponse updateTask(UUID id, TaskRequest request);

    /**
     * Updates only the lifecycle status of an existing task.
     *
     * @param id      the unique UUID of the task
     * @param request the status update payload
     * @return the updated task response representation
     */
    TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request);

    /**
     * Deletes an existing task by its unique identifier.
     *
     * @param id the unique UUID of the task to delete
     */
    void deleteTask(UUID id);
}
