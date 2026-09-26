package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.ai.parser.CsvParser;
import group.four.nyare.nyare.ai.parser.StubReferenceCodec;
import group.four.nyare.nyare.ai.prompt.TaggedPromptBuilder;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;

/**
 * Spring AI wrapper that processes student journal notes together with existing
 * academic data and extracts tasks, events, and academic context in one AI call.
 *
 * <p>This component performs no repository access. All required data is passed
 * in by the caller. The caller is responsible for scoping, filtering, and
 * windowing the input lists before invocation.
 */
@Component
public class StudyPlannerEngine {

    private static final class CsvHeaders {
        static final String[] NOTE = {"note_ref", "course", "content"};
        static final String[] IMAGE = {"image_ref", "note_ref", "description"};
        static final String[] TASK = {"course", "task_id", "title", "status", "scheduled_date", "duration_minutes"};
        static final String[] EVENT = {"course", "event_id", "title", "deadline"};
        static final String[] CONTEXT = {"course", "value", "age"};
        static final String[] SCHEDULE = {"course", "day", "start_time", "end_time"};
    }

    private static class Tags {
        static final String TIME = "temporal_context";
        public static final String JOURNAL = "journal_notes";
        public static final String IMAGE = "images";
        public static final String TASKS = "existing_tasks";
        public static final String EVENTS = "existing_events";
        public static final String CONTEXTS = "existing_contexts";
        public static final String SCHEDULES = "class_schedules";
    }

    // FIXME temporary only. change in the future
    private static final int PLANNING_SCOPE_DAYS = 14;

    private final ChatClient chatClient;

    @Autowired
    public StudyPlannerEngine(ChatClient.Builder chatClientBuilder,
                              @Value("classpath:system_prompt.st") Resource systemPromptResource,
                              @Autowired(required = false) group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor noteAuditAdvisor) {
        SystemPromptTemplate systemTemplate = new SystemPromptTemplate(systemPromptResource);

        Function<String, String> tagWrap = (tag) -> {
            return "<" + tag + ">";
        };

        String renderedSystemPrompt = systemTemplate.render(Map.of(
                "time", tagWrap.apply(Tags.TIME),
                "journal", tagWrap.apply(Tags.JOURNAL),
                "image", tagWrap.apply(Tags.IMAGE),
                "tasks", tagWrap.apply(Tags.TASKS),
                "events", tagWrap.apply(Tags.EVENTS),
                "contexts", tagWrap.apply(Tags.CONTEXTS),
                "schedules", tagWrap.apply(Tags.SCHEDULES),
                "days", PLANNING_SCOPE_DAYS
        ));

        ChatClient.Builder builder = chatClientBuilder.defaultSystem(renderedSystemPrompt);
        if (noteAuditAdvisor != null) {
            builder.defaultAdvisors(noteAuditAdvisor);
        }

        this.chatClient = builder.build();
    }

    StudyPlannerEngine(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Processes notes together with existing academic data in one AI round-trip.
     *
     * <p>The caller is responsible for scoping and filtering all input lists.
     * This method only validates that at least one note has non-blank markdown content.
     *
     * @param notes            journal notes to process
     * @param existingTasks    open tasks for the scoped courses (caller-filtered)
     * @param existingEvents   upcoming events for the scoped courses (caller-filtered)
     * @param existingContexts known academic context facts for the scoped courses
     * @param schedules        recurring class schedules for the scoped courses
     * @return extracted and scheduled tasks, events, and contexts
     */
    public ExtractedData process(
            List<Note> notes,
            List<Task> existingTasks,
            List<AcademicEvent> existingEvents,
            List<AcademicContext> existingContexts,
            List<Schedule> schedules) {

        if (notes == null || notes.isEmpty()) {
            return emptyExtractedData();
        }

        List<Note> validNotes = notes.stream()
                .filter(n -> n != null
                        && n.getContent() != null
                        && n.getContent().getMarkdown() != null
                        && !n.getContent().getMarkdown().isBlank())
                .toList();

        if (validNotes.isEmpty()) {
            return emptyExtractedData();
        }

        StubReferenceCodec<Note> noteCodec = new StubReferenceCodec<>("n");

        String notesCsv = CsvParser.toCsv(
                CsvHeaders.NOTE,
                validNotes,
                note -> new Object[]{
                        noteCodec.encode(note),
                        note.getCourse() != null ? note.getCourse().getName() : "",
                        note.getContent().getMarkdown()
                }
        );

        // Supply today's date so the model can anchor relative expressions
        // and determine which schedule slots are upcoming.
        // Example output: "Current Reference Date: 2026-09-26 (SATURDAY)"
        LocalDate today = LocalDate.now();
        String timeContext = String.format("Current Reference Date: %s (%s)", today, today.getDayOfWeek());

        TaggedPromptBuilder builder = TaggedPromptBuilder.builder()
                .tag(Tags.TIME, timeContext)
                .tag(Tags.JOURNAL, notesCsv)
//                .tagIfPresent(Tags.IMAGE,            processImagesToCsv(validNotes, noteCodec))
                .tagIfPresent(Tags.TASKS, buildTasksCsv(existingTasks))
                .tagIfPresent(Tags.EVENTS, buildEventsCsv(existingEvents))
                .tagIfPresent(Tags.CONTEXTS, buildContextsCsv(existingContexts, today))
                .tagIfPresent(Tags.SCHEDULES, buildSchedulesCsv(schedules));

        Prompt prompt = builder.buildPrompt();

        LlmPayload raw = chatClient.prompt(prompt)
                .call()
                .entity(LlmPayload.class);

        return raw != null ? decodeReferences(raw, noteCodec) : emptyExtractedData();
    }

    // --- Private CSV builders ---

    private String buildTasksCsv(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) return "";
        return CsvParser.toCsv(CsvHeaders.TASK, tasks, t -> new Object[]{
                t.getCourse() != null ? t.getCourse().getName() : "",
                t.getId(),
                t.getTitle(),
                t.getStatus(),
                t.getScheduledDate(),
                t.getDuration() != null ? t.getDuration().toMinutes() : ""
        });
    }

