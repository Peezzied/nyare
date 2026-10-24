package group.four.nyare.nyare.dev.controller;

import group.four.nyare.nyare.ai.event.AuditCategory;
import group.four.nyare.nyare.ai.event.AuditSeverity;
import group.four.nyare.nyare.dev.dto.AuditTraceEventDto;
import group.four.nyare.nyare.dev.dto.CourseTraceSummaryDto;
import group.four.nyare.nyare.dev.dto.DevDashboardViewModel;
import group.four.nyare.nyare.dev.dto.TraceNodeDto;
import group.four.nyare.nyare.dev.dto.TraceNodeStubDto;
import group.four.nyare.nyare.dev.service.DevAuditTraceService;
import group.four.nyare.nyare.dev.stream.DevAuditTraceStream;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.UUID;

/**
 * Dev console controller for the audit trace dashboard. Serves the Thymeleaf
 * view plus the JSON endpoints the inspector pane calls when the user selects
 * an audit entry or a record reference. Read-only; dev-sourceSet only.
 */
@Controller
@RequestMapping("/dev/audit-trace")
public class DevAuditTraceController {

    private final DevAuditTraceService service;
    private final DevAuditTraceStream stream;

    public DevAuditTraceController(DevAuditTraceService service, DevAuditTraceStream stream) {
        this.service = service;
        this.stream = stream;
    }

    @GetMapping
    public String dashboard(Model model) {
        DevDashboardViewModel view = service.getDashboardView();
        model.addAttribute("events", view.events());
        model.addAttribute("courses", view.courses());
        model.addAttribute("categories", view.categories());
        model.addAttribute("severities", view.severities());
        model.addAttribute("totalRetained", view.totalRetained());
        return "dev/dashboard";
    }

    /**
     * Serves the course entry list as JSON so the client can refresh top-level
     * browsing when no audit is selected.
     *
     * @return every stored course as a trace summary
     */
    @GetMapping("/courses")
    @ResponseBody
    public List<CourseTraceSummaryDto> courses() {
        return service.listCourses();
    }

    @GetMapping("/node/{kind}/{id}")
    @ResponseBody
    public TraceNodeDto node(@PathVariable String kind, @PathVariable String id) {
        return service.resolveNode(kind, id);
    }

    /**
     * Resolves the record stubs a selected audit event cites, so the inspector
     * can render clickable references when a feed card is selected.
     *
     * @param eventId the retained audit event identifier
     * @return pointer stubs in citation order
     * @throws ResourceNotFoundException when the event is not retained
     */
    @GetMapping("/refs/{eventId}")
    @ResponseBody
    public List<TraceNodeStubDto> references(@PathVariable UUID eventId) {
        AuditTraceEventDto event = service.getEvent(eventId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Audit event with id '" + eventId + "' not found"));
        return service.resolveReferences(event);
    }

    /**
     * Streams every published audit event to connected dashboard clients as
     * {@code audit} SSE events carrying the serialized event DTO.
     *
     * @return the SSE emitter for this client
     */
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream() {
        return stream.subscribe();
    }

    /**
     * Returns the retained audit feed, optionally filtered, so the client can
     * swap filters without a full page reload.
     *
     * @param category only return events of this category, or all when absent
     * @param severity only return events of this severity, or all when absent
     * @param limit    maximum events to return (default 500, clamped to 500)
     * @return filtered events newest-first
     */
    @GetMapping("/feed")
    @ResponseBody
    public List<AuditTraceEventDto> feed(
            @RequestParam(required = false) AuditCategory category,
            @RequestParam(required = false) AuditSeverity severity,
            @RequestParam(defaultValue = "500") int limit) {
        return service.getFeed(category, severity, limit);
    }
}
