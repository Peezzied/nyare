package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;

/**
 * Service contract for course offering management.
 */
public interface CourseService {

    /**
     * Creates and persists a new course owned by the session user.
     *
     * @param request the validated course payload
     * @param userId  the owner user identifier from the active session
     * @return the created course response
     * @throws ResourceNotFoundException if the session user does not exist
     */
    CourseResponse createCourse(CourseRequest request, Long userId);

    /**
     * Lists courses owned by the session user.
     *
     * @param userId the owner user identifier from the active session
     * @return list of course responses
     */
    List<CourseResponse> listCourses(Long userId);

    /**
     * Retrieves a single course owned by the session user.
     *
     * @param id     the course identifier
     * @param userId the owner user identifier from the active session
     * @return the course response
     * @throws ResourceNotFoundException if the course does not exist or belongs to another user
     */
    CourseResponse getCourse(Long id, Long userId);

    /**
     * Deletes a course owned by the session user.
     *
     * @param id     the course identifier
     * @param userId the owner user identifier from the active session
     * @throws ResourceNotFoundException if the course does not exist or belongs to another user
     */
    void deleteCourse(Long id, Long userId);
}
