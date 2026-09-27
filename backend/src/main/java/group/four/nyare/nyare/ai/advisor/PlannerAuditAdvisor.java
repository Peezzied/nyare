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

        return response;
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

                String noteRef = item.hasNonNull("noteRef") ? item.get("noteRef").asText() : "unknown";
                UUID noteId = noteIdMap != null ? noteIdMap.get(noteRef) : null;
                String title = item.hasNonNull("title") ? item.get("title").asText() : "";
                String scheduledDate = item.hasNonNull("scheduledDate") && !item.get("scheduledDate").asText().isBlank()
                        ? item.get("scheduledDate").asText()
                        : "none";
                String duration = item.hasNonNull("estimatedMinutes") && !item.get("estimatedMinutes").asText().isBlank()
                        ? item.get("estimatedMinutes").asText()
                        : "none";

                log.info("[AI AUDIT - TASK PLANNING] NoteId: {} | Title: \"{}\" | Scheduled: {} | Duration: {} | Rationale: {}",
                        noteId != null ? noteId : noteRef, title, scheduledDate, duration, rationale);
            }
        }
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
