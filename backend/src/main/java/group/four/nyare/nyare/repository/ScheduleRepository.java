package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Spring Data JPA repository for schedule entities with mandatory user scoping.
 */
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Retrieves schedules matching mandatory user ID and optional course ID.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @return matching schedules ordered chronologically
     */
    @Query("""
            SELECT s FROM Schedule s
            WHERE s.course.user.id = :userId
              AND (:courseId IS NULL OR s.course.id = :courseId)
            ORDER BY s.day ASC, s.startTime ASC
            """)
    List<Schedule> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );
}