    private String buildEventsCsv(List<AcademicEvent> events) {
        if (events == null || events.isEmpty()) return "";
        return CsvParser.toCsv(CsvHeaders.EVENT, events, e -> new Object[]{
                e.getCourse() != null ? e.getCourse().getName() : "",
                e.getId(),
                e.getTitle(),
                e.getDeadline()
        });
    }

    /**
     * Serializes academic context facts with a human-readable age column.
     * Age is computed as the elapsed time since createdAt relative to today,
     * expressed in the largest whole unit: days, weeks, or months.
     *
     * <p>Examples: "3 days old", "2 weeks old", "4 months old".
     */
    private String buildContextsCsv(List<AcademicContext> contexts, LocalDate today) {
        if (contexts == null || contexts.isEmpty()) return "";
        return CsvParser.toCsv(CsvHeaders.CONTEXT, contexts, c -> new Object[]{
                c.getCourse() != null ? c.getCourse().getName() : "",
                c.getValue(),
                formatAge(c.getCreatedAt(), today)
        });
    }

    private String buildSchedulesCsv(List<Schedule> schedules) {
        if (schedules == null || schedules.isEmpty()) return "";
        return CsvParser.toCsv(CsvHeaders.SCHEDULE, schedules, s -> new Object[]{
                s.getCourse() != null ? s.getCourse().getName() : "",
                s.getDay(),
                s.getStartTime(),
                s.getEndTime()
        });
    }

    /**
     * Formats an Instant age as a human-readable relative string.
     * Uses the largest whole unit that fits: days < 7, weeks < 5, otherwise months.
     *
     * <p>Returns empty string when createdAt is null (context pre-dates auditing or is unsaved).
     */
    static String formatAge(Instant createdAt, LocalDate today) {
        if (createdAt == null) return "";
        LocalDate created = createdAt.atZone(ZoneOffset.UTC).toLocalDate();
        long days = ChronoUnit.DAYS.between(created, today);
        if (days < 7) return days + " days old";
        long weeks = days / 7;
        if (weeks < 5) return weeks + " weeks old";
        long months = ChronoUnit.MONTHS.between(created, today);
        return months + " months old";
    }

//    private String processImagesToCsv(List<Note> notes, StubReferenceCodec<Note> noteCodec) {
//        // ponytail: image vision processing deferred — serializes existing descriptions only
//        StubReferenceCodec<String> imageCodec = new StubReferenceCodec<>("i");
//        List<ImageRow> imageRows = new ArrayList<>();
//        for (Note note : notes) {
//            if (note.getContent() != null && note.getContent().getImageMetadata() != null) {
//                String noteRef = noteCodec.encode(note);
//                note.getContent().getImageMetadata().forEach((imageId, metadata) -> {
//                    if (metadata != null) {
//                        String imageRef = imageCodec.encode(imageId);
//                        String description = metadata.getDescription() != null ? metadata.getDescription() : "";
//                        imageRows.add(new ImageRow(imageRef, noteRef, description));
//                    }
//                });
//            }
//        }
//        if (imageRows.isEmpty()) return "";
//        return CsvParser.toCsv(CsvHeaders.IMAGE, imageRows,
//                row -> new Object[]{row.imageRef(), row.noteRef(), row.description()});
//    }

