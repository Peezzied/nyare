package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.event.AuditCategory;
import group.four.nyare.nyare.ai.event.AuditSeverity;
import group.four.nyare.nyare.ai.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.event.MutationAction;
import group.four.nyare.nyare.ai.event.TraceKind;
import group.four.nyare.nyare.ai.event.TriggerSource;
import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.ImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
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

    private static final Logger log = LoggerFactory.getLogger(ImageServiceImpl.class);

    private final ImageRepository imageRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ImageServiceImpl(ImageRepository imageRepository, UserRepository userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.imageRepository = imageRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
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
            publishMutation(MutationAction.CREATE, saved, userId,
                    "Image uploaded: '" + saved.getFilename() + "'");
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
        publishMutation(MutationAction.DELETE, image, userId,
                "Image deleted: '" + image.getFilename() + "'");
    }

    /**
     * Publishes a {@link AuditCategory#DATA_MUTATION} trace event for an image
     * mutation. Listener failures are swallowed: dev tooling must never break
     * a mutation.
     */
    private void publishMutation(MutationAction action, Image image, Long userId, String summary) {
        try {
            User user = image.getUser();
            AuditTraceEvent event = new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                    summary, userId, user != null ? user.getUsername() : null,
                    TriggerSource.WEB_SESSION, action, TraceKind.image,
                    String.valueOf(image.getId()), summary,
                    null, null, null, null, image.getId(), null,
                    null, null, null, null, null, null);
            // Defer until afterCommit so a commit-time rollback cannot leave a
            // phantom mutation event in the dev trace feed.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        publishEvent(event);
                    }
                });
            } else {
                publishEvent(event);
            }
        } catch (Exception e) {
            log.warn("Audit trace listener failed for image {} event: {}", action, e.getMessage());
        }
    }

    private void publishEvent(AuditTraceEvent event) {
        try {
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.warn("Audit trace listener failed for {} {} event: {}",
                    event.entityKind(), event.mutationAction(), e.getMessage());
        }
    }
}
