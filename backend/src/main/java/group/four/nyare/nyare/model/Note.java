package group.four.nyare.nyare.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents a course-linked journal entry containing student notes in Markdown format.
 * Acts as the source document for AI processing and context/task extraction.
 */
@Entity
@Table(
        name = "notes",
        indexes = {
                @Index(name = "idx_notes_course_created_at", columnList = "course_id, created_at")
        }
)
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

    @NotBlank(message = "Note title cannot be blank")
    @Size(max = 255, message = "Note title cannot exceed 255 characters")
    @Column(nullable = false, length = 255, columnDefinition = "VARCHAR(255) DEFAULT 'Untitled Note'")
    private String title;

    @NotBlank(message = "Note content cannot be blank")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Column(name = "last_processed_at")
    private Instant lastProcessedAt;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Note() {
    }

    /**
     * Creates a new Note linked to a course with a title and markdown content.
     *
     * @param course  the course this note belongs to
     * @param title   the title of the note
     * @param content the markdown note content
     */
    public Note(Course course, String title, String content) {
        this.course = course;
        this.title = title;
        this.content = content;
    }

    /**
     * Creates a new Note linked to a course with markdown content and default title.
     *
     * @param course  the course this note belongs to
     * @param content the markdown note content
     */
    public Note(Course course, String content) {
        this(course, "Untitled Note", content);
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    @Override
    public String toString() {
        return "Note{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