    private ExtractedData decodeReferences(LlmPayload raw, StubReferenceCodec<Note> noteCodec) {
        List<ExtractedTask> tasks = raw.tasks() != null
                ? raw.tasks().stream().map(t -> {
            Note note = noteCodec.decode(t.noteRef());
            UUID noteId = note != null ? note.getId() : null;
            return new ExtractedTask(t.noteRef(), noteId, t.title(), t.description(),
                    t.scheduledDate(), t.estimatedMinutes());
        }).toList()
                : Collections.emptyList();

        List<ExtractedEvent> events = raw.events() != null
                ? raw.events().stream().map(e -> {
            Note note = noteCodec.decode(e.noteRef());
            UUID noteId = note != null ? note.getId() : null;
            return new ExtractedEvent(e.noteRef(), noteId, e.title(), e.description(), e.deadline());
        }).toList()
                : Collections.emptyList();

        List<ExtractedContext> contexts = raw.contexts() != null
                ? raw.contexts().stream().map(c -> {
            Note note = noteCodec.decode(c.noteRef());
            UUID noteId = note != null ? note.getId() : null;
            return new ExtractedContext(c.noteRef(), noteId, c.value());
        }).toList()
                : Collections.emptyList();

        return new ExtractedData(tasks, events, contexts);
    }

    private static ExtractedData emptyExtractedData() {
        return new ExtractedData(
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList());
    }

    // --- Inner types ---

//    private record ImageRow(String imageRef, String noteRef, String description) {}

    public record ExtractedTask(
            @JsonProperty(value = "noteRef", required = true)
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1)")
            String noteRef,

            UUID noteId,

            @JsonProperty(value = "title", required = true)
            @JsonPropertyDescription("Actionable title of the task")
            @Size(max = 255)
            String title,

            @JsonProperty("description")
            @JsonPropertyDescription("Details or instructions for the task")
            @Size(max = 2048)
            String description,

            @JsonProperty("scheduledDate")
            @JsonPropertyDescription("Target study date in YYYY-MM-DD format, or null if uncertain")
            LocalDate scheduledDate,

            @JsonProperty("estimatedMinutes")
            @JsonPropertyDescription("Estimated duration in minutes, or null if uncertain")
            Integer estimatedMinutes) {
    }

    public record ExtractedEvent(
            @JsonProperty(value = "noteRef", required = true)
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1)")
            String noteRef,

            UUID noteId,

            @JsonProperty(value = "title", required = true)
            @JsonPropertyDescription("Name of the academic event or deadline")
            @Size(max = 255)
            String title,

            @JsonProperty("description")
            @JsonPropertyDescription("Event details, coverage or instructions")
            @Size(max = 2048)
            String description,

            @JsonProperty(value = "deadline", required = true)
            @JsonPropertyDescription("Rigid deadline timestamp in ISO-8601 format (YYYY-MM-DDTHH:mm:ss)")
            LocalDateTime deadline) {
    }

    public record ExtractedContext(
            @JsonProperty(value = "noteRef")
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1)")
            String noteRef,

            UUID noteId,

            @JsonProperty(value = "value")
            @JsonPropertyDescription("Descriptive fact about course status, coverage, progress, or difficulty and the likes")
            @Size(max = 2048)
            String value) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ExtractedData(
            @JsonProperty(value = "tasks", required = true)
            @JsonPropertyDescription("Extracted actionable tasks")
            List<ExtractedTask> tasks,

            @JsonProperty(value = "events", required = true)
            @JsonPropertyDescription("Extracted rigid academic events and deadlines")
            List<ExtractedEvent> events,

            @JsonProperty(value = "contexts", required = true)
            @JsonPropertyDescription("Extracted academic context facts")
            List<ExtractedContext> contexts) {
    }

    private record LlmPayload(
            @JsonProperty(value = "tasks", required = true)
            @JsonPropertyDescription("Extracted actionable tasks")
            List<ExtractedTask> tasks,

            @JsonProperty(value = "events", required = true)
            @JsonPropertyDescription("Extracted rigid academic events and deadlines")
            List<ExtractedEvent> events,

            @JsonProperty(value = "contexts", required = true)
            @JsonPropertyDescription("Extracted academic context facts")
            List<ExtractedContext> contexts,

            @JsonProperty("ignoredNotes")
            @JsonPropertyDescription("Internal list of ignored course-irrelevant or outlier notes for system auditing")
            List<InternalIgnoredNote> ignoredNotes) {
    }

    private record InternalIgnoredNote(
            @JsonProperty(value = "noteRef", required = true)
            @JsonPropertyDescription("Reference identifier of the ignored note (e.g. n1)")
            String noteRef,

            @JsonProperty(value = "reason", required = true)
            @JsonPropertyDescription("Explanation of why the note was ignored as irrelevant or an outlier")
            String reason) {
    }
}
