package group.four.nyare.nyare.repository;

import java.time.Instant;
import java.util.UUID;

/**
 * Closed projection exposing {@code Image} metadata columns only. Spring Data
 * selects just the declared columns, so the {@code data} byte array is never
 * fetched. Used by the dev audit trace console (FR-014).
 */
public interface ImageMetadataView {

    UUID getId();

    String getContentType();

    String getFilename();

    long getSize();

    String getDescription();

    Instant getCreatedAt();

    UserIdView getUser();

    /**
     * Nested projection selecting only the owning user's identifier.
     */
    interface UserIdView {

        Long getId();
    }
}
