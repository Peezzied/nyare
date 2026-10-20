package group.four.nyare.nyare.dto;

/**
 * Response payload representing a course.
 */
public class CourseResponse {

    private Long id;
    private String name;
    private String description;
    private Long userId;
    private String color;

    public CourseResponse() {
    }

    public CourseResponse(Long id, String name, String description, Long userId) {
        this(id, name, description, userId, null);
    }

    public CourseResponse(Long id, String name, String description, Long userId, String color) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userId = userId;
        this.color = color;
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
}
