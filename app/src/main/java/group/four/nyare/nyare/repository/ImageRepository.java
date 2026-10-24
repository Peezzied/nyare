package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link Image} entities.
 */
@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {

    Optional<Image> findByIdAndUserId(UUID id, Long userId);

    List<Image> findByUserIdAndIdIn(Long userId, Collection<UUID> ids);

    /**
     * Finds image metadata by identifier without loading the binary payload.
     * Used by the dev audit trace console so {@code Image.data} is never selected.
     *
     * @param id the image identifier
     * @return the image metadata projection, otherwise empty
     */
    Optional<ImageMetadataView> findMetadataById(UUID id);

    /**
     * Finds metadata for a set of image identifiers without loading binaries.
     * Used by the dev audit trace console for note-to-image relation walking.
     *
     * @param ids the image identifiers to resolve
     * @return metadata projections for the images that exist
     */
    List<ImageMetadataView> findAllMetadataByIdIn(Collection<UUID> ids);
}
