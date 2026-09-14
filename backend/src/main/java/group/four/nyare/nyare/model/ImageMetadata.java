package group.four.nyare.nyare.model;

import jakarta.validation.constraints.NotBlank;

/**
 * Value object representing metadata and AI-extracted context for an embedded note image.
 */
public class ImageMetadata {

    @NotBlank(message = "Base64 image data cannot be blank")
    private String base64;

    private String description;

    public ImageMetadata() {
    }

    public ImageMetadata(String base64, String description) {
        this.base64 = base64;
        this.description = description;
    }

    public String getBase64() {
        return base64;
    }

    public void setBase64(String base64) {
        this.base64 = base64;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
