package group.four.nyare.nyare.dto;

import group.four.nyare.nyare.model.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Duration;
import java.time.LocalDate;

/**
 * Request payload for creating or fully updating a Task.
 */
public class TaskRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Task title is required")
    @Size(max = 255, message = "Task title cannot exceed 255 characters")
    private String title;

    @Size(max = 2048, message = "Task description cannot exceed 2048 characters")
    private String description;

    private LocalDate scheduledDate;

    private Duration duration;

    private TaskStatus status;

    public TaskRequest() {
    }

    public TaskRequest(Long courseId, String title, String description, LocalDate scheduledDate, Duration duration, TaskStatus status) {
        this.courseId = courseId;
        this.title = title;
        this.description = description;
        this.scheduledDate = scheduledDate;
        this.duration = duration;
        this.status = status;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDate getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(LocalDate scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public Duration getDuration() {
        return duration;
    }

    public void setDuration(Duration duration) {
        this.duration = duration;
    }

    public TaskStatus getStatus() {
        return status;
    }

    public void setStatus(TaskStatus status) {
        this.status = status;
    }
}