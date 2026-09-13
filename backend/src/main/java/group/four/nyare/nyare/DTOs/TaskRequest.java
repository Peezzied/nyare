package group.four.nyare.nyare.DTOs;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Duration;
import java.time.LocalDate;

/**
 * Request payload for creating or updating an academic task in the study plan.
 * <p>
 * Enforces validation constraints on required references and input bounds.
 *
 * @param courseId      ID of the associated academic course (required)
 * @param title         actionable title describing the task (required, max 255 chars)
 * @param description   optional detailed description or instructions (max 2048 chars)
 * @param scheduledDate target date recommended for execution; {@code null} denotes a flexible / unscheduled 'Later' task
 * @param duration      estimated time required to complete the task
 * @param status        lifecycle status of the task; optional during creation (defaults to {@link TaskStatus#TODO})
 */
public record TaskRequest(
        @NotNull(message = "Course ID is required")
        Long courseId,

        @NotBlank(message = "Task title is required")
        @Size(max = 255, message = "Task title cannot exceed 255 characters")
        String title,

        @Size(max = 2048, message = "Task description cannot exceed 2048 characters")
        String description,

        LocalDate scheduledDate,

        Duration duration,

        TaskStatus status
) {
}
