package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating or updating a course.
 */
public class CourseRequest {

    @NotBlank(message = "Course name is required")
    @Size(max = 128, message = "Course name cannot exceed 128 characters")
    private String name;

    @Size(max = 1024, message = "Course description cannot exceed 1024 characters")
    private String description;

    @Size(max = 64, message = "Course color cannot exceed 64 characters")
    private String color;

    public CourseRequest() {
    }

    public CourseRequest(String name, String description) {
        this(name, description, null);
    }

    public CourseRequest(String name, String description, String color) {
        this.name = name;
        this.description = description;
        this.color = color;
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

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}
