package group.four.nyare.nyare.dev.dto;

import group.four.nyare.nyare.ai.event.AuditCategory;
import group.four.nyare.nyare.ai.event.AuditSeverity;

import java.util.List;

/**
 * Model attributes bound to the {@code dashboard.html} Thymeleaf template for
 * the initial page render.
 *
 * @param events        initial snapshot of retained audit events
 * @param courses       course list entry points
 * @param categories    available categories for filtering
 * @param severities    available severities for filtering
 * @param totalRetained current count of events in the buffer, max 500
 */
public record DevDashboardViewModel(
        List<AuditTraceEventDto> events,
        List<CourseTraceSummaryDto> courses,
        List<AuditCategory> categories,
        List<AuditSeverity> severities,
        int totalRetained) {
}
