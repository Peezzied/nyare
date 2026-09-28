package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.service.impl.ImageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageServiceImplTest {

    @Mock
    private ImageRepository imageRepository;

    @InjectMocks
    private ImageServiceImpl imageService;

    private UUID imageId;
    private Image sampleImage;

    @BeforeEach
    void setUp() {
        imageId = UUID.randomUUID();
        sampleImage = new Image(new byte[]{1, 2, 3}, "image/png", "sample.png", 3L);
    }

    @Test
    void uploadImage_withValidFile_returnsResponse() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{1, 2, 3});
        when(imageRepository.save(any(Image.class))).thenAnswer(inv -> {
            Image img = inv.getArgument(0);
            return img;
        });

        ImageUploadResponse response = imageService.uploadImage(file);

        assertThat(response).isNotNull();
        assertThat(response.getContentType()).isEqualTo("image/png");
        assertThat(response.getSize()).isEqualTo(3L);
    }

    @Test
    void uploadImage_withEmptyFile_throwsBadRequestException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.png", "image/png", new byte[0]);

        assertThatThrownBy(() -> imageService.uploadImage(emptyFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be empty");
    }

    @Test
    void uploadImage_withUnsupportedFormat_throwsBadRequestException() {
        MockMultipartFile pdfFile = new MockMultipartFile("file", "doc.pdf", "application/pdf", new byte[]{1, 2});

        assertThatThrownBy(() -> imageService.uploadImage(pdfFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported image format");
    }

    @Test
    void getImage_withExistingId_returnsImage() {
        when(imageRepository.findById(imageId)).thenReturn(Optional.of(sampleImage));

        Image image = imageService.getImage(imageId);

        assertThat(image).isNotNull();
        assertThat(image.getContentType()).isEqualTo("image/png");
    }

    @Test
    void getImage_withNonExistingId_throwsResourceNotFoundException() {
        when(imageRepository.findById(imageId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> imageService.getImage(imageId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Image not found with ID");
    }

    @Test
    void deleteImage_withExistingId_deletesImage() {
        when(imageRepository.findById(imageId)).thenReturn(Optional.of(sampleImage));

        imageService.deleteImage(imageId);

        verify(imageRepository).delete(sampleImage);
    }
}
