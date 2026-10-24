package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Lightweight list representation for course-linked journal entries.
 * Returns a truncated markdown preview instead of full content.
 */
public class NoteSummaryResponse {

    private UUID id;
    private Long courseId;
    private String title;
    private String preview;
    private boolean truncated;
    private int contentLength;
    private LocalDate entryDate;
    private Instant createdAt;
    private Instant updatedAt;

    public NoteSummaryResponse() {
    }

    public NoteSummaryResponse(UUID id, Long courseId, String preview, boolean truncated, int contentLength, Instant createdAt, Instant updatedAt) {
        this(id, courseId, "Untitled Note", preview, truncated, contentLength, LocalDate.now(), createdAt, updatedAt);
    }

    public NoteSummaryResponse(UUID id, Long courseId, String preview, boolean truncated, int contentLength, LocalDate entryDate, Instant createdAt, Instant updatedAt) {
        this(id, courseId, "Untitled Note", preview, truncated, contentLength, entryDate, createdAt, updatedAt);
    }

    public NoteSummaryResponse(UUID id, Long courseId, String title, String preview, boolean truncated, int contentLength, Instant createdAt, Instant updatedAt) {
        this(id, courseId, title, preview, truncated, contentLength, LocalDate.now(), createdAt, updatedAt);
    }

    public NoteSummaryResponse(UUID id, Long courseId, String title, String preview, boolean truncated, int contentLength, LocalDate entryDate, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.courseId = courseId;
        this.title = title;
        this.preview = preview;
        this.truncated = truncated;
        this.contentLength = contentLength;
        this.entryDate = entryDate != null ? entryDate : LocalDate.now();
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
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
