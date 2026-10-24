package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Request payload for restoring archived courses.
 */
public class UnarchiveRequest {

    @NotEmpty(message = "Course IDs are required")
    private List<@NotNull(message = "Course ID is required") Long> courseIds;

    public UnarchiveRequest() {
    }

    public UnarchiveRequest(List<Long> courseIds) {
        this.courseIds = courseIds;
    }

    public List<Long> getCourseIds() {
        return courseIds;
    }

    public void setCourseIds(List<Long> courseIds) {
        this.courseIds = courseIds;
    }
}
