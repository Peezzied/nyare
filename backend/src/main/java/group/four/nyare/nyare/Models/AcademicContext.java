package group.four.nyare.nyare.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Represents temporal academic facts and context extracted from course-linked journal notes.
 * <p>
 * Academic context is time-aware metadata utilized by the AI planner to reason about
 * student situations without rigid scoring. Older context naturally decays in relevance
 * as newer journal entries emerge or absent updates indicate status changes.
 */
@Entity
@Table(name = "academic_contexts")
@EntityListeners(AuditingEntityListener.class)
public class AcademicContext {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull(message = "Course is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id")
    private Note note;

    @NotBlank(message = "Context value cannot be blank")
    @Size(max = 2048, message = "Context value cannot exceed 2048 characters")
    @Column(name = "value", nullable = false, length = 2048)
    private String value;

    /**
     * Timestamp when the academic context was recorded.
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected AcademicContext() {
    }

    /**
     * Creates an AcademicContext associated with a course and context value.
     *
     * @param course the course associated with this context
     * @param value  the contextual fact or statement
     */
    public AcademicContext(Course course, String value) {
        this.course = course;
        this.value = value;
    }

    /**
     * Creates an AcademicContext associated with a course, originating note, and context value.
     *
     * @param course the course associated with this context
     * @param note   the originating journal note from which this context was extracted
     * @param value  the contextual fact or statement
     */
    public AcademicContext(Course course, Note note, String value) {
        this.course = course;
        this.note = note;
        this.value = value;
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

    public Note getNote() {
        return note;
    }

    public void setNote(Note note) {
        this.note = note;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AcademicContext that = (AcademicContext) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "AcademicContext{" +
                "id=" + id +
                ", value='" + value + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
