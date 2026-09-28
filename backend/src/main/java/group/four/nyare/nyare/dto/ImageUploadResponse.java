package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response payload returned after uploading an image asset.
 */
public class ImageUploadResponse {

    private UUID id;
    private String url;
    private String contentType;
    private long size;
    private Instant createdAt;

    public ImageUploadResponse() {
    }

    public ImageUploadResponse(UUID id, String url, String contentType, long size, Instant createdAt) {
        this.id = id;
        this.url = url;
        this.contentType = contentType;
        this.size = size;
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
