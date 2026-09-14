package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
     * Returns notes created on the given calendar date for a course.
     * Uses an index-friendly range query between the start and end of the date.
     *
     * @param courseId the course ID to filter by
     * @param today    the calendar date to match against {@code createdAt}
     * @return notes created today for the course
     */
    default List<Note> findTodayNotesByCourseId(Long courseId, LocalDate today) {
        Instant startOfDay = today.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
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
}
