package group.four.nyare.nyare.ai.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Structured audit event published via {@code ApplicationEventPublisher} for the
 * dev audit trace console. Decouples production services from developer tooling.
 *
 * @param id              unique event identifier
 * @param timestamp       event generation timestamp
 * @param category        audit classification
 * @param severity        event severity
 * @param message         human-readable log or summary message
 * @param originUserId    user ID who initiated the request or action
 * @param originUsername  username or display name of the actor
 * @param triggerSource   web session or system job origin
 * @param mutationAction  mutation action when category is {@code DATA_MUTATION}
 * @param entityKind      target entity kind for mutations or record audits
 * @param entityId        target entity primary key or UUID string
 * @param changeSummary   short description of the mutation change
 * @param runId           planning run identifier for lifecycle correlation
 * @param noteId          source or referenced note ID
 * @param taskId          target task ID
 * @param eventId         target academic event ID
 * @param imageId         target image attachment ID
 * @param courseId        owning course identifier
 * @param rationale       AI planning reasoning or derivation explanation
 * @param quotedText      verbatim quoted text, e.g. for unrelated note info
 * @param durationMs      elapsed run execution time in milliseconds
 * @param lifecycleState  boundary state for lifecycle events
 * @param extractedCounts counts of tasks, events, and contexts created
 * @param errorDiagnostic exception details when severity is {@code ERROR}
 */
public record AuditTraceEvent(
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
}
