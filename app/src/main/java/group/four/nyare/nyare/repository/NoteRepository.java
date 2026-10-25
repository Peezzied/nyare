package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for note entities with mandatory user scoping.
 */
public interface NoteRepository extends JpaRepository<Note, UUID> {

    /**
     * Finds a note by identifier only when its course belongs to the given user.
     *
     * @param id     the note identifier
     * @param userId the owner user identifier
     * @return the note when owned by the user, otherwise empty
     */
    Optional<Note> findByIdAndCourseUserId(UUID id, Long userId);

    /**
     * Returns notes matching mandatory user ID and optional course ID.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @param archived course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @param q        optional lowercase LIKE pattern matched against title and content
     * @param from     optional inclusive lower bound on {@code entryDate}
     * @param to       optional inclusive upper bound on {@code entryDate}
     * @return matching notes ordered newest first
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND (:courseId IS NULL OR n.course.id = :courseId)
              AND ((:archived = true AND n.course.archivedAt IS NOT NULL)
                   OR (:archived = false AND n.course.archivedAt IS NULL))
              AND (:q IS NULL OR LOWER(n.title) LIKE :q OR LOWER(n.content) LIKE :q)
              AND (:from IS NULL OR n.entryDate >= :from) AND (:to IS NULL OR n.entryDate <= :to)
            ORDER BY n.createdAt DESC
            """)
    List<Note> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("archived") Boolean archived,
            @Param("q") String q,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    /**
     * Returns notes whose content contains the given fragment. Used by the dev
     * audit trace console to find notes referencing an image identifier.
     *
     * @param fragment substring matched against note content (LIKE %fragment%)
     * @return matching notes
     */
    List<Note> findByContentContaining(String fragment);

    /**
     * Returns all dirty notes for a user across all dates.
     *
     * @param userId   mandatory user identifier
     * @param archived course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @return dirty, non-excluded notes matching criteria
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND n.excludedFromAi = false
              AND (n.lastProcessedAt IS NULL OR n.updatedAt > n.lastProcessedAt)
              AND ((:archived = true AND n.course.archivedAt IS NOT NULL)
                   OR (:archived = false AND n.course.archivedAt IS NULL))
            ORDER BY n.entryDate ASC, n.createdAt ASC
            """)
    List<Note> findDirtyNotes(@Param("userId") Long userId, @Param("archived") Boolean archived);

    /**
     * Returns dirty notes for a user within a timestamp boundary.
     *
     * @param userId     mandatory user identifier
     * @param startOfDay start of time window
     * @param endOfDay   end of time window
     * @param archived   course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @return dirty, non-excluded notes matching criteria
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND n.excludedFromAi = false
              AND n.createdAt >= :startOfDay
              AND n.createdAt < :endOfDay
              AND (n.lastProcessedAt IS NULL OR n.updatedAt > n.lastProcessedAt)
              AND ((:archived = true AND n.course.archivedAt IS NOT NULL)
                   OR (:archived = false AND n.course.archivedAt IS NULL))
            """)
    List<Note> findDirtyNotes(
            @Param("userId") Long userId,
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay,
            @Param("archived") Boolean archived
    );

    /**
     * Helper method to query dirty notes for a date and user.
     *
     * @param userId   mandatory user identifier
     * @param date     calendar date
     * @param archived course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @return dirty notes matching criteria
     */
    default List<Note> findDirtyNotes(Long userId, LocalDate date, Boolean archived) {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = date.atStartOfDay(zone).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(zone).toInstant();
        return findDirtyNotes(userId, startOfDay, endOfDay, archived);
    }
}
