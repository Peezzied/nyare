package group.four.nyare.nyare.dto;

import group.four.nyare.nyare.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for updating the status of a Task.
 */
public class TaskStatusRequest {

    @NotNull(message = "Task status is required")
    private TaskStatus status;

    public TaskStatusRequest() {
    }

    public TaskStatusRequest(TaskStatus status) {
        this.status = status;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }
}
