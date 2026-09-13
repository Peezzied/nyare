package group.four.nyare.nyare.DTOs;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for updating the lifecycle status of an existing task.
 * Used for targeted status transitions (e.g., PATCH {@code /api/tasks/{id}/status}).
 *
 * @param status the new lifecycle status to apply to the task (required)
 */
public record TaskStatusRequest(
        @NotNull(message = "Status is required")
        TaskStatus status
) {
}
