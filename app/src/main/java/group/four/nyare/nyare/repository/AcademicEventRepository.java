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
     * @param q        optional lowercase LIKE pattern matched against title and description
     * @param from     optional inclusive lower bound on {@code deadline}
     * @param to       optional exclusive upper bound on {@code deadline}
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
              AND (:q IS NULL OR LOWER(e.title) LIKE :q OR LOWER(e.description) LIKE :q)
              AND (:from IS NULL OR e.deadline >= :from) AND (:to IS NULL OR e.deadline < :to)
            ORDER BY e.deadline ASC
            """)
    List<AcademicEvent> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("upcoming") Boolean upcoming,
            @Param("now") LocalDateTime now,
            @Param("archived") Boolean archived,
            @Param("q") String q,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );

    /**
     * Returns all academic events extracted from the given source note,
     * ordered by deadline ascending. Used by the dev audit trace console for
     * relation walking.
     *
     * @param noteId the source note identifier
     * @return events attached to the note ordered by deadline ascending
     */
    List<AcademicEvent> findByNoteIdOrderByDeadlineAsc(UUID noteId);

    /**
     * Finds the most recent academic event attached to a source note with a matching title.
     * Used by the dev audit trace console for inferred (non-exact) reference resolution.
     *
     * @param noteId the source note identifier
     * @param title  the event title to match, case-insensitive
     * @return the newest matching academic event, otherwise empty
     */
    Optional<AcademicEvent> findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(UUID noteId, String title);

    /**
     * Deletes academic events associated with the specified notes.
     *
     * @param notes source notes to delete events for
     */
    @Modifying
    @Query("DELETE FROM AcademicEvent e WHERE e.note IN :notes")
    void deleteByNoteIn(@Param("notes") List<Note> notes);
}
