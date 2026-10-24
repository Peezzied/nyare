package group.four.nyare.nyare.dev.service.impl;

import group.four.nyare.nyare.ai.event.AuditCategory;
import group.four.nyare.nyare.ai.event.AuditSeverity;
import group.four.nyare.nyare.ai.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.event.LifecycleState;
import group.four.nyare.nyare.ai.event.TraceKind;
import group.four.nyare.nyare.dev.dto.AuditTraceEventDto;
import group.four.nyare.nyare.dev.dto.CourseTraceSummaryDto;
import group.four.nyare.nyare.dev.dto.DevDashboardViewModel;
import group.four.nyare.nyare.dev.dto.TraceNodeDto;
import group.four.nyare.nyare.dev.dto.TraceNodeStubDto;
import group.four.nyare.nyare.dev.dto.TraceRelationGroupDto;
import group.four.nyare.nyare.dev.service.DevAuditTraceService;
import group.four.nyare.nyare.dev.sink.DevAuditTraceSink;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Read-only query service backing the dev audit trace console. Maps retained
 * {@link AuditTraceEvent} buffer entries to feed DTOs, resolves trace nodes
 * through {@link DevTraceWalker}, and synthesizes {@code lifecycle} nodes from
 * the planning-run events still held in the sink. Dev-sourceSet only.
 */
@Service
@Transactional(readOnly = true)
public class DevAuditTraceServiceImpl implements DevAuditTraceService {

    private static final int MAX_FEED_EVENTS = 500;
    private static final Pattern CITED_TITLE = Pattern.compile("Title:\\s*\"([^\"]+)\"");
    private static final Pattern UUID_SHAPE = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private final DevAuditTraceSink sink;
    private final DevTraceWalker walker;
    private final CourseRepository courseRepository;

    public DevAuditTraceServiceImpl(
            DevAuditTraceSink sink,
            DevTraceWalker walker,
            CourseRepository courseRepository) {
        this.sink = sink;
        this.walker = walker;
        this.courseRepository = courseRepository;
    }

    @Override
    public List<AuditTraceEventDto> getFeed(AuditCategory category, AuditSeverity severity, int limit) {
        int cap = limit <= 0 ? MAX_FEED_EVENTS : Math.min(limit, MAX_FEED_EVENTS);
        return sink.snapshot().stream()
                .filter(event -> category == null || event.category() == category)
                .filter(event -> severity == null || event.severity() == severity)
                .limit(cap)
                .map(AuditTraceEventDto::from)
                .toList();
    }

    @Override
    public DevDashboardViewModel getDashboardView() {
        List<AuditTraceEvent> snapshot = sink.snapshot();
        List<AuditTraceEventDto> events = snapshot.stream()
                .map(AuditTraceEventDto::from)
                .toList();
        return new DevDashboardViewModel(
                events,
                listCourses(),
                List.of(AuditCategory.values()),
                List.of(AuditSeverity.values()),
                snapshot.size());
    }

    @Override
    public List<CourseTraceSummaryDto> listCourses() {
        return courseRepository.findAll().stream()
                .map(course -> new CourseTraceSummaryDto(course.getId(), course.getName(), course.getColor()))
                .toList();
    }

    @Override
    public TraceNodeDto resolveNode(String kind, String id) {
        TraceKind traceKind = parseKind(kind);
        if (traceKind == TraceKind.lifecycle) {
            return resolveLifecycleNode(id);
        }
        return walker.resolve(traceKind, id);
    }

    @Override
    public Optional<AuditTraceEventDto> getEvent(UUID id) {
        return sink.snapshot().stream()
                .filter(event -> id.equals(event.id()))
                .findFirst()
                .map(AuditTraceEventDto::from);
    }

