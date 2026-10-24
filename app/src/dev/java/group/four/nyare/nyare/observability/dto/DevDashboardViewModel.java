package group.four.nyare.nyare.observability.dto;

import group.four.nyare.nyare.ai.observability.event.AuditSeverity;

import java.util.List;

/**
 * Model attributes bound to the {@code dashboard.html} Thymeleaf template for
 * the initial page render.
 *
 * @param events        initial snapshot of retained audit events
 * @param courses       course list entry points
 * @param categoryGroups category filter groups; multi-member groups nest their
 *                      categories under a parent chip
 * @param severities    available severities for filtering
 * @param totalRetained current count of events in the buffer, max 500
 * @param aiEngine      resolved AI provider and chat options
 * @param database      datasource identity: engine name, JDBC URL, file path
 */
public record DevDashboardViewModel(
        List<AuditTraceEventDto> events,
        List<CourseTraceSummaryDto> courses,
        List<CategoryGroupDto> categoryGroups,
        List<AuditSeverity> severities,
        int totalRetained,
        AiEngineInfoDto aiEngine,
        DatabaseInfoDto database) {
}
