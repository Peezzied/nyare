package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for task entities with mandatory user scoping.
 */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Finds a task by identifier only when its course belongs to the given user.
     *
     * @param id     the task identifier
     * @param userId the owner user identifier
     * @return the task when owned by the user, otherwise empty
     */
    Optional<Task> findByIdAndCourseUserId(UUID id, Long userId);

    /**
     * Retrieves all tasks matching user ID and optional course, status, and scheduled filters.
     *
     * @param userId    mandatory user identifier
     * @param courseId  optional course identifier
     * @param status    optional task status
     * @param scheduled optional scheduling filter
     * @param archived  course archive filter: {@code true} for archived courses, {@code false} for active courses
     * @param q         optional lowercase LIKE pattern matched against title and description
     * @param from      optional inclusive lower bound on {@code scheduledDate}
     * @param to        optional inclusive upper bound on {@code scheduledDate}
     * @return list of matching tasks ordered by creation date descending
     */
    @Query("""
            SELECT t FROM Task t
            WHERE t.course.user.id = :userId
              AND (:courseId IS NULL OR t.course.id = :courseId)
              AND (:status IS NULL OR t.status = :status)
              AND (:scheduled IS NULL
                   OR (:scheduled = true AND t.scheduledDate IS NOT NULL)
                   OR (:scheduled = false AND t.scheduledDate IS NULL))
              AND ((:archived = true AND t.course.archivedAt IS NOT NULL)
                   OR (:archived = false AND t.course.archivedAt IS NULL))
              AND (:q IS NULL OR LOWER(t.title) LIKE :q OR LOWER(t.description) LIKE :q)
              AND (:from IS NULL OR t.scheduledDate >= :from) AND (:to IS NULL OR t.scheduledDate <= :to)
            ORDER BY t.createdAt DESC
            """)
    List<Task> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("status") TaskStatus status,
            @Param("scheduled") Boolean scheduled,
            @Param("archived") Boolean archived,
            @Param("q") String q,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    /**
     * Deletes tasks associated with the specified notes where status does not match.
     *
     * @param notes  source notes to delete tasks for
     * @param status status to exclude from deletion
     */
    @Modifying
    @Query("DELETE FROM Task t WHERE t.note IN :notes AND t.status != :status")
    void deleteByNoteInAndStatusNot(@Param("notes") List<Note> notes, @Param("status") TaskStatus status);
}