    @Override
    public List<TraceNodeStubDto> resolveReferences(AuditTraceEventDto event) {
        if (event == null) {
            return List.of();
        }
        Map<String, TraceNodeStubDto> refs = new LinkedHashMap<>();

        // The primary target the audit names, then each dedicated id field.
        if (event.entityKind() != null && event.entityId() != null) {
            addStub(refs, event.entityKind(), event.entityId());
        }
        if (event.noteId() != null) addStub(refs, TraceKind.note, event.noteId().toString());
        if (event.taskId() != null) addStub(refs, TraceKind.task, event.taskId().toString());
        if (event.eventId() != null) addStub(refs, TraceKind.event, event.eventId().toString());
        if (event.imageId() != null) addStub(refs, TraceKind.image, event.imageId().toString());
        if (event.courseId() != null) addStub(refs, TraceKind.course, event.courseId().toString());
        if (event.runId() != null) addStub(refs, TraceKind.lifecycle, event.runId().toString());

        // Planning audits cite a title, not an id: inferred match within the note.
        if (event.noteId() != null && event.message() != null) {
            String title = citedTitle(event.message());
            if (title != null && event.category() == AuditCategory.TASK_PLANNING) {
                walker.findTaskStubByTitle(event.noteId(), title)
                        .ifPresent(stub -> refs.putIfAbsent(key(stub.kind(), stub.id()), stub));
            } else if (title != null && event.category() == AuditCategory.EVENT_PLANNING) {
                walker.findEventStubByTitle(event.noteId(), title)
                        .ifPresent(stub -> refs.putIfAbsent(key(stub.kind(), stub.id()), stub));
            }
        }
        return List.copyOf(refs.values());
    }

    /**
     * Synthesizes a {@code lifecycle} trace node from the planning-run events
     * still held in the buffer. Lifecycle is not a stored record, so the
     * walker cannot resolve it; the node's identity is the run id and its
     * attributes come from the retained events.
     */
    private TraceNodeDto resolveLifecycleNode(String id) {
        UUID runId;
        try {
            runId = UUID.fromString(id);
        } catch (RuntimeException e) {
            throw new ResourceNotFoundException(
                    "Record of kind 'lifecycle' with id '" + id + "' not found");
        }

        List<AuditTraceEvent> runEvents = sink.snapshot().stream()
                .filter(event -> runId.equals(event.runId()))
                .filter(event -> event.category() == AuditCategory.LIFECYCLE
                        && event.lifecycleState() != null)
                .toList();
        if (runEvents.isEmpty()) {
            throw new ResourceNotFoundException(
                    "Record of kind 'lifecycle' with id '" + id + "' not found");
        }

        // The snapshot iterates newest-first, so index 0 is the latest state.
        AuditTraceEvent latest = runEvents.get(0);
        AuditTraceEvent started = runEvents.stream()
                .filter(event -> event.lifecycleState() == LifecycleState.STARTED)
                .reduce((older, newer) -> newer)
                .orElse(null);
        AuditTraceEvent latestWithDuration = runEvents.stream()
                .filter(event -> event.durationMs() != null)
                .findFirst()
                .orElse(null);
        AuditTraceEvent latestWithCounts = runEvents.stream()
                .filter(event -> event.extractedCounts() != null)
                .findFirst()
                .orElse(null);
        AuditTraceEvent latestWithError = runEvents.stream()
                .filter(event -> event.errorDiagnostic() != null)
                .findFirst()
                .orElse(null);

        Map<String, Object> attributes = new LinkedHashMap<>();
        attributes.put("runId", runId.toString());
        attributes.put("state", latest.lifecycleState().name());
        put(attributes, "startedAt", started != null ? started.timestamp() : null);
        attributes.put("lastEventAt", latest.timestamp());
        put(attributes, "durationMs", latestWithDuration != null ? latestWithDuration.durationMs() : null);
        List<String> noteIds = started != null ? noteIdsFrom(started.changeSummary()) : null;
        put(attributes, "targetNoteIds", noteIds);
        put(attributes, "extractedCounts", latestWithCounts != null ? latestWithCounts.extractedCounts() : null);
        put(attributes, "errorDiagnostic", latestWithError != null ? latestWithError.errorDiagnostic() : null);
        attributes.put("eventsRetained", runEvents.size());

        // US1.6: expose the processed notes as navigable relations.
        List<TraceNodeStubDto> noteStubs = (noteIds != null ? noteIds : List.<String>of())
                .stream().map(this::sourceNoteStub).toList();

        return new TraceNodeDto(
                TraceKind.lifecycle,
                runId.toString(),
                "Planning run " + runId.toString().substring(0, 8),
                latest.lifecycleState().name(),
                false,
                null,
                attributes,
                List.of(new TraceRelationGroupDto(
                        "Source Notes", TraceKind.note, noteStubs.size(), noteStubs)));
    }

