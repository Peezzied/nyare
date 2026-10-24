package group.four.nyare.nyare.observability.dto;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;

import java.util.List;

/**
 * One entry in the dashboard category filter. A group with several categories
 * renders as a parent chip that filters to every member, with each member
 * nested under it as an individually selectable child chip. A group with one
 * category renders as a flat chip.
 *
 * @param key        filter token bound to the parent chip (e.g. {@code AI_ENGINE})
 * @param label      display label for the parent chip
 * @param categories member categories this group filters to
 */
public record CategoryGroupDto(
        String key,
        String label,
        List<AuditCategory> categories) {
}
