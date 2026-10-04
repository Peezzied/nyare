package group.four.nyare.nyare.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents an academic course or subject offering.
 * Acts as the aggregate root for schedules, notes, tasks, events, and academic context.
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false, updatable = false)
    private Long id;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(nullable = false)
    private User user;

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    @Column(nullable = false, length = 128)
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    @Column(length = 1024)
    private String description;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Task> tasks = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Note> notes = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Schedule> schedules = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AcademicEvent> academicEvents = new ArrayList<>();

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AcademicContext> academicContexts = new ArrayList<>();

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Course() {
    }

    /**
     * Creates a new Course with required details.
     *
     * @param name        the name of the course
     * @param description optional description or course overview
     * @param user        the owner user
     */
    public Course(String name, String description, User user) {
        this.name = name;
        this.description = description;
        this.user = user;
    }

    /**
     * Overloaded constructor for backwards compatibility or tests.
     *
     * @param name        the name of the course
     * @param description optional description or course overview
     */
    public Course(String name, String description) {
        this(name, description, null);
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public List<Note> getNotes() {
        return notes;
    }

    public void setNotes(List<Note> notes) {
        this.notes = notes;
    }

    public List<Schedule> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedule> schedules) {
        this.schedules = schedules;
    }

    public List<AcademicEvent> getAcademicEvents() {
        return academicEvents;
    }

    public void setAcademicEvents(List<AcademicEvent> academicEvents) {
        this.academicEvents = academicEvents;
    }

    public List<AcademicContext> getAcademicContexts() {
        return academicContexts;
    }

    public void setAcademicContexts(List<AcademicContext> academicContexts) {
        this.academicContexts = academicContexts;
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", name='" + name + '\'' +
                '}';
    }
}
