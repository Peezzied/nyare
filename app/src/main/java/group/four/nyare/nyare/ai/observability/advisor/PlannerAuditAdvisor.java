package group.four.nyare.nyare.ai.observability.advisor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.ErrorDiagnostic;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.ai.parser.TitleSimilarityMatcher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Intercepts LLM responses to extract planning decisions and record audit logs.
 */
@Component
public class PlannerAuditAdvisor extends SimpleLoggerAdvisor {

    private static final Logger log = LoggerFactory.getLogger(PlannerAuditAdvisor.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Max description characters on the IMAGE CONTEXT audit line. The full text
     * stays persisted on {@code Image.description}; the log keeps a greppable preview.
     */
    private static final int MAX_AUDIT_DESCRIPTION_LENGTH = 200;

    public PlannerAuditAdvisor(ApplicationEventPublisher eventPublisher) {
        super();
        this.eventPublisher = eventPublisher;
    }

    @Override
    public String getName() {
        return "PlannerAuditAdvisor";
    }

    @Override
    public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
        ChatClientResponse response = super.adviseCall(request, chain);

        try {
            if (response.chatResponse() != null && response.chatResponse().getResult() != null) {
                String content = response.chatResponse().getResult().getOutput().getText();
                if (content != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, UUID> noteIdMap = request.context() != null
                            ? (Map<String, UUID>) request.context().get("noteIdMap")
                            : null;
                    @SuppressWarnings("unchecked")
                    Map<String, UUID> existingTasks = request.context() != null
                            ? (Map<String, UUID>) request.context().get("existingTasks")
                            : null;

                    JsonNode root = objectMapper.readTree(content);
                    auditIgnoredNotes(root, noteIdMap);
                    auditTasks(root, noteIdMap, existingTasks);
                    auditEvents(root, noteIdMap);
                }
            }
        } catch (Exception e) {
            log.debug("PlannerAuditAdvisor could not parse audit payload: {}", e.getMessage());
            publish(AuditCategory.TASK_PLANNING, AuditSeverity.ERROR,
                    "PlannerAuditAdvisor could not parse audit payload: " + e.getMessage(),
                    null, null, null, null, null, null, null, null,
                    ErrorDiagnostic.from(e));
        }

        auditImages(request);

        return response;
    }

    private void auditImages(ChatClientRequest request) {
        if (request.context() == null) {
            return;
        }

        Map<String, UUID> imageIdMap = (Map<String, UUID>) request.context().get("imageIdMap");
        if (imageIdMap == null || imageIdMap.isEmpty()) {
            return;
        }

        Map<String, UUID> imageNoteMap = (Map<String, UUID>) request.context().get("imageNoteMap");
        Map<String, String> imageDescriptionMap =
                (Map<String, String>) request.context().get("imageDescriptionMap");

        for (Map.Entry<String, UUID> entry : imageIdMap.entrySet()) {
            String imageRef = entry.getKey();
            UUID imageId = entry.getValue();
            UUID noteId = imageNoteMap != null ? imageNoteMap.get(imageRef) : null;
            String description = imageDescriptionMap != null ? imageDescriptionMap.get(imageRef) : null;

            String imageLabel = imageId != null ? imageId.toString() : imageRef;
            String descriptionPreview = description != null ? truncate(description) : "none";

            String message = "[AI AUDIT - IMAGE CONTEXT] ImageId: " + imageLabel
                    + " | NoteId: " + (noteId != null ? noteId : "unknown")
                    + " | Description: \"" + descriptionPreview + "\"";
            log.info(message);
            publish(AuditCategory.IMAGE_CONTEXT, AuditSeverity.INFO, message,
                    TraceKind.image, imageLabel,
                    noteId, null, null, imageId,
                    null, description != null ? descriptionPreview : null);
        }
    }

    private static String truncate(String description) {
        if (description.length() <= MAX_AUDIT_DESCRIPTION_LENGTH) {
            return description;
        }
        int cut = description.lastIndexOf(' ', MAX_AUDIT_DESCRIPTION_LENGTH - 1);
        if (cut <= 0) {
            cut = MAX_AUDIT_DESCRIPTION_LENGTH - 1;
        }
        return description.substring(0, cut).stripTrailing() + "…";
    }

    private void auditIgnoredNotes(JsonNode root, Map<String, UUID> noteIdMap) {
        JsonNode ignoredNotes = root.get("ignoredNotes");
        if (ignoredNotes != null && ignoredNotes.isArray()) {
            for (JsonNode item : ignoredNotes) {
                String noteRef = item.hasNonNull("noteRef") ? item.get("noteRef").asText() : "unknown";
                String part = item.hasNonNull("part") ? item.get("part").asText() : "";
                String reason = item.hasNonNull("reason") ? item.get("reason").asText() : "No reason provided";
                UUID noteId = noteIdMap != null ? noteIdMap.get(noteRef) : null;

                String message = "[AI AUDIT - UNRELATED INFO] NoteId: " + (noteId != null ? noteId : noteRef)
                        + " | Part: \"" + part + "\" | Reason: " + reason;
                log.warn(message);
                publish(AuditCategory.UNRELATED_INFO, AuditSeverity.WARN, message,
                        TraceKind.note, noteId != null ? noteId.toString() : noteRef,
                        noteId, null, null, null,
                        reason, part);
            }
        }
    }

