package group.four.nyare.nyare.observability.service.impl;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.LifecycleState;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.observability.dto.AiEngineInfoDto;
import group.four.nyare.nyare.observability.dto.AuditTraceEventDto;
import group.four.nyare.nyare.observability.dto.CategoryGroupDto;
import group.four.nyare.nyare.observability.dto.CourseTraceSummaryDto;
import group.four.nyare.nyare.observability.dto.DatabaseInfoDto;
import group.four.nyare.nyare.observability.dto.DevDashboardViewModel;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.dto.TraceNodeStubDto;
import group.four.nyare.nyare.observability.dto.TraceRelationGroupDto;
import group.four.nyare.nyare.observability.service.DevAuditTraceService;
import group.four.nyare.nyare.observability.sink.DevAuditTraceSink;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.repository.CourseRepository;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.InvalidPathException;
import java.nio.file.Path;
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
@Profile("dev | observability")
@Service
@Transactional(readOnly = true)
public class DevAuditTraceServiceImpl implements DevAuditTraceService {

    private static final int MAX_FEED_EVENTS = 500;

    /** Categories emitted by the planner and image pipelines, nested under "AI engine". */
    private static final List<AuditCategory> AI_ENGINE_CATEGORIES = List.of(
            AuditCategory.LIFECYCLE,
            AuditCategory.TASK_PLANNING,
            AuditCategory.TASK_PROMOTION,
            AuditCategory.EVENT_PLANNING,
            AuditCategory.IMAGE_CONTEXT,
            AuditCategory.UNRELATED_INFO);
    private static final Pattern CITED_TITLE = Pattern.compile("Title:\\s*\"([^\"]+)\"");

    /** Frontend course palette, slug -> solid hex (frontend/src/utils/courseColors.ts). */
    private static final Map<String, String> COURSE_COLOR_HEX = Map.ofEntries(
            Map.entry("tomato", "#D50000"),
            Map.entry("flamingo", "#E67C73"),
            Map.entry("radicchio", "#AD1457"),
            Map.entry("cherry", "#D81B60"),
            Map.entry("tangerine", "#F4511E"),
            Map.entry("pumpkin", "#EF6C00"),
            Map.entry("mango", "#F57C00"),
            Map.entry("banana", "#F6BF26"),
            Map.entry("lemon", "#FBC02D"),
            Map.entry("citron", "#AFB42B"),
            Map.entry("basil", "#0B8043"),
            Map.entry("sage", "#33B679"),
            Map.entry("avocado", "#689F38"),
            Map.entry("pistachio", "#7CB342"),
            Map.entry("eucalyptus", "#00897B"),
            Map.entry("peacock", "#039BE5"),
            Map.entry("sky", "#29B6F6"),
            Map.entry("blueberry", "#3F51B5"),
            Map.entry("cobalt", "#1E88E5"),
            Map.entry("grape", "#8E24AA"),
            Map.entry("amethyst", "#9C27B0"),
            Map.entry("lavender", "#7986CB"),
            Map.entry("wisteria", "#B39DDB"),
            Map.entry("graphite", "#616161"));

    /** Solid hex per palette index, same order as COURSE_PALETTE_24. */
    private static final List<String> COURSE_PALETTE_SOLIDS = List.of(
            "#D50000", "#E67C73", "#AD1457", "#D81B60", "#F4511E", "#EF6C00",
            "#F57C00", "#F6BF26", "#FBC02D", "#AFB42B", "#0B8043", "#33B679",
            "#689F38", "#7CB342", "#00897B", "#039BE5", "#29B6F6", "#3F51B5",
            "#1E88E5", "#8E24AA", "#9C27B0", "#7986CB", "#B39DDB", "#616161");
    private static final Pattern UUID_SHAPE = Pattern.compile(
            "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}");

    private final DevAuditTraceSink sink;
    private final DevTraceWalker walker;
    private final CourseRepository courseRepository;
    private final ChatModel chatModel;
    private final Environment environment;

