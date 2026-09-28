package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Lightweight list representation for course-linked journal entries.
 * Returns a truncated markdown preview instead of full content.
 */
public class NoteSummaryResponse {

    private UUID id;
    private Long courseId;
    private String preview;
    private boolean truncated;
    private int contentLength;
    private Instant createdAt;
    private Instant updatedAt;

    public NoteSummaryResponse() {
    }

    public NoteSummaryResponse(UUID id, Long courseId, String preview, boolean truncated, int contentLength, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.courseId = courseId;
        this.preview = preview;
        this.truncated = truncated;
        this.contentLength = contentLength;
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

    public String getPreview() {
        return preview;
    }

    public void setPreview(String preview) {
        this.preview = preview;
    }

    public boolean isTruncated() {
        return truncated;
    }

    public void setTruncated(boolean truncated) {
        this.truncated = truncated;
    }

    public int getContentLength() {
        return contentLength;
    }

    public void setContentLength(int contentLength) {
        this.contentLength = contentLength;
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
