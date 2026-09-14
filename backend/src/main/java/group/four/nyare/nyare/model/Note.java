package group.four.nyare.nyare.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Convert;
import jakarta.persistence.Table;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a course-linked journal entry containing student notes in JSON format.
 * Acts as the source document for AI processing and context/task extraction.
 */
@Entity
@Table(name = "notes")
@EntityListeners(AuditingEntityListener.class)
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @NotNull(message = "Course is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private Course course;

    /**
     * Structured note content containing markdown and image metadata.
     */
    @NotNull(message = "Note content cannot be null")
    @Valid
    @Convert(converter = group.four.nyare.nyare.model.converter.NoteContentConverter.class)
    @Column(nullable = false, columnDefinition = "TEXT")
    private NoteContent content;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Note() {
    }

    /**
     * Creates a new Note linked to a course with structured content.
     *
     * @param course  the course this note belongs to
     * @param content the structured note content
     */
    public Note(Course course, NoteContent content) {
        this.course = course;
        this.content = content;
    }

    public UUID getId() {
        return id;
    }

    public Course getCourse() {
        return course;
    }

    public void setCourse(Course course) {
        this.course = course;
    }

    public NoteContent getContent() {
        return content;
    }

    public void setContent(NoteContent content) {
        this.content = content;
    }

    /**
     * Domain method for AI pipeline to update image metadata while preserving markdown.
     *
     * @param newMetadata the new image metadata map
     */
    public void updateImageMetadata(java.util.Map<String, ImageMetadata> newMetadata) {
        if (this.content != null) {
            this.content.setImageMetadata(newMetadata);
        }
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

    @Override
    public String toString() {
        return "Note{" +
                "id=" + id +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
