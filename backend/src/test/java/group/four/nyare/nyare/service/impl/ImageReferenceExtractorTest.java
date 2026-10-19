package group.four.nyare.nyare.service.impl;

import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ImageReferenceExtractorTest {

    @Test
    void extractIds_blankContent_returnsEmpty() {
        Set<UUID> result = ImageReferenceExtractor.extractIds("");
        assertThat(result).isEmpty();
    }

    @Test
    void extractIds_nullContent_returnsEmpty() {
        Set<UUID> result = ImageReferenceExtractor.extractIds(null);
        assertThat(result).isEmpty();
    }

    @Test
    void extractIds_singleImage_returnsOneId() {
        UUID imageId = UUID.randomUUID();
        String content = "Check ![slide](/api/images/" + imageId + ")";
        Set<UUID> result = ImageReferenceExtractor.extractIds(content);
        assertThat(result).containsExactly(imageId);
    }

    @Test
    void extractIds_multipleImages_returnsAllIdsInFirstSeenOrder() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        UUID id3 = UUID.randomUUID();
        String content = "![a](/api/images/" + id1 + ") text ![b](/api/images/" + id2 + ") more ![c](/api/images/" + id3 + ")";
        Set<UUID> result = ImageReferenceExtractor.extractIds(content);
        assertThat(result).containsExactly(id1, id2, id3);
    }

    @Test
    void extractIds_duplicateReferences_deduplicatesPreservingOrder() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        String content = "![a](/api/images/" + id1 + ") ![b](/api/images/" + id2 + ") again ![a](/api/images/" + id1 + ")";
        Set<UUID> result = ImageReferenceExtractor.extractIds(content);
        assertThat(result).containsExactly(id1, id2);
    }

    @Test
    void extractIds_malformedUrl_ignored() {
        UUID validId = UUID.randomUUID();
        String content = "valid ![a](/api/images/" + validId + ") invalid ![x](/api/images/not-a-uuid) end";
        Set<UUID> result = ImageReferenceExtractor.extractIds(content);
        assertThat(result).containsExactly(validId);
    }

    @Test
    void extractIds_uppercaseUuid_extracted() {
        UUID imageId = UUID.randomUUID();
        String content = "![x](/api/images/" + imageId.toString().toUpperCase() + ")";
        Set<UUID> result = ImageReferenceExtractor.extractIds(content);
        assertThat(result).containsExactly(imageId);
    }
}