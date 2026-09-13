package group.four.nyare.nyare.Repositories;

import group.four.nyare.nyare.Models.Enums.TaskStatus;
import group.four.nyare.nyare.Models.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link Task} entities.
 * Handles persistence, retrieval, and dynamic filtering for study plan tasks.
 */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * Retrieves all tasks matching optional course, status, and scheduling filters,
     * ordered by creation timestamp in descending order.
     *
     * @param courseId  optional ID of the course to filter by; {@code null} matches any course
     * @param status    optional lifecycle status to filter by; {@code null} matches any status
     * @param scheduled optional scheduling filter: {@code true} for scheduled tasks (non-null date),
     *                  {@code false} for unscheduled/later tasks (null date), or {@code null} for both
     * @return a list of matching {@link Task} entities
     */
    @Query("""
            SELECT t FROM Task t
            WHERE (:courseId IS NULL OR t.course.id = :courseId)
              AND (:status IS NULL OR t.status = :status)
              AND (:scheduled IS NULL
                   OR (:scheduled = true AND t.scheduledDate IS NOT NULL)
                   OR (:scheduled = false AND t.scheduledDate IS NULL))
            ORDER BY t.createdAt DESC
            """)
    List<Task> findAllFiltered(
            @Param("courseId") Long courseId,
            @Param("status") TaskStatus status,
            @Param("scheduled") Boolean scheduled
    );
}
