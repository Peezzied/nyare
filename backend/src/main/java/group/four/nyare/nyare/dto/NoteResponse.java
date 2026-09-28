package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response representation for course-linked journal entries.
 */
public class NoteResponse {

    private UUID id;
    private Long courseId;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastProcessedAt;

    public NoteResponse() {
    }

    public NoteResponse(UUID id, Long courseId, String content, Instant createdAt, Instant updatedAt) {
        this(id, courseId, content, createdAt, updatedAt, null);
    }

    public NoteResponse(UUID id, Long courseId, String content, Instant createdAt, Instant updatedAt, Instant lastProcessedAt) {
        this.id = id;
        this.courseId = courseId;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastProcessedAt = lastProcessedAt;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
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

    public Instant getLastProcessedAt() {
        return lastProcessedAt;
    }

    public void setLastProcessedAt(Instant lastProcessedAt) {
        this.lastProcessedAt = lastProcessedAt;
    }
}
