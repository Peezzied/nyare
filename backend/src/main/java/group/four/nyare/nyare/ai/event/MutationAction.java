package group.four.nyare.nyare.ai.event;

/**
 * State-modifying action audited on a core record.
 *
 * <ul>
 *   <li>{@code CREATE} — Entity created.</li>
 *   <li>{@code UPDATE} — Entity properties modified.</li>
 *   <li>{@code DELETE} — Entity removed.</li>
 *   <li>{@code ARCHIVE} — Course archived or unarchived.</li>
 * </ul>
 */
public enum MutationAction {
    CREATE,
    UPDATE,
    DELETE,
    ARCHIVE
}
