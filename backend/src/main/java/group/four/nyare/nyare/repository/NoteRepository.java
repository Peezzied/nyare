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
 * Spring Data JPA repository for {@link Note} entities.
 */
public interface NoteRepository extends JpaRepository<Note, UUID> {

    /**
     * Returns all notes for a course ordered by creation timestamp descending.
     *
     * @param courseId the course ID to filter by
     * @return notes ordered newest first
     */
    List<Note> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    /**
     * Returns all notes ordered by creation timestamp descending.
     *
     * @return notes ordered newest first
     */
    List<Note> findAllByOrderByCreatedAtDesc();

    /**
     * Returns all notes matching optional user and course filters, ordered by creation timestamp descending.
     *
     * @param userId   optional user ID filter
     * @param courseId optional course ID filter
     * @return notes ordered newest first
     */
    @Query("""
            SELECT n FROM Note n
            WHERE (:userId IS NULL OR n.course.user.id = :userId)
              AND (:courseId IS NULL OR n.course.id = :courseId)
            ORDER BY n.createdAt DESC
            """)
    List<Note> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );

    default List<Note> findAllFiltered(Long courseId) {
        return findAllFiltered(null, courseId);
    }

    /**
     * Returns notes created on the given calendar date for a course.
     * Uses an index-friendly range query between the start and end of the date in the local timezone.
     *
     * @param courseId the course ID to filter by
     * @param today    the calendar date to match against {@code createdAt}
     * @return notes created today for the course
     */
    default List<Note> findTodayNotesByCourseId(Long courseId, LocalDate today) {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = today.atStartOfDay(zone).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(zone).toInstant();
        return findNotesByCourseIdAndCreatedAtRange(courseId, startOfDay, endOfDay);
    }

    /**
     * Internal query matching notes within a timestamp boundary.
     *
     * @param courseId   the course ID to filter by
     * @param startOfDay beginning of the date window (inclusive)
     * @param endOfDay   end of the date window (exclusive)
     * @return notes within the timestamp window
     */
    @Query("""
            SELECT n FROM Note n
            WHERE n.course.id = :courseId
              AND n.createdAt >= :startOfDay
              AND n.createdAt < :endOfDay
            """)
    List<Note> findNotesByCourseIdAndCreatedAtRange(
            @Param("courseId") Long courseId,
            @Param("startOfDay") Instant startOfDay,
            @Param("endOfDay") Instant endOfDay
    );

    /**
     * Returns notes created on the date window matching optional user filter that are either unextracted or modified after last extraction.
     *
     * @param userId     optional user ID filter
     * @param startOfDay beginning of the date window (inclusive)
     * @param endOfDay   end of the date window (exclusive)
     * @return dirty notes matching the criteria
     */
    @Query("""
            SELECT n FROM Note n
            WHERE (:userId IS NULL OR n.course.user.id = :userId)
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
     * Convenience default method to query dirty notes for timestamp boundaries across all courses.
     *
     * @param startOfDay beginning of the date window (inclusive)
     * @param endOfDay   end of the date window (exclusive)
     * @return dirty notes matching the criteria
     */
    default List<Note> findDirtyNotes(Instant startOfDay, Instant endOfDay) {
        return findDirtyNotes(null, startOfDay, endOfDay);
    }

    /**
     * Convenience default method to query dirty notes for the given date matching optional user filter.
     *
     * @param userId optional user ID filter
     * @param date   the calendar date
     * @return dirty notes created or modified on the date
     */
    default List<Note> findDirtyNotes(Long userId, LocalDate date) {
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = date.atStartOfDay(zone).toInstant();
        Instant endOfDay = date.plusDays(1).atStartOfDay(zone).toInstant();
        return findDirtyNotes(userId, startOfDay, endOfDay);
    }

    /**
     * Convenience default method to query dirty notes for the given date across all courses.
     *
     * @param date the calendar date
     * @return dirty notes created or modified on the date
     */
    default List<Note> findDirtyNotes(LocalDate date) {
        return findDirtyNotes(null, date);
    }
}
