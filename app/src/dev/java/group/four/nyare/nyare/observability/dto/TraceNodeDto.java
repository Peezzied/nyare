package group.four.nyare.nyare.observability.dto;

import group.four.nyare.nyare.ai.observability.event.TraceKind;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Inspected entity record and its surrounding relationship graph for the
 * detail pane. A tombstone record carries {@code isDeleted} and
 * {@code deletedAt} for entities removed during the session.
 *
 * @param kind         entity kind
 * @param id           primary key or UUID string
 * @param displayTitle human-readable label such as course code or task title
 * @param status       entity state such as task status, plan category, or note date
 * @param isDeleted    {@code true} when this is a tombstone for a deleted entity
 * @param deletedAt    deletion timestamp when {@code isDeleted} is true
 * @param attributes   key-value dictionary of non-binary record fields
 * @param relations    outgoing relationships to neighbouring entities
 */
public record TraceNodeDto(
        TraceKind kind,
        String id,
        String displayTitle,
        String status,
        boolean isDeleted,
        Instant deletedAt,
        Map<String, Object> attributes,
        List<TraceRelationGroupDto> relations) {
}
