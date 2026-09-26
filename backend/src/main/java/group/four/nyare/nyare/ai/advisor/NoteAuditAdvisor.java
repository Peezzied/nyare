package group.four.nyare.nyare.ai.advisor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.stereotype.Component;

/**
 * Spring AI Advisor that intercepts StudyPlannerEngine requests and responses
 * to produce structured audit logs for AI planning interactions.
 */
@Component
public class NoteAuditAdvisor extends SimpleLoggerAdvisor {

    private static final Logger log = LoggerFactory.getLogger(NoteAuditAdvisor.class);

    public NoteAuditAdvisor() {
        super();
    }

    @Override
    public String getName() {
        return "NoteAuditAdvisor";
    }
}
