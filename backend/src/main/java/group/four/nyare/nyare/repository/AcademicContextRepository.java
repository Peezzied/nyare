package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.AcademicContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link AcademicContext} entities.
 * Provides temporal context retrieval for AI planner services.
 */
public interface AcademicContextRepository extends JpaRepository<AcademicContext, UUID> {

    /**
     * Retrieves academic context records matching an optional course filter.
     * Orders records by creation timestamp descending.
     *
     * @param courseId optional course identifier
     * @return list of academic context records ordered by createdAt descending
     */
    @Query("""
            SELECT c FROM AcademicContext c
            WHERE (:courseId IS NULL OR c.course.id = :courseId)
            ORDER BY c.createdAt DESC
            """)
    List<AcademicContext> findAllFiltered(@Param("courseId") Long courseId);

    /**
     * Retrieves all context records for a specific course.
     * Orders records by creation timestamp descending.
     *
     * @param courseId the course identifier
     * @return list of academic context records ordered by createdAt descending
     */
    List<AcademicContext> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    /**
     * Retrieves academic context records for a set of courses, ordered by creation
     * timestamp descending.
     *
     * @param courseIds the set of course IDs to include
     * @return context records ordered by createdAt descending
     */
    List<AcademicContext> findByCourseIdInOrderByCreatedAtDesc(Set<Long> courseIds);
}
