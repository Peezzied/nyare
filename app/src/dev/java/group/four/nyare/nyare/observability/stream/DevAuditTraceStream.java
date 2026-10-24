package group.four.nyare.nyare.observability.stream;

import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.observability.dto.AuditTraceEventDto;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Fan-out broadcaster for the live audit feed. Retains one {@link SseEmitter}
 * per connected dashboard client and pushes every published
 * {@link AuditTraceEvent} as an {@code audit} SSE event carrying the
 * {@link AuditTraceEventDto} JSON. Dev-sourceSet only; dead emitters are
 * dropped on completion, timeout, error, or a failed write.
 */
@Profile("dev | observability")
@Component
public class DevAuditTraceStream {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ObjectMapper objectMapper;

    public DevAuditTraceStream(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Registers a client emitter for the live feed. The timeout is disabled so
     * the stream stays open until the client disconnects.
     *
     * @return the emitter bound to this client
     */
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onError(ex -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            emitter.complete();
        });
        // Flushes response headers so EventSource leaves CONNECTING before the
        // first audit event arrives.
        try {
            emitter.send(SseEmitter.event().comment("connected"));
        } catch (IOException | IllegalStateException ex) {
            emitters.remove(emitter);
        }
        return emitter;
    }

    @EventListener
    public void onAuditTraceEvent(AuditTraceEvent event) {
        String json = objectMapper.writeValueAsString(AuditTraceEventDto.from(event));
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("audit").data(json));
            } catch (IOException | IllegalStateException ex) {
                emitters.remove(emitter);
                completeQuietly(emitter);
            }
        }
    }

    private void completeQuietly(SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (RuntimeException ex) {
            // Emitter already completed or the client is gone.
        }
    }
}
