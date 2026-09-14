package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.time.DayOfWeek;
import java.util.List;

/**
 * Service contract for class schedule management.
 * <p>
 * Schedules represent recurring weekly class meeting times anchoring calendar navigation.
 */
public interface ScheduleService {

    /**
     * Creates and persists a new class schedule meeting time for a course.
     *
     * @param request the validated schedule creation payload
     * @return the persisted schedule response representation
     * @throws ResourceNotFoundException if the specified course does not exist
     * @throws BadRequestException       if the schedule times are invalid (e.g. start time is not before end time)
     */
    ScheduleResponse createSchedule(ScheduleRequest request);

    /**
     * Retrieves class schedules matching optional course and day of week filters,
     * ordered chronologically.
     *
     * @param courseId optional course ID filter; {@code null} to match all courses
     * @param day      optional day of week filter; {@code null} to match all days
     * @return list of matching schedule responses ordered chronologically
     */
    List<ScheduleResponse> listSchedules(Long courseId, DayOfWeek day);

    /**
     * Retrieves a single class schedule by its unique identifier.
     *
     * @param id the unique identifier of the schedule
     * @return the schedule response representation
     * @throws ResourceNotFoundException if no schedule exists with the given identifier
     */
    ScheduleResponse getSchedule(Long id);

    /**
     * Fully updates an existing class schedule with replacement payload data.
     *
     * @param id      the unique identifier of the schedule to update
     * @param request the replacement schedule payload
     * @return the updated schedule response representation
     * @throws ResourceNotFoundException if the schedule or target course does not exist
     * @throws BadRequestException       if the schedule times are invalid (e.g. start time is not before end time)
     */
    ScheduleResponse updateSchedule(Long id, ScheduleRequest request);

    /**
     * Deletes an existing class schedule by its unique identifier.
     *
     * @param id the unique identifier of the schedule to delete
     * @throws ResourceNotFoundException if no schedule exists with the given identifier
     */
    void deleteSchedule(Long id);
}
