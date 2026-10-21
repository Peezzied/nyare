package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for academic event entities with mandatory user scoping.
 */
public interface AcademicEventRepository extends JpaRepository<AcademicEvent, UUID> {

    /**
     * Finds an academic event by identifier only when its course belongs to the given user.
     *
     * @param id     the academic event identifier
     * @param userId the owner user identifier
     * @return the academic event when owned by the user, otherwise empty
     */
    Optional<AcademicEvent> findByIdAndCourseUserId(UUID id, Long userId);

    /**
     * Retrieves events matching user ID and optional course and upcoming filters.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @param upcoming optional upcoming filter flag
     * @param now      current timestamp boundary
     * @param archived course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @return list of matching events ordered by deadline ascending
     */
    @Query("""
            SELECT e FROM AcademicEvent e
            WHERE e.course.user.id = :userId
              AND (:courseId IS NULL OR e.course.id = :courseId)
              AND (:upcoming IS NULL
                   OR (:upcoming = true AND e.deadline >= :now))
              AND ((:archived = true AND e.course.archivedAt IS NOT NULL)
                   OR (:archived = false AND e.course.archivedAt IS NULL))
            ORDER BY e.deadline ASC
            """)
    List<AcademicEvent> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("upcoming") Boolean upcoming,
            @Param("now") LocalDateTime now,
            @Param("archived") Boolean archived
    );

    /**
     * Deletes academic events associated with the specified notes.
     *
     * @param notes source notes to delete events for
     */
    @Modifying
    @Query("DELETE FROM AcademicEvent e WHERE e.note IN :notes")
    void deleteByNoteIn(@Param("notes") List<Note> notes);
}
