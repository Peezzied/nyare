package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;

/**
 * Service contract for course offering management.
 */
public interface CourseService {

    /**
     * Creates and persists a new course for a user.
     *
     * @param request       the validated course payload
     * @param sessionUserId optional user identifier from the active session
     * @return the created course response
     * @throws BadRequestException       if no user identifier can be resolved
     * @throws ResourceNotFoundException if resolved user does not exist
     */
    CourseResponse createCourse(CourseRequest request, Long sessionUserId);

    /**
     * Lists courses filtered by user if present, or all courses.
     *
     * @param sessionUserId the active session user identifier
     * @param queryUserId   optional query parameter user identifier
     * @return list of course responses
     */
    List<CourseResponse> listCourses(Long sessionUserId, Long queryUserId);

    /**
     * Retrieves a single course by identifier.
     *
     * @param id the course identifier
     * @return the course response
     * @throws ResourceNotFoundException if course does not exist
     */
    CourseResponse getCourse(Long id);

    /**
     * Deletes a course by identifier.
     *
     * @param id the course identifier
     * @throws ResourceNotFoundException if course does not exist
     */
    void deleteCourse(Long id);
}
