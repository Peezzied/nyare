package group.four.nyare.nyare.ai.observability;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ErrorAuditPublisherTest {

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ErrorAuditPublisher errorAuditPublisher;

    @Test
    void report_withException_publishesSystemErrorEvent() {
        // given
        IllegalStateException failure = new IllegalStateException("boom");

        // when
        errorAuditPublisher.report("Unhandled exception", failure, 7L);

        // then
        ArgumentCaptor<AuditTraceEvent> captor = ArgumentCaptor.forClass(AuditTraceEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        AuditTraceEvent event = captor.getValue();
        assertThat(event.category()).isEqualTo(AuditCategory.SYSTEM_ERROR);
        assertThat(event.severity()).isEqualTo(AuditSeverity.ERROR);
        assertThat(event.originUserId()).isEqualTo(7L);
        assertThat(event.errorDiagnostic()).isNotNull();
        assertThat(event.errorDiagnostic().exceptionClass())
                .isEqualTo(IllegalStateException.class.getName());
    }

    @Test
    void report_whenPublisherThrows_doesNotPropagate() {
        // given
        doThrow(new RuntimeException("listener down"))
                .when(eventPublisher).publishEvent(any(Object.class));

        // when / then
        assertThatCode(() ->
                errorAuditPublisher.report("Unhandled exception", new IllegalStateException("boom"), null))
                .doesNotThrowAnyException();
    }
}
