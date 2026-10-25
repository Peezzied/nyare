package group.four.nyare.nyare.ai.observability;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.ErrorDiagnostic;
import group.four.nyare.nyare.ai.observability.event.TriggerSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Shared reporter for otherwise silent server failures. Writes an error log line
 * and publishes a {@code SYSTEM_ERROR} {@link AuditTraceEvent} so the failure
 * reaches the dev audit trace console. Listener failures are swallowed so audit
 * reporting can never break the error path it observes.
 */
@Component
public class ErrorAuditPublisher {

    private static final Logger log = LoggerFactory.getLogger(ErrorAuditPublisher.class);

    private final ApplicationEventPublisher eventPublisher;

    public ErrorAuditPublisher(ApplicationEventPublisher eventPublisher) {
        this.eventPublisher = eventPublisher;
    }

    /**
     * Logs the failure and emits a {@code SYSTEM_ERROR} audit event.
     *
     * @param source  short label identifying the failing code path
     * @param ex      captured exception
     * @param userId  acting user identifier, or {@code null} when unknown
     */
    public void report(String source, Throwable ex, Long userId) {
        log.error("[SYSTEM ERROR] {} | UserId: {} | {}", source, userId, ex.getMessage(), ex);
        try {
            eventPublisher.publishEvent(new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.SYSTEM_ERROR,
                    AuditSeverity.ERROR, source + ": " + ex.getMessage(), userId,
                    null, TriggerSource.WEB_SESSION, null, null, null, null,
                    null, null, null, null, null, null, null, null,
                    null, null, null, ErrorDiagnostic.from(ex)));
        } catch (Exception e) {
            log.warn("Audit trace listener failed for system error: {}", e.getMessage());
        }
    }
}
