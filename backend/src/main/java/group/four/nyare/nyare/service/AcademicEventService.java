package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.AcademicEventRequest;
import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;
import java.util.UUID;

/**
 * Service contract for academic event management.
 * <p>
 * Academic events represent rigid calendar-pinned constraints (deadlines, exams,
 * presentations, quizzes) that anchor student schedules and bound study plans.
 */
public interface AcademicEventService {

    /**
     * Creates and persists a new academic event owned by the session user.
     * If an originating {@code noteId} is provided, it must belong to the specified course.
     *
     * @param request the validated event creation payload
     * @param userId  the owner user identifier from the active session
     * @return the persisted event response
     * @throws ResourceNotFoundException if the specified course or note does not exist or belongs to another user
     * @throws BadRequestException       if {@code noteId} is provided but does not belong to the specified course
     */
    AcademicEventResponse createEvent(AcademicEventRequest request, Long userId);

    /**
     * Retrieves all academic events matching optional course and upcoming filters,
     * ordered chronologically by deadline ascending.
     *
     * @param courseId optional course ID filter; {@code null} matches all courses
     * @param upcoming optional filter: {@code true} for events with deadlines in the future,
     *                 or {@code null} for all events
     * @return list of matching academic events ordered by deadline ascending
     */
    List<AcademicEventResponse> listEvents(Long userId, Long courseId, Boolean upcoming);

    /**
     * Retrieves a single academic event owned by the session user.
     *
     * @param id     the unique UUID of the academic event
     * @param userId the owner user identifier from the active session
     * @return the academic event response
     * @throws ResourceNotFoundException if no academic event exists with the given identifier or it belongs to another user
     */
    AcademicEventResponse getEvent(UUID id, Long userId);

    /**
     * Fully updates an existing academic event owned by the session user with replacement payload data.
     * If an originating {@code noteId} is provided, it must belong to the target course.
     *
     * @param id      the unique UUID of the academic event to update
     * @param request the replacement event payload
     * @param userId  the owner user identifier from the active session
     * @return the updated academic event response
     * @throws ResourceNotFoundException if the event, target course, or {@code noteId} does not exist or belongs to another user
     * @throws BadRequestException       if {@code noteId} is provided but does not belong to the target course
     */
    AcademicEventResponse updateEvent(UUID id, AcademicEventRequest request, Long userId);

    /**
     * Deletes an academic event owned by the session user.
     *
     * @param id     the unique UUID of the academic event to delete
     * @param userId the owner user identifier from the active session
     * @throws ResourceNotFoundException if no academic event exists with the given identifier or it belongs to another user
     */
    void deleteEvent(UUID id, Long userId);
}
