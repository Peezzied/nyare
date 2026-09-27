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
 * Spring AI Advisor that intercepts LLM responses, extracts virtual internal
 * ignored/outlier note decisions, and records audit logs.
 */
@Component
public class NoteAuditAdvisor extends SimpleLoggerAdvisor {

    private static final Logger log = LoggerFactory.getLogger(NoteAuditAdvisor.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public NoteAuditAdvisor() {
        super();
    }

    @Override
    public String getName() {
        return "NoteAuditAdvisor";
    }

    @Override
    public ChatClientResponse adviseCall(ChatClientRequest request, CallAdvisorChain chain) {
        ChatClientResponse response = super.adviseCall(request, chain);

        try {
            if (response.chatResponse() != null && response.chatResponse().getResult() != null) {
                String content = response.chatResponse().getResult().getOutput().getText();
                if (content != null && content.contains("ignoredNotes")) {
                    @SuppressWarnings("unchecked")
                    Map<String, UUID> noteIdMap = request.context() != null
                            ? (Map<String, UUID>) request.context().get("noteIdMap")
                            : null;

                    JsonNode root = objectMapper.readTree(content);
                    JsonNode ignoredNotes = root.get("ignoredNotes");
                    if (ignoredNotes != null && ignoredNotes.isArray()) {
                        for (JsonNode item : ignoredNotes) {
                            String noteRef = item.has("noteRef") ? item.get("noteRef").asText() : "unknown";
                            String part = item.has("part") ? item.get("part").asText() : "";
                            String reason = item.has("reason") ? item.get("reason").asText() : "No reason provided";
                            UUID noteId = noteIdMap != null ? noteIdMap.get(noteRef) : null;

                            log.warn("[AI AUDIT - UNRELATED INFO] NoteId: {} | Part: \"{}\" | Reason: {}",
                                    noteId != null ? noteId : noteRef, part, reason);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.debug("NoteAuditAdvisor could not parse ignoredNotes audit payload: {}", e.getMessage());
        }

        return response;
    }
}
