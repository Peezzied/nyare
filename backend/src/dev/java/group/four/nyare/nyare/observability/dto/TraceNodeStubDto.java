package group.four.nyare.nyare.observability.dto;

import group.four.nyare.nyare.ai.observability.event.TraceKind;

/**
 * Compact pointer card within a relation group.
 *
 * @param kind     target entity kind
 * @param id       target identifier
 * @param title    target title or summary
 * @param subtitle supporting info such as scheduled date or duration
 * @param isExact  {@code true} for exact ID match, {@code false} for title match
 */
public record TraceNodeStubDto(
        TraceKind kind,
        String id,
        String title,
        String subtitle,
        boolean isExact) {
}
