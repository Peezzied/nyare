package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for note entities with mandatory user scoping.
 */
public interface NoteRepository extends JpaRepository<Note, UUID> {

    /**
     * Returns notes matching mandatory user ID and optional course ID.
     *
     * @param userId   mandatory user identifier
     * @param courseId optional course identifier
     * @return matching notes ordered newest first
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND (:courseId IS NULL OR n.course.id = :courseId)
            ORDER BY n.createdAt DESC
            """)
    List<Note> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );

    /**
     * Returns dirty notes for a user within a timestamp boundary.
     *
     * @param userId     mandatory user identifier
     * @param startOfDay start of time window
     * @param endOfDay   end of time window
     * @return dirty notes matching criteria
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.user.id = :userId
              AND n.createdAt >= :startOfDay
              AND n.createdAt < :endOfDay
              AND (n.lastProcessedAt IS NULL OR n.updatedAt > n.lastProcessedAt)
            """)
    List<Note> findDirtyNotes(
            @Param("userId") Long userId,
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay
    );

    /**
     * Helper method to query dirty notes for a date and user.
     *
     * @param userId mandatory user identifier
     * @param date   calendar date
     * @return dirty notes matching criteria
     */
    default List<Note> findDirtyNotes(Long userId, LocalDate date) {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = date.atStartOfDay(zone).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(zone).toInstant();
        return findDirtyNotes(userId, startOfDay, endOfDay);
    }
}
