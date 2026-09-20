package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

/**
 * REST controller for AI-powered journal processing.
 */
@RestController
@RequestMapping("/api/study-planner")
public class StudyPlannerController {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final StudyPlannerService studyPlannerService;
    private final long sseTimeoutMs;

    public StudyPlannerController(
            StudyPlannerService studyPlannerService,
            @Value("${nyare.study-planner.sse-timeout-ms:60000}") long sseTimeoutMs) {
        this.studyPlannerService = studyPlannerService;
        this.sseTimeoutMs = sseTimeoutMs;
    }

    /**
     * Triggers AI-powered extraction of today's journal notes across all courses.
     * Streams a done event with summary counts or an error event if processing fails.
     *
     * @return SSE stream with a single done or error event
     */
    @PostMapping(value = "/process", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter process() {
        SseEmitter emitter = new SseEmitter(this.sseTimeoutMs);

        Thread.ofVirtual().start(() -> {
            try {
                ProcessSummaryResponse result = studyPlannerService.processTodayNotes();
                String json = OBJECT_MAPPER.writeValueAsString(result);
                emitter.send(SseEmitter.event().name("done").data(json));
                emitter.complete();
            } catch (BadRequestException ex) {
                try {
                    Map<String, Object> errorPayload = Map.of(
                            "status", 400,
                            "title", "Bad Request",
                            "detail", ex.getMessage()
                    );
                    emitter.send(SseEmitter.event().name("error").data(OBJECT_MAPPER.writeValueAsString(errorPayload)));
                } catch (Exception ignored) {
                }
                emitter.complete();
            } catch (Exception ex) {
                try {
                    Map<String, Object> errorPayload = Map.of(
                            "status", 500,
                            "title", "Internal Server Error",
                            "detail", ex.getMessage() != null ? ex.getMessage() : "Unknown error"
                    );
                    emitter.send(SseEmitter.event().name("error").data(OBJECT_MAPPER.writeValueAsString(errorPayload)));
                } catch (Exception ignored) {
                }
                emitter.completeWithError(ex);
            }
        });

        return emitter;
    }
}
