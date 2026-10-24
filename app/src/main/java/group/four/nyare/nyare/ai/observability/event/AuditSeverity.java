package group.four.nyare.nyare.ai.observability.event;

/**
 * Severity level of an audit trace event.
 *
 * <ul>
 *   <li>{@code INFO} — Normal operational, planning, and mutation steps.</li>
 *   <li>{@code WARN} — Filtered statements, missing references, or non-fatal anomalies.</li>
 *   <li>{@code ERROR} — Unhandled exceptions, LLM timeouts, and aborted runs.</li>
 * </ul>
 */
public enum AuditSeverity {
    INFO,
    WARN,
    ERROR
}
