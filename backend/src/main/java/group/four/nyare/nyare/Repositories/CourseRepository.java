package group.four.nyare.nyare.Repositories;

import group.four.nyare.nyare.Models.Course;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Spring Data JPA repository for {@link Course} aggregate root entities.
 * Provides standard CRUD capabilities and query operations for course validation and management.
 */
public interface CourseRepository extends JpaRepository<Course, Long> {
}

