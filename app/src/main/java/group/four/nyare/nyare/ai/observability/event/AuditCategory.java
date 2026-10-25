package group.four.nyare.nyare.ai.observability.event;

/**
 * Audit classification for developer trace events.
 *
 * <ul>
 *   <li>{@code LIFECYCLE} — Planning run boundary events.</li>
 *   <li>{@code TASK_PLANNING} — Generation of new actionable tasks from notes.</li>
 *   <li>{@code TASK_PROMOTION} — Schedule assignment of existing backlog tasks.</li>
 *   <li>{@code EVENT_PLANNING} — Derivation of rigid academic events and deadlines.</li>
 *   <li>{@code IMAGE_CONTEXT} — Image description previews for note attachments.</li>
 *   <li>{@code UNRELATED_INFO} — Statements filtered out as non-academic.</li>
 *   <li>{@code DATA_MUTATION} — State-modifying actions on core records.</li>
 *   <li>{@code SYSTEM_ERROR} — Unhandled server and AI or image pipeline failures.</li>
 * </ul>
 */
public enum AuditCategory {
    LIFECYCLE,
    TASK_PLANNING,
    TASK_PROMOTION,
    EVENT_PLANNING,
    IMAGE_CONTEXT,
    UNRELATED_INFO,
    DATA_MUTATION,
    SYSTEM_ERROR
}
