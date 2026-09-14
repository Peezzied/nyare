package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link AcademicEvent} entities.
 * Provides filtered retrieval and deadline-ordered listing for calendar and planner consumers.
 */
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, UUID> {

    /**
     * Retrieves academic events matching optional course and upcoming filters,
     * ordered by deadline ascending.
     *
     * @param courseId optional course ID filter; {@code null} matches any course
     * @param upcoming optional filter: {@code true} for events with deadline in the future,
     *                 {@code null} for all events
     * @param now      the current timestamp used as the boundary for the upcoming filter
     * @return list of matching events ordered by deadline ascending
     */
    @Query("""
            SELECT e FROM AcademicEvent e
            WHERE (:courseId IS NULL OR e.course.id = :courseId)
              AND (:upcoming IS NULL
                   OR (:upcoming = true AND e.deadline >= :now))
            ORDER BY e.deadline ASC
            """)
    List<AcademicEvent> findAllFiltered(
            @Param("courseId") Long courseId,
            @Param("upcoming") Boolean upcoming,
            @Param("now") LocalDateTime now
    );

    /**
     * Retrieves all events for a course ordered by deadline ascending.
     * Used by the Planner service to load upcoming rigid constraints.
     *
     * @param courseId the course ID to filter by
     * @return events ordered by deadline ascending
     */
    List<AcademicEvent> findByCourseIdOrderByDeadlineAsc(Long courseId);
}
