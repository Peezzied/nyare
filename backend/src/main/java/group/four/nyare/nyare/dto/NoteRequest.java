package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload for creating or fully updating a Note.
 */
public class NoteRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @Size(max = 255, message = "Note title cannot exceed 255 characters")
    private String title;

    @NotBlank(message = "Note content cannot be blank")
    private String content;

    public NoteRequest() {
    }

    public NoteRequest(Long courseId, String content) {
        this.courseId = courseId;
        this.content = content;
    }

    public NoteRequest(Long courseId, String title, String content) {
        this.courseId = courseId;
        this.title = title;
        this.content = content;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
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
}

