package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for schedule entities with mandatory user scoping.
 */
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Finds a schedule by identifier only when its course belongs to the given user.
     *
     * @param id     the schedule identifier
     * @param userId the owner user identifier
     * @return the schedule when owned by the user, otherwise empty
     */
    Optional<Schedule> findByIdAndCourseUserId(Long id, Long userId);

    /**
     * Retrieves schedules matching mandatory user ID and optional course ID.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @param archived course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @return matching schedules ordered chronologically
     */
    @Query("""
            SELECT s FROM Schedule s
            WHERE s.course.user.id = :userId
              AND (:courseId IS NULL OR s.course.id = :courseId)
              AND ((:archived = true AND s.course.archivedAt IS NOT NULL)
                   OR (:archived = false AND s.course.archivedAt IS NULL))
            ORDER BY s.day ASC, s.startTime ASC
            """)
    List<Schedule> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("archived") Boolean archived
    );
}
