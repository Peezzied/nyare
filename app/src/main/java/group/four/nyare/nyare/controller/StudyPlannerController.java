package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.PlannerStatusResponse;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.event.PlanningProgressEvent;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import java.util.concurrent.CancellationException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * REST controller for AI-powered journal processing.
 */
@RestController
@RequestMapping("/api/study-planner")
public class StudyPlannerController {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final StudyPlannerService studyPlannerService;
    private final SessionContext sessionContext;
    private final long sseHeartbeatMs;

    // The pool holds one SQLite connection and a run checks it out for its whole
    // transaction, so a status call during a run would starve. The committed state
    // cannot change mid-run, so the pre-flight snapshot answers /status identically.
    private final Map<Long, PlannerStatusResponse> activeRuns = new ConcurrentHashMap<>();
    private final Map<Long, SseEmitter> activeEmitters = new ConcurrentHashMap<>();

    public StudyPlannerController(
            StudyPlannerService studyPlannerService,
            SessionContext sessionContext,
            @Value("${nyare.study-planner.sse-heartbeat-ms:2000}") long sseHeartbeatMs) {
        this.studyPlannerService = studyPlannerService;
        this.sessionContext = sessionContext;
        this.sseHeartbeatMs = sseHeartbeatMs;
    }

    /**
     * Listens for planning progress events and forwards them to the active SSE emitter.
     *
     * @param event the planning progress domain event
     */
    @EventListener
    public void onProgress(PlanningProgressEvent event) {
        if (event == null || event.userId() == null) {
            return;
        }
        SseEmitter emitter = activeEmitters.get(event.userId());
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("progress").data(OBJECT_MAPPER.writeValueAsString(
                        Map.of("date", event.date().toString(), "index", event.index(), "total", event.total()))));
            } catch (IOException | IllegalStateException ex) {
                Thread.currentThread().interrupt();
            }
        }
    }

    /**
     * Retrieves pre-flight planner status for pending dirty notes.
     *
     * @return pre-flight planner status response
     */
    @GetMapping("/status")
    public ResponseEntity<PlannerStatusResponse> getStatus() {
        Long userId = sessionContext.requireUserId();
        PlannerStatusResponse snapshot = activeRuns.get(userId);
        PlannerStatusResponse response =
                snapshot != null ? snapshot : studyPlannerService.getPlannerStatus(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Triggers AI-powered extraction of pending journal notes matching session user scope.
     * Streams init, per-date progress, and a terminal done or error event, plus ping
     * heartbeat comments. A client disconnect cancels the run cooperatively and
     * rolls it back.
     *
     * @return SSE stream with init/progress/done/error events and heartbeat comments
     */
    @PostMapping(value = "/process", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter process() {
        Long userId = sessionContext.requireUserId();
        PlannerStatusResponse status = studyPlannerService.getPlannerStatus(userId);
        activeRuns.put(userId, status);

        // 0 disables the async timeout (servlet spec): the run is bounded by the
        // per-call AI timeouts and cancelled when the client disconnects.
        SseEmitter emitter = new SseEmitter(0L);
        activeEmitters.put(userId, emitter);

        Thread worker = Thread.ofVirtual().start(() -> {
            Thread heartbeat = startHeartbeat(emitter, Thread.currentThread());
            try {
                emitter.send(SseEmitter.event().name("init").data(OBJECT_MAPPER.writeValueAsString(status)));

                ProcessSummaryResponse result = studyPlannerService.processNotes(userId);
                emitter.send(SseEmitter.event().name("done").data(OBJECT_MAPPER.writeValueAsString(result)));
            } catch (CancellationException ex) {
                // Run cancelled and rolled back; the finally block closes the stream.
            } catch (BadRequestException ex) {
                sendQuietly(emitter, "error", Map.of(
                        "status", 400,
                        "title", "Bad Request",
                        "detail", ex.getMessage()));
            } catch (Throwable ex) {
                // Catch Throwable so no failure leaves the stream open. The error
                // event already reports the failure, so complete() is enough and
                // avoids a second servlet error dispatch on a committed response.
                sendQuietly(emitter, "error", Map.of(
                        "status", 500,
                        "title", "Internal Server Error",
                        "detail", ex.getMessage() != null ? ex.getMessage() : "Unknown error"));
            } finally {
                activeRuns.remove(userId);
                activeEmitters.remove(userId, emitter);
                heartbeat.interrupt();
                completeQuietly(emitter);
            }
        });

        emitter.onCompletion(worker::interrupt);
        emitter.onError(ex -> worker.interrupt());

        return emitter;
    }

    /**
     * Starts a virtual thread emitting SSE comment heartbeats. Servlet containers only
     * detect a client disconnect when a write fails, so periodic writes are required
     * for cancellation on disconnect to work.
     */
    private Thread startHeartbeat(SseEmitter emitter, Thread worker) {
        return Thread.ofVirtual().start(() -> {
            try {
                while (!worker.isInterrupted()) {
                    Thread.sleep(sseHeartbeatMs);
                    emitter.send(SseEmitter.event().comment("ping"));
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            } catch (IOException | IllegalStateException ex) {
                worker.interrupt();
            }
        });
    }

    /**
     * Completes the emitter without failing on an already-closed or errored stream.
     */
    private void completeQuietly(SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (RuntimeException ex) {
            // Emitter already completed or the client is gone.
        }
    }

    private void sendQuietly(SseEmitter emitter, String name, Object payload) {
        try {
            emitter.send(SseEmitter.event().name(name).data(OBJECT_MAPPER.writeValueAsString(payload)));
        } catch (IOException | IllegalStateException ex) {
            // Client already gone; cancellation is handled through the emitter callbacks.
        }
    }
}
