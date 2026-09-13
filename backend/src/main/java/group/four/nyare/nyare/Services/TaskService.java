package group.four.nyare.nyare.Services;

import group.four.nyare.nyare.DTOs.TaskRequest;
import group.four.nyare.nyare.DTOs.TaskResponse;
import group.four.nyare.nyare.DTOs.TaskStatusRequest;
import group.four.nyare.nyare.Models.Enums.TaskStatus;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for academic task management, lifecycle transitions, and study plan operations.
 * <p>
 * Specifications for developers / implementors:
 * <ul>
 *   <li>All mutations and queries should execute within active transactions (e.g. {@code @Transactional}).</li>
 *   <li>Open-In-View is disabled ({@code spring.jpa.open-in-view=false}); all entity-to-DTO mappings must be resolved within the service layer.</li>
 *   <li>Entities must never escape past the service boundary; callers interact exclusively through DTOs.</li>
 *   <li>Course existence must be validated before persisting new tasks or updating existing task associations.</li>
 *   <li>Expected Exceptions: Implementors should throw an appropriate runtime "not found" exception
 *       (e.g., {@code ResourceNotFoundException}) mapping to HTTP 404 Problem Details when target entities are absent.</li>
 * </ul>
 */
public interface TaskService {

    /**
     * Creates and persists a new academic task associated with a valid course offering.
     * <p>
     * <b>Exception expectation:</b> Throws a runtime "not found" exception (e.g. {@code ResourceNotFoundException})
     * if the referenced {@code courseId} does not exist in the database.
     *
     * @param request the validated task creation payload
     * @return the persisted task response representation
     * @throws IllegalArgumentException if the request payload violates domain constraints
     */
    TaskResponse createTask(TaskRequest request);

    /**
     * Retrieves all tasks matching optional course, status, and scheduling filter criteria.
     *
     * @param courseId  optional course ID filter; {@code null} to match all courses
     * @param status    optional task status filter; {@code null} to match all statuses
     * @param scheduled optional scheduling filter: {@code true} for scheduled tasks (non-null date),
     *                  {@code false} for unscheduled/later tasks (null date), or {@code null} for all tasks
     * @return list of matching task responses, ordered by creation date descending
     */
    List<TaskResponse> listTasks(Long courseId, TaskStatus status, Boolean scheduled);

    /**
     * Retrieves a single task by its unique identifier.
     * <p>
     * <b>Exception expectation:</b> Throws a runtime "not found" exception (e.g. {@code ResourceNotFoundException})
     * if no task exists with the given ID.
     *
     * @param id the unique UUID of the task
     * @return the task response representation
     */
    TaskResponse getTask(UUID id);

    /**
     * Fully updates an existing task with replacement data, including potential course re-association.
     * <p>
     * <b>Exception expectation:</b> Throws a runtime "not found" exception (e.g. {@code ResourceNotFoundException})
     * if the task ID or the new {@code courseId} does not exist.
     *
     * @param id      the unique UUID of the task to update
     * @param request the replacement task payload
     * @return the updated task response representation
     * @throws IllegalArgumentException if the update payload violates domain constraints
     */
    TaskResponse updateTask(UUID id, TaskRequest request);

    /**
     * Updates only the lifecycle status of an existing task (e.g. TODO -> IN_PROGRESS -> COMPLETED).
     * <p>
     * <b>Exception expectation:</b> Throws a runtime "not found" exception (e.g. {@code ResourceNotFoundException})
     * if no task exists with the given ID.
     *
     * @param id      the unique UUID of the task
     * @param request the status update payload
     * @return the updated task response representation
     */
    TaskResponse updateTaskStatus(UUID id, TaskStatusRequest request);

    /**
     * Deletes an existing task by its unique identifier.
     * <p>
     * <b>Exception expectation:</b> Throws a runtime "not found" exception (e.g. {@code ResourceNotFoundException})
     * if no task exists with the given ID.
     *
     * @param id the unique UUID of the task to delete
     */
    void deleteTask(UUID id);
}
