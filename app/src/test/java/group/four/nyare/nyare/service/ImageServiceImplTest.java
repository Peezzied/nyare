package group.four.nyare.nyare.service;

import group.four.nyare.nyare.ai.observability.ErrorAuditPublisher;
import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.ImageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageServiceImplTest {

    @Mock
    private ImageRepository imageRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ErrorAuditPublisher errorAuditPublisher;

    @InjectMocks
    private ImageServiceImpl imageService;

    private UUID imageId;
    private User owner;
    private Image sampleImage;

    @BeforeEach
    void setUp() {
        imageId = UUID.randomUUID();
        owner = new User("image_owner");
        sampleImage = new Image(new byte[]{1, 2, 3}, "image/png", "sample.png", 3L, owner);
    }

    @Test
    void uploadImage_withValidFile_returnsResponse() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{1, 2, 3});
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(imageRepository.save(any(Image.class))).thenAnswer(inv -> {
            Image img = inv.getArgument(0);
            return img;
        });

        ImageUploadResponse response = imageService.uploadImage(file, 1L);

        assertThat(response).isNotNull();
        assertThat(response.getContentType()).isEqualTo("image/png");
        assertThat(response.getSize()).isEqualTo(3L);
    }

    @Test
    void uploadImage_withEmptyFile_throwsBadRequestException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> imageService.uploadImage(emptyFile, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be empty");
    }

    @Test
    void uploadImage_withUnsupportedFormat_throwsBadRequestException() {
        MockMultipartFile pdfFile = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1, 2});

        assertThatThrownBy(() -> imageService.uploadImage(pdfFile, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported image format");
    }

    @Test
    void getImage_withExistingId_returnsImage() {
        when(imageRepository.findByIdAndUserId(imageId, 1L)).thenReturn(Optional.of(sampleImage));

        Image image = imageService.getImage(imageId, 1L);

        assertThat(image).isNotNull();
        assertThat(image.getContentType()).isEqualTo("image/png");
    }

    @Test
    void getImage_withNonExistingId_throwsResourceNotFoundException() {
        when(imageRepository.findByIdAndUserId(imageId, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> imageService.getImage(imageId, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Image not found with ID");
    }

    @Test
    void getImage_withOtherUsersImage_throwsResourceNotFoundException() {
        when(imageRepository.findByIdAndUserId(imageId, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> imageService.getImage(imageId, 2L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Image not found with ID");
    }

    @Test
    void deleteImage_withExistingId_deletesImage() {
        when(imageRepository.findByIdAndUserId(imageId, 1L)).thenReturn(Optional.of(sampleImage));

        imageService.deleteImage(imageId, 1L);

        verify(imageRepository).delete(sampleImage);
    }

    @Test
    void deleteImages_ownedIds_deletesAndPublishes() {
        Image secondImage = new Image(new byte[]{4, 5}, "image/png", "second.png", 2L, owner);
        List<UUID> ids = List.of(imageId, UUID.randomUUID());
        when(imageRepository.findByUserIdAndIdIn(1L, ids))
                .thenReturn(List.of(sampleImage, secondImage));

        imageService.deleteImages(ids, 1L);

        verify(imageRepository).deleteAll(List.of(sampleImage, secondImage));
    }

    @Test
    void deleteImages_emptyIds_noRepositoryCall() {
        imageService.deleteImages(List.of(), 1L);

        verifyNoInteractions(imageRepository);
    }

    @Test
    void deleteImages_partialOwnership_deletesOnlyOwned() {
        List<UUID> ids = List.of(imageId, UUID.randomUUID());
        when(imageRepository.findByUserIdAndIdIn(1L, ids))
                .thenReturn(List.of(sampleImage));

        imageService.deleteImages(ids, 1L);

        verify(imageRepository).deleteAll(List.of(sampleImage));
    }
}
