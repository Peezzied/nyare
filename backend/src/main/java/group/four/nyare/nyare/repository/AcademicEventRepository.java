package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for academic event entities with mandatory user scoping.
 */
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, UUID> {

    /**
     * Retrieves events matching user ID and optional course and upcoming filters.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @param upcoming optional upcoming filter flag
     * @param now      current timestamp boundary
     * @return list of matching events ordered by deadline ascending
     */
    @Query("""
            SELECT e FROM AcademicEvent e
            WHERE e.course.user.id = :userId
              AND (:courseId IS NULL OR e.course.id = :courseId)
              AND (:upcoming IS NULL
                   OR (:upcoming = true AND e.deadline >= :now))
            ORDER BY e.deadline ASC
            """)
    List<AcademicEvent> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("upcoming") Boolean upcoming,
            @Param("now") LocalDateTime now
    );
}
