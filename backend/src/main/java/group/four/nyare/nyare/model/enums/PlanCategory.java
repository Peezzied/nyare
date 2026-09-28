package group.four.nyare.nyare.model.enums;

/**
 * Tri-state planning category derived from a Task's scheduledDate and duration.
 *
 * <ul>
 *   <li>{@code SCHEDULED} — Task has a recommended calendar date.</li>
 *   <li>{@code LATER} — Task has an estimated duration but no specific date.</li>
 *   <li>{@code BACKLOG} — Task lacks both a date and a duration estimate.</li>
 * </ul>
 */
public enum PlanCategory {
    SCHEDULED,
    LATER,
    BACKLOG
}
