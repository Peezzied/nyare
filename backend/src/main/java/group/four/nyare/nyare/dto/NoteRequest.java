package group.four.nyare.nyare.dto;

import group.four.nyare.nyare.model.NoteContent;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

/**
 * Request payload for creating or fully updating a Note.
 */
public class NoteRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Note content is required")
    @Valid
    private NoteContent content;

    public NoteRequest() {
    }

    public NoteRequest(Long courseId, NoteContent content) {
        this.courseId = courseId;
        this.content = content;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public NoteContent getContent() {
        return content;
    }

    public void setContent(NoteContent content) {
        this.content = content;
    }
}
