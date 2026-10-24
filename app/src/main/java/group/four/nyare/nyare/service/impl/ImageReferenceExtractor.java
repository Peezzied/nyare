package group.four.nyare.nyare.service.impl;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Extracts the well-formed /api/images/{uuid} references from note markdown. */
public final class ImageReferenceExtractor {

    private static final Pattern IMAGE_URL_PATTERN = Pattern.compile(
            "/api/images/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})");

    private ImageReferenceExtractor() {
    }

    public static Set<UUID> extractIds(String content) {
        if (content == null || content.isBlank()) {
            return Set.of();
        }
        Set<UUID> ids = new LinkedHashSet<>();
        Matcher matcher = IMAGE_URL_PATTERN.matcher(content);
        while (matcher.find()) {
            ids.add(UUID.fromString(matcher.group(1)));
        }
        return ids;
    }
}