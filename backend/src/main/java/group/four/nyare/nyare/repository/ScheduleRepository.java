package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.util.List;

/**
 * Spring Data JPA repository for {@link Schedule} entities.
 * Provides weekly class meeting time queries ordered chronologically.
 */
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    /**
     * Retrieves all recurring schedules for a course, ordered by day of week and start time ascending.
     *
     * @param courseId the course ID to filter by
     * @return schedules ordered by day and start time ascending
     */
    List<Schedule> findByCourseIdOrderByDayAscStartTimeAsc(Long courseId);

    /**
     * Retrieves all recurring schedules for a course on a specific day of the week,
     * ordered by start time ascending.
     *
     * @param courseId the course ID to filter by
     * @param day      the day of week to filter by
     * @return schedules on the specified day ordered by start time ascending
     */
    List<Schedule> findByCourseIdAndDayOrderByStartTimeAsc(Long courseId, DayOfWeek day);

    /**
     * Retrieves all recurring schedules matching optional user and course filters,
     * ordered by day of week and start time ascending.
     *
     * @param userId   optional user ID filter
     * @param courseId optional course ID filter
     * @return matching schedules ordered chronologically
     */
    @Query("""
            SELECT s FROM Schedule s
            WHERE (:userId IS NULL OR s.course.user.id = :userId)
              AND (:courseId IS NULL OR s.course.id = :courseId)
            ORDER BY s.day ASC, s.startTime ASC
            """)
    List<Schedule> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );

    default List<Schedule> findAllFiltered(Long courseId) {
        return findAllFiltered(null, courseId);
    }
}
