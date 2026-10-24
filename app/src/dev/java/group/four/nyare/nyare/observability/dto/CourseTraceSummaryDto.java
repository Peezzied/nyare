package group.four.nyare.nyare.observability.dto;

/**
 * Course entry point for top-level database navigation in the dev console.
 *
 * @param id       course identifier
 * @param name     course display name
 * @param color    stored course palette slug (e.g. {@code peacock})
 * @param colorHex resolved solid hex for the entry dot: a stored palette slug
 *                 wins, otherwise the deterministic id-based palette pick
 */
public record CourseTraceSummaryDto(
        Long id,
        String name,
        String color,
        String colorHex) {
}
