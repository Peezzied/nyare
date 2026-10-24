package group.four.nyare.nyare.observability.dto;

import group.four.nyare.nyare.ai.observability.event.TraceKind;

import java.util.List;

/**
 * A named collection of related entity records.
 *
 * @param groupName  label such as "Child Tasks" or "Referenced Images"
 * @param targetKind target entity kind
 * @param totalCount total count of associated records in the database
 * @param items      truncated list of related nodes, capped at 50
 */
public record TraceRelationGroupDto(
        String groupName,
        TraceKind targetKind,
        int totalCount,
        List<TraceNodeStubDto> items) {
}
