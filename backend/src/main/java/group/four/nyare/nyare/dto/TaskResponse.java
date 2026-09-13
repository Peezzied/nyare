package group.four.nyare.nyare.dto;

import group.four.nyare.nyare.model.enums.TaskStatus;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response representation for academic tasks.
 */
public class TaskResponse {

    private UUID id;
    private Long courseId;
    private UUID noteId;
    private String title;
    private String description;
    private LocalDate scheduledDate;
    private Duration duration;
    private TaskStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    public TaskResponse() {
    }

    public TaskResponse(UUID id, Long courseId, UUID noteId, String title, String description,
                        LocalDate scheduledDate, Duration duration, TaskStatus status,
                        Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.courseId = courseId;
        this.noteId = noteId;
        this.title = title;
        this.description = description;
        this.scheduledDate = scheduledDate;
        this.duration = duration;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public UUID getNoteId() {
        return noteId;
    }

    public void setNoteId(UUID noteId) {
        this.noteId = noteId;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
