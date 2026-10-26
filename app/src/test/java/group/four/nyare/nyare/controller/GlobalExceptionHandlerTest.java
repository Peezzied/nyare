package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.ai.observability.ErrorAuditPublisher;
import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock
    private ErrorAuditPublisher errorAuditPublisher;

    @Mock
    private SessionContext sessionContext;

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(errorAuditPublisher, sessionContext);
    }

    @Test
    void handleGeneric_withUnhandledException_returns500AndReports() {
        // given
        when(sessionContext.getUserId()).thenReturn(Optional.of(3L));
        IllegalStateException ex = new IllegalStateException("boom");

        // when
        ProblemDetail problem = handler.handleGeneric(ex);

        // then
        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(problem.getTitle()).isEqualTo("Internal Server Error");
        verify(errorAuditPublisher).report("Unhandled exception", ex, 3L);
    }

    @Test
    void handleBadRequest_withBadRequestException_neverReports() {
        // given
        BadRequestException ex = new BadRequestException("bad input");

        // when
        ProblemDetail problem = handler.handleBadRequest(ex);

        // then
        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        verify(errorAuditPublisher, never()).report(anyString(), any(), any());
    }

    @Test
    void handleResourceNotFound_withMissingResource_neverReports() {
        // given
        ResourceNotFoundException ex = new ResourceNotFoundException("missing");

        // when
        ProblemDetail problem = handler.handleResourceNotFound(ex);

        // then
        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        verify(errorAuditPublisher, never()).report(anyString(), any(), any());
    }

    @Test
    void handleResponseStatus_with5xx_reports() {
        // given
        when(sessionContext.getUserId()).thenReturn(Optional.empty());
        ResponseStatusException ex = new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "db down");

        // when
        ProblemDetail problem = handler.handleResponseStatus(ex);

        // then
        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        verify(errorAuditPublisher).report("Response status failure", ex, null);
    }

    @Test
    void handleResponseStatus_with404_neverReports() {
        // given
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND, "gone");

        // when
        ProblemDetail problem = handler.handleResponseStatus(ex);

        // then
        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        verify(errorAuditPublisher, never()).report(anyString(), any(), isNull());
    }
}
