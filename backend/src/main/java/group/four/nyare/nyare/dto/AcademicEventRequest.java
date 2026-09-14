package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request payload for creating or fully updating an AcademicEvent.
 */
public class AcademicEventRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    private UUID noteId;

    @NotBlank(message = "Event title is required")
    @Size(max = 255, message = "Event title cannot exceed 255 characters")
    private String title;

    @Size(max = 2048, message = "Event description cannot exceed 2048 characters")
    private String description;

    @NotNull(message = "Deadline is required")
    private LocalDateTime deadline;

    public AcademicEventRequest() {
    }

    public AcademicEventRequest(Long courseId, UUID noteId, String title, String description, LocalDateTime deadline) {
        this.courseId = courseId;
        this.noteId = noteId;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
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

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }
}
