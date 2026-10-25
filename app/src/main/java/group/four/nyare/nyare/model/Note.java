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
import java.time.LocalDate;
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

    public static final String DEFAULT_TITLE = "Untitled Note";

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

    @NotNull(message = "Entry date is required")
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @Column(name = "last_processed_at")
    private Instant lastProcessedAt;

    @Column(name = "excluded_from_ai", nullable = false, columnDefinition = "BOOLEAN NOT NULL DEFAULT 0")
    private boolean excludedFromAi = false;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Note() {
    }

    /**
     * Creates a new Note linked to a course with a title, markdown content, and entry date.
     *
     * @param course    the course this note belongs to
     * @param title     the title of the note
     * @param content   the markdown note content
     * @param entryDate the entry date
     */
    public Note(Course course, String title, String content, LocalDate entryDate) {
        this.course = course;
        this.title = title;
        this.content = content;
        this.entryDate = entryDate != null ? entryDate : LocalDate.now();
    }

    /**
     * Creates a new Note linked to a course with a title and markdown content.
     *
     * @param course  the course this note belongs to
     * @param title   the title of the note
     * @param content the markdown note content
     */
    public Note(Course course, String title, String content) {
        this(course, title, content, LocalDate.now());
    }

    /**
     * Creates a new Note linked to a course with markdown content and custom entry date.
     *
     * @param course    the course this note belongs to
     * @param content   the markdown note content
     * @param entryDate the entry date
     */
    public Note(Course course, String content, LocalDate entryDate) {
        this(course, DEFAULT_TITLE, content, entryDate);
    }

    /**
     * Creates a new Note linked to a course with markdown content and default title.
     *
     * @param course  the course this note belongs to
     * @param content the markdown note content
     */
    public Note(Course course, String content) {
        this(course, DEFAULT_TITLE, content, LocalDate.now());
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

    /**
     * Returns true when the AI planner skips this note during note processing.
     *
     * @return true when the note is excluded from AI processing
     */
    public boolean isExcludedFromAi() {
        return excludedFromAi;
    }

    /**
     * Sets whether the AI planner skips this note during note processing.
     *
     * @param excludedFromAi true to exclude the note from AI processing
     */
    public void setExcludedFromAi(boolean excludedFromAi) {
        this.excludedFromAi = excludedFromAi;
    }

    /**
     * Returns true when the note still carries the default or a blank title,
     * marking it eligible for AI-generated titles during journal processing.
     */
    public boolean requiresGeneratedTitle() {
        return title == null || title.isBlank() || DEFAULT_TITLE.equalsIgnoreCase(title.trim());
    }

    public LocalDate getEntryDate() {
        return entryDate;
    }

    public void setEntryDate(LocalDate entryDate) {
        this.entryDate = entryDate;
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