    /**
     * Resolves a cited source note id to a stub. Dead ids stay inexact stubs
     * carrying the raw id so the card still shows what the run targeted.
     */
    private TraceNodeStubDto sourceNoteStub(String id) {
        try {
            TraceNodeDto node = walker.resolve(TraceKind.note, id);
            return new TraceNodeStubDto(TraceKind.note, id, node.displayTitle(), node.status(), true);
        } catch (ResourceNotFoundException e) {
            return new TraceNodeStubDto(TraceKind.note, id, id, "record no longer exists", false);
        }
    }

    private void addStub(Map<String, TraceNodeStubDto> refs, TraceKind kind, String id) {
        refs.putIfAbsent(key(kind, id), toStub(kind, id));
    }

    private TraceNodeStubDto toStub(TraceKind kind, String id) {
        if (kind == TraceKind.lifecycle) {
            return new TraceNodeStubDto(kind, id, "Planning run", lifecycleSummary(id), true);
        }
        if (!looksLikeId(kind, id)) {
            // The audit names a prompt ref (e.g. "n1"), not a record identifier.
            return new TraceNodeStubDto(
                    kind, id, id,
                    "named in the audit but not a record identifier", false);
        }
        try {
            TraceNodeDto node = walker.resolve(kind, id);
            return new TraceNodeStubDto(kind, id, node.displayTitle(), node.status(), true);
        } catch (ResourceNotFoundException e) {
            return new TraceNodeStubDto(kind, id, "[missing] " + id, "record no longer exists", true);
        }
    }

    private String lifecycleSummary(String id) {
        try {
            UUID runId = UUID.fromString(id);
            return sink.snapshot().stream()
                    .filter(event -> runId.equals(event.runId()) && event.lifecycleState() != null)
                    .findFirst()
                    .map(event -> event.lifecycleState().name())
                    .orElse("no retained events");
        } catch (RuntimeException e) {
            return null;
        }
    }

    private boolean looksLikeId(TraceKind kind, String id) {
        try {
            if (kind == TraceKind.course || kind == TraceKind.schedule) {
                Long.parseLong(id);
            } else {
                UUID.fromString(id);
            }
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private List<String> noteIdsFrom(String changeSummary) {
        if (changeSummary == null) {
            return null;
        }
        List<String> ids = new ArrayList<>();
        Matcher matcher = UUID_SHAPE.matcher(changeSummary);
        while (matcher.find()) {
            ids.add(matcher.group());
        }
        return ids.isEmpty() ? null : ids;
    }

    private String citedTitle(String message) {
        Matcher matcher = CITED_TITLE.matcher(message);
        return matcher.find() ? matcher.group(1) : null;
    }

    private String key(TraceKind kind, String id) {
        return kind + ":" + id;
    }

    private TraceKind parseKind(String kind) {
        try {
            return TraceKind.valueOf(String.valueOf(kind).toLowerCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown trace kind '" + kind + "'");
        }
    }

    private void put(Map<String, Object> attributes, String key, Object value) {
        if (value != null) {
            attributes.put(key, value);
        }
    }
}
