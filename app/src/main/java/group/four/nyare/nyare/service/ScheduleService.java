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
     * Creates and persists a new class schedule meeting time for a course owned by the session user.
     *
     * @param request the validated schedule creation payload
     * @param userId  the owner user identifier from the active session
     * @return the persisted schedule response representation
     * @throws ResourceNotFoundException if the specified course does not exist or belongs to another user
     * @throws BadRequestException       if the schedule times are invalid (e.g. start time is not before end time)
     */
    ScheduleResponse createSchedule(ScheduleRequest request, Long userId);

    /**
     * Retrieves class schedules matching optional course and day of week filters,
     * ordered chronologically.
     *
     * @param courseId optional course ID filter; {@code null} to match all courses
     * @param day      optional day of week filter; {@code null} to match all days
     * @param archived {@code true} to list schedules of archived courses, {@code false} for active courses
     * @return list of matching schedule responses ordered chronologically
     */
    List<ScheduleResponse> listSchedules(Long userId, Long courseId, DayOfWeek day, Boolean archived);

    /**
     * Retrieves a single class schedule owned by the session user.
     *
     * @param id     the unique identifier of the schedule
     * @param userId the owner user identifier from the active session
     * @return the schedule response representation
     * @throws ResourceNotFoundException if no schedule exists with the given identifier or it belongs to another user
     */
    ScheduleResponse getSchedule(Long id, Long userId);

    /**
     * Fully updates an existing class schedule owned by the session user with replacement payload data.
     *
     * @param id      the unique identifier of the schedule to update
     * @param request the replacement schedule payload
     * @param userId  the owner user identifier from the active session
     * @return the updated schedule response representation
     * @throws ResourceNotFoundException if the schedule or target course does not exist or belongs to another user
     * @throws BadRequestException       if the schedule times are invalid (e.g. start time is not before end time)
     */
    ScheduleResponse updateSchedule(Long id, ScheduleRequest request, Long userId);

    /**
     * Deletes an existing class schedule owned by the session user.
     *
     * @param id     the unique identifier of the schedule to delete
     * @param userId the owner user identifier from the active session
     * @throws ResourceNotFoundException if no schedule exists with the given identifier or it belongs to another user
     */
    void deleteSchedule(Long id, Long userId);
}
