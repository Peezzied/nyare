package group.four.nyare.nyare.ai.advisor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAdvisorChain;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * Intercepts LLM responses to extract planning decisions and record audit logs.
 */
@Component
public class PlannerAuditAdvisor extends SimpleLoggerAdvisor {

    private static final Logger log = LoggerFactory.getLogger(PlannerAuditAdvisor.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Max description characters on the IMAGE CONTEXT audit line. The full text
     * stays persisted on {@code Image.description}; the log keeps a greppable preview.
     */
    private static final int MAX_AUDIT_DESCRIPTION_LENGTH = 200;

    public PlannerAuditAdvisor() {
        super();
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

                    JsonNode root = objectMapper.readTree(content);
                    auditIgnoredNotes(root, noteIdMap);
                    auditTasks(root, noteIdMap);
                    auditEvents(root, noteIdMap);
                }
            }
        } catch (Exception e) {
            log.debug("PlannerAuditAdvisor could not parse audit payload: {}", e.getMessage());
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

            log.info("[AI AUDIT - IMAGE CONTEXT] ImageId: {} | NoteId: {} | Description: \"{}\"",
                    imageId != null ? imageId : imageRef,
                    noteId != null ? noteId : "unknown",
                    description != null ? truncate(description) : "none");
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

                log.warn("[AI AUDIT - UNRELATED INFO] NoteId: {} | Part: \"{}\" | Reason: {}",
                        noteId != null ? noteId : noteRef, part, reason);
            }
        }
    }

    private void auditTasks(JsonNode root, Map<String, UUID> noteIdMap) {
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
                if (taskId != null) {
                    log.info("[AI AUDIT - TASK PROMOTION] TaskId: {} | Title: \"{}\" | Scheduled: {} | Duration: {} | Rationale: {}",
                            taskId, title, scheduledDate, duration, rationale);
                    continue;
                }

                String noteRef = item.hasNonNull("noteRef") ? item.get("noteRef").asText() : "unknown";
                UUID noteId = noteIdMap != null ? noteIdMap.get(noteRef) : null;

                log.info("[AI AUDIT - TASK PLANNING] NoteId: {} | Title: \"{}\" | Scheduled: {} | Duration: {} | Rationale: {}",
                        noteId != null ? noteId : noteRef, title, scheduledDate, duration, rationale);
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

                log.info("[AI AUDIT - EVENT PLANNING] NoteId: {} | Title: \"{}\" | Deadline: {} | Rationale: {}",
                        noteId != null ? noteId : noteRef, title, deadline, rationale);
            }
        }
    }
}
