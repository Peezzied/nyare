package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.model.Image;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Service contract for image asset management.
 */
public interface ImageService {

    /**
     * Stores an uploaded image binary and returns metadata.
     *
     * @param file the uploaded multipart file
     * @return image upload response with URL
     */
    ImageUploadResponse uploadImage(MultipartFile file);

    /**
     * Retrieves an image entity by ID.
     *
     * @param id the image UUID
     * @return the image entity
     */
    Image getImage(UUID id);

    /**
     * Deletes an image by ID.
     *
     * @param id the image UUID
     */
    void deleteImage(UUID id);
}
