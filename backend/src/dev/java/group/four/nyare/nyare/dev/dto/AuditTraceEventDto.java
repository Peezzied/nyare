package group.four.nyare.nyare.dev.dto;

import group.four.nyare.nyare.ai.event.AuditCategory;
import group.four.nyare.nyare.ai.event.AuditSeverity;
import group.four.nyare.nyare.ai.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.event.ErrorDiagnostic;
import group.four.nyare.nyare.ai.event.LifecycleState;
import group.four.nyare.nyare.ai.event.MutationAction;
import group.four.nyare.nyare.ai.event.TraceKind;
import group.four.nyare.nyare.ai.event.TriggerSource;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Serialized audit event served on the dev dashboard feed and SSE stream.
 * Mirrors the {@code AuditTraceEvent} domain record for JSON transport.
 */
public record AuditTraceEventDto(
        UUID id,
        Instant timestamp,
        AuditCategory category,
        AuditSeverity severity,
        String message,
        Long originUserId,
        String originUsername,
        TriggerSource triggerSource,
        MutationAction mutationAction,
        TraceKind entityKind,
        String entityId,
        String changeSummary,
        UUID runId,
        UUID noteId,
        UUID taskId,
        UUID eventId,
        UUID imageId,
        Long courseId,
        String rationale,
        String quotedText,
        Long durationMs,
        LifecycleState lifecycleState,
        Map<String, Integer> extractedCounts,
        ErrorDiagnostic errorDiagnostic) {

    /**
     * Copies a domain {@link AuditTraceEvent} into its transport shape.
     *
     * @param event the retained audit event
     * @return the serialized event for the feed and SSE stream
     */
    public static AuditTraceEventDto from(AuditTraceEvent event) {
        return new AuditTraceEventDto(
                event.id(), event.timestamp(), event.category(), event.severity(),
                event.message(), event.originUserId(), event.originUsername(),
                event.triggerSource(), event.mutationAction(), event.entityKind(),
                event.entityId(), event.changeSummary(), event.runId(),
                event.noteId(), event.taskId(), event.eventId(), event.imageId(),
                event.courseId(), event.rationale(), event.quotedText(),
                event.durationMs(), event.lifecycleState(), event.extractedCounts(),
                event.errorDiagnostic());
    }
}
