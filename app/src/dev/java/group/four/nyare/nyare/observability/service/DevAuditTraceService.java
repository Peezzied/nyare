package group.four.nyare.nyare.observability.service;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.observability.dto.AuditTraceEventDto;
import group.four.nyare.nyare.observability.dto.CourseTraceSummaryDto;
import group.four.nyare.nyare.observability.dto.DevDashboardViewModel;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.dto.TraceNodeStubDto;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service contract for the dev audit trace console: the retained audit feed,
 * the dashboard view model, and resolution of audit references to records.
 * Dev-sourceSet only; never part of production builds.
 */
public interface DevAuditTraceService {

    /**
     * Returns retained audit events newest-first, optionally filtered.
     *
     * @param categories only return events of these categories, or all when null or empty
     * @param severity   only return events of this severity, or all when null
     * @param limit      maximum events to return (clamped to the 500-event buffer)
     * @return filtered feed as serialized event DTOs
     */
    List<AuditTraceEventDto> getFeed(List<AuditCategory> categories, AuditSeverity severity, int limit);

    /**
     * Builds the model attributes for the initial dashboard render: the event
     * snapshot, the course entry points, the filter enums, the buffer count,
     * and the AI engine and datasource identity.
     *
     * @return the dashboard view model
     */
    DevDashboardViewModel getDashboardView();

    /**
     * Lists all courses as entry points for top-level record browsing when no
     * audit is selected.
     *
     * @return every stored course as a trace summary
     */
    List<CourseTraceSummaryDto> listCourses();

    /**
     * Resolves a trace node for the detail pane. Stored-record kinds delegate to
     * the walker; {@code lifecycle} nodes are synthesized from retained events.
     *
     * @param kind entity kind name (lowercase, e.g. {@code note}, {@code lifecycle})
     * @param id   primary key or UUID string
     * @return the inspected record as a trace node
     * @throws BadRequestException       when the kind is unknown
     * @throws ResourceNotFoundException when no record or retained run matches
     */
    TraceNodeDto resolveNode(String kind, String id);

    /**
     * Finds one retained audit event by its identifier.
     *
     * @param id the event identifier
     * @return the serialized event, or empty when evicted or never seen
     */
    Optional<AuditTraceEventDto> getEvent(UUID id);

    /**
     * Resolves every record reference an audit event cites. References carried
     * as identifiers resolve exactly; planning audits that only name a title
     * resolve by inferred title match within the source note.
     *
     * @param event the selected audit event
     * @return pointer stubs in citation order ({@code isExact} distinguishes
     *         identifier references from title matches and unresolved names)
     */
    List<TraceNodeStubDto> resolveReferences(AuditTraceEventDto event);
}
