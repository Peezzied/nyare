package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.ImageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Service implementation for persisting and retrieving image media.
 */
@Service
@Transactional(readOnly = true)
public class ImageServiceImpl implements ImageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;

    public ImageServiceImpl(ImageRepository imageRepository, UserRepository userRepository) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ImageUploadResponse uploadImage(MultipartFile file, Long userId) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Unsupported image format: " + contentType);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        try {
            byte[] bytes = file.getBytes();
            Image image = new Image(bytes, contentType, file.getOriginalFilename(), file.getSize(), user);
            Image saved = imageRepository.save(image);
            String url = "/api/images/" + saved.getId();
            return new ImageUploadResponse(saved.getId(), url, saved.getContentType(), saved.getSize(), saved.getCreatedAt());
        } catch (IOException e) {
            throw new BadRequestException("Failed to read image data: " + e.getMessage());
        }
    }

    @Override
    public Image getImage(UUID id, Long userId) {
        return imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + id));
    }

    @Override
    @Transactional
    public void deleteImage(UUID id, Long userId) {
        Image image = imageRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + id));
        imageRepository.delete(image);
    }
}
