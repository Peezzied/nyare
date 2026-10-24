package group.four.nyare.nyare.ai.event;

/**
 * Kind of entity a trace node or mutation targets.
 *
 * <p>Constants are lowercase by contract: the dev node endpoint binds
 * {@code /dev/audit-trace/node/{kind}/{id}} path values directly, and JSON
 * payloads serialize kind values in lowercase.
 */
public enum TraceKind {
    course,
    note,
    task,
    event,
    image,
    schedule,
    context,
    lifecycle
}
