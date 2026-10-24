package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response representation for an AcademicEvent.
 */
public class AcademicEventResponse {

    private UUID id;
    private Long courseId;
    private UUID noteId;
    private String title;
    private String description;
    private LocalDateTime deadline;
    private Instant createdAt;

    public AcademicEventResponse() {
    }

    public AcademicEventResponse(UUID id, Long courseId, UUID noteId, String title,
                                 String description, LocalDateTime deadline, Instant createdAt) {
        this.id = id;
        this.courseId = courseId;
        this.noteId = noteId;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
        this.createdAt = createdAt;
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

    public LocalDateTime getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDateTime deadline) {
        this.deadline = deadline;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
