package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link Course} aggregate root entities.
 * Provides standard CRUD capabilities and query operations for course validation and management.
 */
public interface CourseRepository extends JpaRepository<Course, Long> {

    /**
     * Finds all courses owned by a specific user.
     *
     * @param userId the owner user identifier
     * @return list of courses for the given user
     */
    List<Course> findByUserId(Long userId);
}
