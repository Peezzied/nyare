package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA repository for {@link Image} entities.
 */
@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {
}
