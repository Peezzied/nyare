package group.four.nyare.nyare.DTOs;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response representation for an academic task in the study plan.
 * Encapsulates task attributes, course associations, optional note references, and timestamps.
 *
 * @param id            unique identifier of the task
 * @param courseId      ID of the associated academic course
 * @param noteId        ID of the source journal note if extracted via AI processing, or {@code null}
 * @param title         actionable title describing the task
 * @param description   optional detailed description or instructions
 * @param scheduledDate flexible target study date, or {@code null} if unscheduled ('Later')
 * @param duration      estimated time required to complete the task
 * @param status        current lifecycle status of the task
 * @param createdAt     timestamp when the task was created
 * @param updatedAt     timestamp when the task was last modified
 */
public record TaskResponse(
        UUID id,
        Long courseId,
        UUID noteId,
        String title,
        String description,
        LocalDate scheduledDate,
        Duration duration,
        TaskStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Safely constructs a {@link TaskResponse} from a managed or detached {@link Task} entity.
     *
     * @param task the source task entity
     * @return a mapped response representation of the task
     */
    public static TaskResponse from(Task task) {
        if (task == null) {
            return null;
        }
        return new TaskResponse(
                task.getId(),
                task.getCourse() != null ? task.getCourse().getId() : null,
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
