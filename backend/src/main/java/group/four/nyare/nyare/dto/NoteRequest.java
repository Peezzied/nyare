package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for creating or fully updating a Note.
 */
public class NoteRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Note content cannot be blank")
    private String content;

    public NoteRequest() {
    }

    public NoteRequest(Long courseId, String content) {
        this.courseId = courseId;
        this.content = content;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
