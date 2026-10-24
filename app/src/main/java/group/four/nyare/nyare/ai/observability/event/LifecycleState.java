package group.four.nyare.nyare.ai.observability.event;

/**
 * Boundary state of a planning run.
 *
 * <ul>
 *   <li>{@code STARTED} — Planning run initialized.</li>
 *   <li>{@code COMPLETED} — Planning run completed and transaction committed.</li>
 *   <li>{@code FAILED} — Planning run aborted due to an error.</li>
 *   <li>{@code CANCELLED} — Planning run cancelled due to client disconnect.</li>
 * </ul>
 */
public enum LifecycleState {
    STARTED,
    COMPLETED,
    FAILED,
    CANCELLED
}
