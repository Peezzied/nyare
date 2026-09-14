package group.four.nyare.nyare.dto;

import group.four.nyare.nyare.model.NoteContent;

import java.time.Instant;
import java.util.UUID;

/**
 * Response representation for course-linked journal entries.
 */
public class NoteResponse {

    private UUID id;
    private Long courseId;
    private NoteContent content;
    private Instant createdAt;
    private Instant updatedAt;

    public NoteResponse() {
    }

    public NoteResponse(UUID id, Long courseId, NoteContent content, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.courseId = courseId;
        this.content = content;
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

    public NoteContent getContent() {
        return content;
    }

    public void setContent(NoteContent content) {
        this.content = content;
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
