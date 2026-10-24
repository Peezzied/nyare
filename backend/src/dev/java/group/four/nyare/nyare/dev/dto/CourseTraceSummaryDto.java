package group.four.nyare.nyare.dev.dto;

/**
 * Course entry point for top-level database navigation in the dev console.
 *
 * @param id    course identifier
 * @param name  course display name
 * @param color course palette color for the entry badge
 */
public record CourseTraceSummaryDto(
        Long id,
        String name,
        String color) {
}
