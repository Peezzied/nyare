package group.four.nyare.nyare.Models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Represents an academic course or subject offering.
 * Acts as the aggregate root for schedules, notes, tasks, events, and academic context.
 */
@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    @Column(name = "name", nullable = false, length = 128)
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    @Column(name = "description", length = 1024)
    private String description;

    /**
     * Protected default constructor for JPA proxies.
     */
    protected Course() {
    }

    /**
     * Creates a new Course with required details.
     *
     * @param name the name of the course
     * @param description optional description or course overview
     */
    public Course(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public Long getId() {
        return id;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Course course = (Course) o;
        return id != null && id.equals(course.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return "Course{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}