    public DevAuditTraceServiceImpl(
            DevAuditTraceSink sink,
            DevTraceWalker walker,
            CourseRepository courseRepository,
            ChatModel chatModel,
            Environment environment) {
        this.sink = sink;
        this.walker = walker;
        this.courseRepository = courseRepository;
        this.chatModel = chatModel;
        this.environment = environment;
    }

    @Override
    public List<AuditTraceEventDto> getFeed(List<AuditCategory> categories, AuditSeverity severity, int limit) {
        int cap = limit <= 0 ? MAX_FEED_EVENTS : Math.min(limit, MAX_FEED_EVENTS);
        return sink.snapshot().stream()
                .filter(event -> categories == null || categories.isEmpty()
                        || categories.contains(event.category()))
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
                List.of(
                        new CategoryGroupDto("AI_ENGINE", "AI engine", AI_ENGINE_CATEGORIES),
                        new CategoryGroupDto(
                                AuditCategory.DATA_MUTATION.name(),
                                "data mutation",
                                List.of(AuditCategory.DATA_MUTATION))),
                List.of(AuditSeverity.values()),
                snapshot.size(),
                aiEngineInfo(),
                databaseInfo());
    }

    /**
     * Reads the configured provider key and the resolved default chat options
     * so the dashboard shows exactly what the engine sends calls with.
     */
    private AiEngineInfoDto aiEngineInfo() {
        ChatOptions options = chatModel.getOptions();
        return new AiEngineInfoDto(
                environment.getProperty("spring.ai.model.chat", "unknown"),
                options != null ? options.getModel() : null,
                options != null ? options.getTemperature() : null,
                options != null ? options.getTopP() : null,
                options != null ? options.getTopK() : null,
                options != null ? options.getMaxTokens() : null);
    }

    /**
     * Reads the configured datasource URL and resolves the engine name plus
     * the backing file for SQLite so the dashboard shows where data lives.
     */
    private DatabaseInfoDto databaseInfo() {
        String url = environment.getProperty("spring.datasource.url");
        if (url == null || !url.startsWith("jdbc:")) {
            return null;
        }
        String vendor = url.substring("jdbc:".length()).split(":", 2)[0];
        String product = switch (vendor) {
            case "sqlite" -> "SQLite";
            case "h2" -> "H2";
            default -> vendor;
        };
        return new DatabaseInfoDto(
                product, url, "sqlite".equals(vendor) ? sqliteFilePath(url) : null);
    }

    /**
     * Resolves the absolute file path behind a SQLite JDBC URL. URI filenames
     * ({@code jdbc:sqlite:file:…}) lose the {@code file:} prefix and query
     * parameters; in-memory databases return null.
     */
    private String sqliteFilePath(String url) {
        String resource = url.substring("jdbc:sqlite:".length());
        if (resource.startsWith("file:")) {
            resource = resource.substring("file:".length());
        }
        int query = resource.indexOf('?');
        if (query >= 0) {
            resource = resource.substring(0, query);
        }
        if (resource.isBlank() || resource.contains(":memory:")) {
            return null;
        }
        try {
            return Path.of(resource).toAbsolutePath().normalize().toString();
        } catch (InvalidPathException e) {
            return null;
        }
    }

    @Override
    public List<CourseTraceSummaryDto> listCourses() {
        return courseRepository.findAll().stream()
                .map(course -> new CourseTraceSummaryDto(
                        course.getId(), course.getName(), course.getColor(),
                        courseColorHex(course.getId(), course.getColor())))
                .toList();
    }

    /**
     * Resolves the displayed course color the way the frontend does
     * ({@code useCatalog.courseColor}): a stored palette slug wins, otherwise
     * the deterministic {@code id % 24} palette pick.
     */
    private static String courseColorHex(Long courseId, String color) {
        String hex = color == null ? null : COURSE_COLOR_HEX.get(color);
        if (hex != null) {
            return hex;
        }
        return COURSE_PALETTE_SOLIDS.get(
                (int) Math.floorMod(courseId, COURSE_PALETTE_SOLIDS.size()));
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
