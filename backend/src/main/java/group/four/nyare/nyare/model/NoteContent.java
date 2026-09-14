package group.four.nyare.nyare.model;

import group.four.nyare.nyare.model.validation.ValidImageReferences;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.HashMap;
import java.util.Map;

/**
 * Structured content of a note containing a markdown body and accompanying image metadata.
 */
@ValidImageReferences
public class NoteContent {

    @NotBlank(message = "Markdown content cannot be blank")
    private String markdown;

    @NotNull(message = "Image metadata map cannot be null")
    private Map<String, @Valid ImageMetadata> imageMetadata = new HashMap<>();

    public NoteContent() {
    }

    public NoteContent(String markdown, Map<String, ImageMetadata> imageMetadata) {
        this.markdown = markdown;
        this.imageMetadata = imageMetadata != null ? imageMetadata : new HashMap<>();
    }

    public String getMarkdown() {
        return markdown;
    }

    public void setMarkdown(String markdown) {
        this.markdown = markdown;
    }

    public Map<String, ImageMetadata> getImageMetadata() {
        return imageMetadata;
    }

    public void setImageMetadata(Map<String, ImageMetadata> imageMetadata) {
        this.imageMetadata = imageMetadata != null ? imageMetadata : new HashMap<>();
    }
}
