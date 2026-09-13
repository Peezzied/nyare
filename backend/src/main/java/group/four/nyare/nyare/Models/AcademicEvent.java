package group.four.nyare.nyare.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Represents a rigid academic event or deadline occurring at a specific date and time.
 * <p>
 * Unlike flexible task recommendations, academic events and deadlines act as hard
 * temporal constraints that bound study plans and schedules.
 */
@Entity
@Table(name = "academic_events")
public class AcademicEvent {

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

    @NotBlank(message = "Event title cannot be blank")
    @Size(max = 255, message = "Event title cannot exceed 255 characters")
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Size(max = 2048, message = "Event description cannot exceed 2048 characters")
    @Column(name = "description", length = 2048)
    private String description;

    @NotNull(message = "Deadline is required")
    @Column(name = "deadline", nullable = false)
    private LocalDateTime deadline;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected AcademicEvent() {
    }

    /**
     * Creates an AcademicEvent with required course, title, and deadline.
     *
     * @param course   the course associated with this event
     * @param title    the title or summary of the academic event
     * @param deadline the strict date and time deadline for the event
     */
    public AcademicEvent(Course course, String title, LocalDateTime deadline) {
        this.course = course;
        this.title = title;
        this.deadline = deadline;
    }

    /**
     * Creates an AcademicEvent with full details including description and originating note.
     *
     * @param course      the course associated with this event
     * @param note        the journal note from which this event was extracted
     * @param title       the title or summary of the academic event
     * @param description detailed description or submission requirements
     * @param deadline    the strict date and time deadline for the event
     */
    public AcademicEvent(Course course, Note note, String title, String description, LocalDateTime deadline) {
        this.course = course;
        this.note = note;
        this.title = title;
        this.description = description;
        this.deadline = deadline;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AcademicEvent that = (AcademicEvent) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "AcademicEvent{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", deadline=" + deadline +
                '}';
    }
}
