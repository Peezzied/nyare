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
                response.chatResponse().getResult();
                String content = response.chatResponse().getResult().getOutput().getText();
                if (content != null && content.contains("ignoredNotes")) {
                    JsonNode root = objectMapper.readTree(content);
                    JsonNode ignoredNotes = root.get("ignoredNotes");
                    if (ignoredNotes != null && ignoredNotes.isArray()) {
                        for (JsonNode item : ignoredNotes) {
                            String noteRef = item.has("noteRef") ? item.get("noteRef").asText() : "unknown";
                            String reason = item.has("reason") ? item.get("reason").asText() : "No reason provided";
                            log.warn("[AI AUDIT - UNRELATED INFO] NoteRef: {} | Reason: {}", noteRef, reason);
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
