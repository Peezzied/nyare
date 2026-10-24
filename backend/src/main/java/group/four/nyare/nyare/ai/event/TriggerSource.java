package group.four.nyare.nyare.ai.event;

/**
 * Origin of an audited action.
 *
 * <ul>
 *   <li>{@code WEB_SESSION} — Explicit user interaction authenticated via session.</li>
 *   <li>{@code SYSTEM_JOB} — Background scheduled task or automated execution.</li>
 * </ul>
 */
public enum TriggerSource {
    WEB_SESSION,
    SYSTEM_JOB
}
