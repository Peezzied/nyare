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
     * Creates and persists a new academic event associated with a valid course.
     * If an originating {@code noteId} is provided, it must belong to the specified course.
     *
     * @param request the validated event creation payload
     * @return the persisted event response
     * @throws ResourceNotFoundException if the specified course does not exist, or if {@code noteId} is provided and the note does not exist
     * @throws BadRequestException       if {@code noteId} is provided but does not belong to the specified course
     */
    AcademicEventResponse createEvent(AcademicEventRequest request);

    /**
     * Retrieves all academic events matching optional course and upcoming filters,
     * ordered chronologically by deadline ascending.
     *
     * @param courseId optional course ID filter; {@code null} matches all courses
     * @param upcoming optional filter: {@code true} for events with deadlines in the future,
     *                 or {@code null} for all events
     * @return list of matching academic events ordered by deadline ascending
     */
    List<AcademicEventResponse> listEvents(Long courseId, Boolean upcoming);

    /**
     * Retrieves a single academic event by its unique identifier.
     *
     * @param id the unique UUID of the academic event
     * @return the academic event response
     * @throws ResourceNotFoundException if no academic event exists with the given identifier
     */
    AcademicEventResponse getEvent(UUID id);

    /**
     * Fully updates an existing academic event with replacement payload data.
     * If an originating {@code noteId} is provided, it must belong to the target course.
     *
     * @param id      the unique UUID of the academic event to update
     * @param request the replacement event payload
     * @return the updated academic event response
     * @throws ResourceNotFoundException if the event does not exist, the target course does not exist, or {@code noteId} does not exist
     * @throws BadRequestException       if {@code noteId} is provided but does not belong to the target course
     */
    AcademicEventResponse updateEvent(UUID id, AcademicEventRequest request);

    /**
     * Deletes an academic event by its unique identifier.
     *
     * @param id the unique UUID of the academic event to delete
     * @throws ResourceNotFoundException if no academic event exists with the given identifier
     */
    void deleteEvent(UUID id);
}
