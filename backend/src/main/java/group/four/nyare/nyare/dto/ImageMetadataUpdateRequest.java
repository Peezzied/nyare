package group.four.nyare.nyare.dto;

import group.four.nyare.nyare.model.ImageMetadata;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.HashMap;
import java.util.Map;

/**
 * Targeted update payload used by AI pipelines to update note image metadata
 * without mutating student-authored markdown text.
 */
public class ImageMetadataUpdateRequest {

    @NotNull(message = "Image metadata map is required")
    private Map<String, @Valid ImageMetadata> imageMetadata = new HashMap<>();

    public ImageMetadataUpdateRequest() {
    }

    public ImageMetadataUpdateRequest(Map<String, ImageMetadata> imageMetadata) {
        this.imageMetadata = imageMetadata != null ? imageMetadata : new HashMap<>();
    }

    public Map<String, ImageMetadata> getImageMetadata() {
        return imageMetadata;
    }

    public void setImageMetadata(Map<String, ImageMetadata> imageMetadata) {
        this.imageMetadata = imageMetadata != null ? imageMetadata : new HashMap<>();
    }
}