    private void auditTasks(JsonNode root, Map<String, UUID> noteIdMap, Map<String, UUID> existingTasks) {
        JsonNode tasks = root.get("tasks");
        if (tasks != null && tasks.isArray()) {
            for (JsonNode item : tasks) {
                String rationale = item.hasNonNull("rationale") ? item.get("rationale").asText() : "";
                if (rationale.isBlank()) {
                    continue;
                }

                String title = item.hasNonNull("title") ? item.get("title").asText() : "";
                String scheduledDate = item.hasNonNull("scheduledDate") && !item.get("scheduledDate").asText().isBlank()
                        ? item.get("scheduledDate").asText()
                        : "none";
                String duration = item.hasNonNull("estimatedMinutes") && !item.get("estimatedMinutes").asText().isBlank()
                        ? item.get("estimatedMinutes").asText()
                        : "none";

                String taskId = extractTaskId(item);
                if (taskId == null && existingTasks != null && !title.isBlank()) {
                    for (Map.Entry<String, UUID> entry : existingTasks.entrySet()) {
                        if (TitleSimilarityMatcher.isSimilar(entry.getKey(), title)) {
                            taskId = entry.getValue().toString();
                            break;
                        }
                    }
                }

                if (taskId != null) {
                    String message = "[AI AUDIT - TASK PROMOTION] TaskId: " + taskId
                            + " | Title: \"" + title + "\" | Scheduled: " + scheduledDate
                            + " | Duration: " + duration + " | Rationale: " + rationale;
                    log.info(message);
                    publish(AuditCategory.TASK_PROMOTION, AuditSeverity.INFO, message,
                            TraceKind.task, taskId,
                            null, parseUuid(taskId), null, null,
                            rationale, null);
                    continue;
                }

                String noteRef = item.hasNonNull("noteRef") ? item.get("noteRef").asText() : "unknown";
                UUID noteId = noteIdMap != null ? noteIdMap.get(noteRef) : null;

                String message = "[AI AUDIT - TASK PLANNING] NoteId: " + (noteId != null ? noteId : noteRef)
                        + " | Title: \"" + title + "\" | Scheduled: " + scheduledDate
                        + " | Duration: " + duration + " | Rationale: " + rationale;
                log.info(message);
                publish(AuditCategory.TASK_PLANNING, AuditSeverity.INFO, message,
                        TraceKind.note, noteId != null ? noteId.toString() : noteRef,
                        noteId, null, null, null,
                        rationale, null);
            }
        }
    }

    private String extractTaskId(JsonNode item) {
        if (item.hasNonNull("taskId") && !item.get("taskId").asText().isBlank()) {
            return item.get("taskId").asText();
        }
        if (item.hasNonNull("task_id") && !item.get("task_id").asText().isBlank()) {
            return item.get("task_id").asText();
        }
        return null;
    }

    private void auditEvents(JsonNode root, Map<String, UUID> noteIdMap) {
        JsonNode events = root.get("events");
        if (events != null && events.isArray()) {
            for (JsonNode item : events) {
                String rationale = item.hasNonNull("rationale") ? item.get("rationale").asText() : "";
                if (rationale.isBlank()) {
                    continue;
                }

                String noteRef = item.hasNonNull("noteRef") ? item.get("noteRef").asText() : "unknown";
                UUID noteId = noteIdMap != null ? noteIdMap.get(noteRef) : null;
                String title = item.hasNonNull("title") ? item.get("title").asText() : "";
                String deadline = item.hasNonNull("deadline") && !item.get("deadline").asText().isBlank()
                        ? item.get("deadline").asText()
                        : "none";

                String message = "[AI AUDIT - EVENT PLANNING] NoteId: " + (noteId != null ? noteId : noteRef)
                        + " | Title: \"" + title + "\" | Deadline: " + deadline + " | Rationale: " + rationale;
                log.info(message);
                publish(AuditCategory.EVENT_PLANNING, AuditSeverity.INFO, message,
                        TraceKind.note, noteId != null ? noteId.toString() : noteRef,
                        noteId, null, null, null,
                        rationale, null);
            }
        }
    }

    /**
     * Publishes a structured {@link AuditTraceEvent} mirroring one audit log line.
     * Origin fields and {@code runId} stay null: the advisor chain only sees the
     * ChatClient context (note/image/task maps), not the calling user or run.
     * Listener failures are swallowed: dev tooling must never break the AI call chain.
     */
    private void publish(AuditCategory category, AuditSeverity severity, String message,
                         TraceKind entityKind, String entityId,
                         UUID noteId, UUID taskId, UUID eventId, UUID imageId,
                         String rationale, String quotedText) {
        publish(category, severity, message, entityKind, entityId,
                noteId, taskId, eventId, imageId, rationale, quotedText, null);
    }

    private void publish(AuditCategory category, AuditSeverity severity, String message,
                         TraceKind entityKind, String entityId,
                         UUID noteId, UUID taskId, UUID eventId, UUID imageId,
                         String rationale, String quotedText, ErrorDiagnostic errorDiagnostic) {
        try {
            eventPublisher.publishEvent(new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), category, severity, message,
                    null, null, null, null,
                    entityKind, entityId, null, null,
                    noteId, taskId, eventId, imageId, null,
                    rationale, quotedText, null, null, null, errorDiagnostic));
        } catch (Exception e) {
            log.warn("Audit trace listener failed for {} event: {}", category, e.getMessage());
        }
    }

    private static UUID parseUuid(String value) {
        if (value == null) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
