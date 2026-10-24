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
     * Creates and persists a new course owned by the session user.
     *
     * @param request the validated course payload
     * @param userId  the owner user identifier from the active session
     * @return the created course response
     * @throws ResourceNotFoundException if the session user does not exist
     */
    CourseResponse createCourse(CourseRequest request, Long userId);

    /**
     * Lists active (non-archived) courses owned by the session user.
     *
     * @param userId the owner user identifier from the active session
     * @return list of active course responses
     */
    List<CourseResponse> listCourses(Long userId);

    /**
     * Lists archived courses owned by the session user.
     *
     * @param userId the owner user identifier from the active session
     * @return list of archived course responses
     */
    List<CourseResponse> listArchivedCourses(Long userId);

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
     * Updates a course owned by the session user with replacement payload data.
     *
     * @param id      the course identifier
     * @param request the replacement course payload
     * @param userId  the owner user identifier from the active session
     * @return the updated course response
     * @throws ResourceNotFoundException if the course does not exist or belongs to another user
     * @throws BadRequestException       if the course is archived
     */
    CourseResponse updateCourse(Long id, CourseRequest request, Long userId);

    /**
     * Deletes a course owned by the session user.
     *
     * @param id     the course identifier
     * @param userId the owner user identifier from the active session
     * @throws ResourceNotFoundException if the course does not exist or belongs to another user
     */
    void deleteCourse(Long id, Long userId);

    /**
     * Archives a course owned by the session user.
     * The call is an idempotent no-op when the course is already archived.
     *
     * @param id     the course identifier
     * @param userId the owner user identifier from the active session
     * @return the course response
     * @throws ResourceNotFoundException if the course does not exist or belongs to another user
     */
    CourseResponse archiveCourse(Long id, Long userId);

    /**
     * Restores an archived course owned by the session user.
     * The call is an idempotent no-op when the course is already active.
     *
     * @param id     the course identifier
     * @param userId the owner user identifier from the active session
     * @return the course response
     * @throws ResourceNotFoundException if the course does not exist or belongs to another user
     */
    CourseResponse unarchiveCourse(Long id, Long userId);

    /**
     * Archives all active courses owned by the session user in one transaction.
     * Every course receives the same archive timestamp.
     *
     * @param userId the owner user identifier from the active session
     * @return list of archived course responses, empty when no active courses exist
     */
    List<CourseResponse> archiveAllCourses(Long userId);

    /**
     * Restores archived courses owned by the session user in one transaction.
     * The batch is all-or-nothing: one unknown or foreign identifier rolls back every change.
     *
     * @param courseIds the course identifiers to restore
     * @param userId    the owner user identifier from the active session
     * @return list of restored course responses
     * @throws ResourceNotFoundException if any course does not exist or belongs to another user
     */
    List<CourseResponse> unarchiveCourses(List<Long> courseIds, Long userId);
}
