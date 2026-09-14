package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Request payload for creating or fully updating a class Schedule.
 */
public class ScheduleRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Day of week is required")
    private DayOfWeek day;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    public ScheduleRequest() {
    }

    public ScheduleRequest(Long courseId, DayOfWeek day, LocalTime startTime, LocalTime endTime) {
        this.courseId = courseId;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public DayOfWeek getDay() {
        return day;
    }

    public void setDay(DayOfWeek day) {
        this.day = day;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }
}
