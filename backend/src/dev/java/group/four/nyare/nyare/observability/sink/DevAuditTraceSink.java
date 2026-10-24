package group.four.nyare.nyare.observability.sink;

import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

/**
 * In-memory bounded buffer retaining audit trace events for the dev console.
 * Dev-sourceSet only; the buffer resets on restart.
 *
 * <p>Deque orientation: newest events sit at the head, oldest at the tail.
 * Iteration order is therefore newest-first, matching the dashboard feed.
 */
@Component
public class DevAuditTraceSink {

    private static final int MAX_EVENTS = 500;

    private final ConcurrentLinkedDeque<AuditTraceEvent> events = new ConcurrentLinkedDeque<>();

    @EventListener
    public void onAuditTraceEvent(AuditTraceEvent event) {
        events.offerFirst(event);
        while (events.size() > MAX_EVENTS) {
            events.pollLast();
        }
    }

    /**
     * Returns a snapshot of retained events ordered newest-first.
     *
     * @return immutable copy of the buffer, at most {@value #MAX_EVENTS} events
     */
    public List<AuditTraceEvent> snapshot() {
        return List.copyOf(events);
    }
}
