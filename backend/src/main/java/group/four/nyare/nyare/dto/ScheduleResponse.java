package group.four.nyare.nyare.dto;

import java.time.DayOfWeek;
import java.time.LocalTime;

/**
 * Response representation for a class Schedule.
 */
public class ScheduleResponse {

    private Long id;
    private Long courseId;
    private DayOfWeek day;
    private LocalTime startTime;
    private LocalTime endTime;

    public ScheduleResponse() {
    }

    public ScheduleResponse(Long id, Long courseId, DayOfWeek day, LocalTime startTime, LocalTime endTime) {
        this.id = id;
        this.courseId = courseId;
        this.day = day;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
