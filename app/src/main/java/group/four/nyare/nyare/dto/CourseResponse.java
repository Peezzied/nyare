package group.four.nyare.nyare.dto;

import java.time.LocalDateTime;

/**
 * Response payload representing a course.
 */
public class CourseResponse {

    private Long id;
    private String name;
    private String description;
    private Long userId;
    private String color;
    private LocalDateTime archivedAt;

    public CourseResponse() {
    }

    public CourseResponse(Long id, String name, String description, Long userId) {
        this(id, name, description, userId, null, null);
    }

    public CourseResponse(Long id, String name, String description, Long userId, String color) {
        this(id, name, description, userId, color, null);
    }

    public CourseResponse(Long id, String name, String description, Long userId, String color,
            LocalDateTime archivedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userId = userId;
        this.color = color;
        this.archivedAt = archivedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public LocalDateTime getArchivedAt() {
        return archivedAt;
    }

    public void setArchivedAt(LocalDateTime archivedAt) {
        this.archivedAt = archivedAt;
    }
}
