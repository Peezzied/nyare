package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for task entities with mandatory user scoping.
 */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Retrieves all tasks matching user ID and optional course, status, and scheduled filters.
     *
     * @param userId    mandatory user identifier
     * @param courseId  optional course identifier
     * @param status    optional task status
     * @param scheduled optional scheduling filter
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
            ORDER BY t.createdAt DESC
            """)
    List<Task> findAllFiltered(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("status") TaskStatus status,
            @Param("scheduled") Boolean scheduled
    );
}
