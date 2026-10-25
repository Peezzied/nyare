package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.model.Image;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.UUID;

/**
 * Service contract for image asset management.
 */
public interface ImageService {

    /**
     * Stores an uploaded image binary under the given owner and returns metadata.
     *
     * @param file   the uploaded multipart file
     * @param userId the session user identifier that owns the image
     * @return image upload response with URL
     */
    ImageUploadResponse uploadImage(MultipartFile file, Long userId);

    /**
     * Retrieves an image entity by ID scoped to the owner.
     *
     * @param id     the image UUID
     * @param userId the session user identifier
     * @return the image entity
     */
    Image getImage(UUID id, Long userId);

    /**
     * Deletes an image by ID scoped to the owner.
     *
     * @param id     the image UUID
     * @param userId the session user identifier
     */
    void deleteImage(UUID id, Long userId);

    /**
     * Bulk-deletes images owned by the session user. IDs the user does not
     * own are silently skipped.
     *
     * @param ids    the image UUIDs to delete
     * @param userId the session user identifier
     */
    void deleteImages(Collection<UUID> ids, Long userId);
}
