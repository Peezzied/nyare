package group.four.nyare.nyare.observability.service.impl;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.MutationAction;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.dto.TraceNodeStubDto;
import group.four.nyare.nyare.observability.dto.TraceRelationGroupDto;
import group.four.nyare.nyare.observability.sink.DevAuditTraceSink;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageMetadataView;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.impl.ImageReferenceExtractor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Read-only query service resolving stored records into {@link TraceNodeDto}
 * view models for the dev audit trace console. Dev-sourceSet only.
 *
 * <p>Resolution is exact by primary key. Inferred (title-based) matching lives
 * in {@link #findTaskStubByTitle} and {@link #findEventStubByTitle} and is the
 * caller's decision, per spec FR-008. Each resolved node also carries its
 * direct relations (FR-011): owning course, source note, child records, and
 * image references. Relation groups report the true count while truncating
 * items at {@value #RELATION_ITEM_CAP} (FR-013).
 *
 * <p>When a record no longer exists, the retained audit events decide the
 * outcome: a matching {@code DELETE} mutation produces a tombstone node,
 * while any other miss stays a plain 404.
 */
@Service
@Transactional(readOnly = true)
public class DevTraceWalker {

    private static final int RELATION_ITEM_CAP = 50;

    private final CourseRepository courseRepository;
    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final ImageRepository imageRepository;
    private final ScheduleRepository scheduleRepository;
    private final DevAuditTraceSink traceSink;

    public DevTraceWalker(
            CourseRepository courseRepository,
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ImageRepository imageRepository,
            ScheduleRepository scheduleRepository,
            DevAuditTraceSink traceSink) {
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.imageRepository = imageRepository;
        this.scheduleRepository = scheduleRepository;
        this.traceSink = traceSink;
    }

    /**
     * Resolves a stored record of the given kind by primary key.
     *
     * @param kind entity kind; {@code course}, {@code note}, {@code task},
     *             {@code event}, {@code image}, {@code schedule}, or {@code context}
     * @param id   primary key string (UUID or numeric)
     * @return the inspected record as a trace node with its direct relations,
     *         or a tombstone node when the sink retains its deletion audit
     * @throws ResourceNotFoundException when the id is malformed or resolves to no record
     * @throws BadRequestException       when the kind is {@code lifecycle} (not a stored record)
     */
    public TraceNodeDto resolve(TraceKind kind, String id) {
        try {
            return switch (kind) {
                case course -> toCourseNode(findCourse(id));
                case note -> toNoteNode(findNote(id));
                case task -> toTaskNode(findTask(id));
                case event -> toEventNode(findEvent(id));
                case image -> toImageNode(findImage(id));
                case schedule -> toScheduleNode(findSchedule(id));
                case context -> toContextNode(findContext(id));
                case lifecycle -> throw new BadRequestException(
                        "Trace kind 'lifecycle' is not a stored record; "
                                + "lifecycle nodes are synthesized from audit events");
            };
        } catch (ResourceNotFoundException e) {
            return tombstoneFor(kind, id).orElseThrow(() -> e);
        }
    }

    /**
     * Inferred lookup: finds a task by title within the scope of a source note.
     *
     * @param noteId source note identifier from the audit reference
     * @param title  task title named in the audit message
     * @return an inferred stub ({@code isExact = false}), or empty when unmatched
     */
    public Optional<TraceNodeStubDto> findTaskStubByTitle(UUID noteId, String title) {
        return taskRepository
                .findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(noteId, title)
                .map(task -> new TraceNodeStubDto(
                        TraceKind.task,
                        task.getId().toString(),
                        task.getTitle(),
                        taskSubtitle(task),
                        false));
    }

    /**
     * Inferred lookup: finds an academic event by title within the scope of a source note.
     *
     * @param noteId source note identifier from the audit reference
     * @param title  event title named in the audit message
     * @return an inferred stub ({@code isExact = false}), or empty when unmatched
     */
    public Optional<TraceNodeStubDto> findEventStubByTitle(UUID noteId, String title) {
        return academicEventRepository
                .findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(noteId, title)
                .map(event -> new TraceNodeStubDto(
                        TraceKind.event,
                        event.getId().toString(),
                        event.getTitle(),
                        "Deadline: " + event.getDeadline(),
                        false));
    }

    private Note findNote(String id) {
        return noteRepository.findById(parseUuid(id, TraceKind.note))
                .orElseThrow(() -> notFound(TraceKind.note, id));
    }

    private Task findTask(String id) {
        return taskRepository.findById(parseUuid(id, TraceKind.task))
                .orElseThrow(() -> notFound(TraceKind.task, id));
    }

    private AcademicEvent findEvent(String id) {
        return academicEventRepository.findById(parseUuid(id, TraceKind.event))
                .orElseThrow(() -> notFound(TraceKind.event, id));
    }

    private ImageMetadataView findImage(String id) {
        // Metadata-only projection: the binary column is never selected (FR-014).
        return imageRepository.findMetadataById(parseUuid(id, TraceKind.image))
                .orElseThrow(() -> notFound(TraceKind.image, id));
    }

    private Course findCourse(String id) {
        return courseRepository.findById(parseLong(id, TraceKind.course))
                .orElseThrow(() -> notFound(TraceKind.course, id));
    }

    private Schedule findSchedule(String id) {
        return scheduleRepository.findById(parseLong(id, TraceKind.schedule))
                .orElseThrow(() -> notFound(TraceKind.schedule, id));
    }

    private AcademicContext findContext(String id) {
        return academicContextRepository.findById(parseUuid(id, TraceKind.context))
                .orElseThrow(() -> notFound(TraceKind.context, id));
    }

    private UUID parseUuid(String id, TraceKind kind) {
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw notFound(kind, id);
        }
    }

    private Long parseLong(String id, TraceKind kind) {
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException | NullPointerException e) {
            throw notFound(kind, id);
        }
    }

    private ResourceNotFoundException notFound(TraceKind kind, String id) {
        return new ResourceNotFoundException(
                "Record of kind '" + kind + "' with id '" + id + "' not found");
    }

    /**
     * Finds the {@code DELETE} mutation audit for a missing record. Only
     * deletions produce tombstones; {@code ARCHIVE} and other actions keep
     * the plain not-found path. The snapshot iterates newest-first, so the
     * first match reports the most recent deletion.
     */
    private Optional<TraceNodeDto> tombstoneFor(TraceKind kind, String id) {
        return traceSink.snapshot().stream()
                .filter(event -> event.category() == AuditCategory.DATA_MUTATION
                        && event.mutationAction() == MutationAction.DELETE
                        && event.entityKind() == kind
                        && id.equals(event.entityId()))
                .findFirst()
                .map(event -> toTombstoneNode(kind, id, event));
    }

    private TraceNodeDto toTombstoneNode(TraceKind kind, String id, AuditTraceEvent event) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "tombstoneNote", "Record was deleted during session");
        if (event.originUsername() != null || event.originUserId() != null) {
            put(attributes, "deletedBy",
                    event.originUsername() + " (ID: " + event.originUserId() + ")");
        }
        return new TraceNodeDto(
                kind, id, "[Deleted] " + deletedTitle(kind, id, event), "DELETED",
                true, event.timestamp(), attributes, List.of());
    }

    /**
     * Extracts the deleted record's display name from the change summary.
     * Emitters quote it after the last {@code ": '"} marker; falls back to a
     * kind-and-id label when the summary carries no quoted name.
     */
    private String deletedTitle(TraceKind kind, String id, AuditTraceEvent event) {
        String summary = event.changeSummary();
        if (summary != null) {
            int marker = summary.lastIndexOf(": '");
            if (marker >= 0) {
                String title = summary.substring(marker + 3);
                return title.endsWith("'") ? title.substring(0, title.length() - 1) : title;
            }
        }
        return kind + " " + id;
    }

    private TraceNodeDto toNoteNode(Note note) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "title", note.getTitle());
        // FR-017: the detail drawer needs the full note body to locate and
        // highlight the quoted text from unrelated-information audits.
        put(attributes, "content", note.getContent());
        put(attributes, "entryDate", note.getEntryDate());
        put(attributes, "createdAt", note.getCreatedAt());
        put(attributes, "updatedAt", note.getUpdatedAt());
        put(attributes, "lastProcessedAt", note.getLastProcessedAt());
        putCourseAttributes(attributes, note.getCourse());
        return new TraceNodeDto(
                TraceKind.note,
                note.getId().toString(),
                note.getTitle(),
                note.getLastProcessedAt() != null ? "PROCESSED" : "PENDING",
                false,
                null,
                attributes,
                noteRelations(note));
    }

    private TraceNodeDto toTaskNode(Task task) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "title", task.getTitle());
        put(attributes, "description", task.getDescription());
        put(attributes, "status", task.getStatus().name());
        put(attributes, "planCategory", task.getPlanCategory().name());
        put(attributes, "scheduledDate", task.getScheduledDate());
        put(attributes, "durationMinutes",
                task.getDuration() != null ? task.getDuration().toMinutes() : null);
        put(attributes, "noteId", task.getNote() != null ? task.getNote().getId().toString() : null);
        put(attributes, "noteTitle", task.getNote() != null ? task.getNote().getTitle() : null);
        put(attributes, "createdAt", task.getCreatedAt());
        put(attributes, "updatedAt", task.getUpdatedAt());
        putCourseAttributes(attributes, task.getCourse());
        return new TraceNodeDto(
                TraceKind.task,
                task.getId().toString(),
                task.getTitle(),
                task.getStatus().name(),
                false,
                null,
                attributes,
                courseAndNoteRelations(task.getCourse(), task.getNote()));
    }

    private TraceNodeDto toEventNode(AcademicEvent event) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "title", event.getTitle());
        put(attributes, "description", event.getDescription());
        put(attributes, "deadline", event.getDeadline());
        put(attributes, "noteId", event.getNote() != null ? event.getNote().getId().toString() : null);
        put(attributes, "noteTitle", event.getNote() != null ? event.getNote().getTitle() : null);
        put(attributes, "createdAt", event.getCreatedAt());
        put(attributes, "updatedAt", event.getUpdatedAt());
        putCourseAttributes(attributes, event.getCourse());
        return new TraceNodeDto(
                TraceKind.event,
                event.getId().toString(),
                event.getTitle(),
                event.getDeadline().isAfter(java.time.LocalDateTime.now()) ? "UPCOMING" : "PAST",
                false,
                null,
                attributes,
                courseAndNoteRelations(event.getCourse(), event.getNote()));
    }

    private TraceNodeDto toImageNode(ImageMetadataView image) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "contentType", image.getContentType());
        put(attributes, "filename", image.getFilename());
        put(attributes, "size", image.getSize());
        put(attributes, "description", image.getDescription());
        put(attributes, "createdAt", image.getCreatedAt());
        put(attributes, "userId", image.getUser() != null ? image.getUser().getId() : null);
        return new TraceNodeDto(
                TraceKind.image,
                image.getId().toString(),
                image.getFilename() != null ? image.getFilename() : "Image " + image.getId(),
                null,
                false,
                null,
                attributes,
                List.of(group("Referencing Notes", TraceKind.note,
                        noteRepository.findByContentContaining(image.getId().toString())
                                .stream().map(this::noteStub).toList())));
    }

    private TraceNodeDto toCourseNode(Course course) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "name", course.getName());
        put(attributes, "description", course.getDescription());
        put(attributes, "color", course.getColor());
        put(attributes, "archivedAt", course.getArchivedAt());
        put(attributes, "userId", course.getUser() != null ? course.getUser().getId() : null);
        return new TraceNodeDto(
                TraceKind.course,
                course.getId().toString(),
                course.getName(),
                course.getArchivedAt() != null ? "ARCHIVED" : "ACTIVE",
                false,
                null,
                attributes,
                courseRelations(course));
    }

    private TraceNodeDto toScheduleNode(Schedule schedule) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "day", schedule.getDay().name());
        put(attributes, "startTime", schedule.getStartTime());
        put(attributes, "endTime", schedule.getEndTime());
        putCourseAttributes(attributes, schedule.getCourse());
        return new TraceNodeDto(
                TraceKind.schedule,
                schedule.getId().toString(),
                schedule.getDay() + " " + schedule.getStartTime() + "-" + schedule.getEndTime(),
                null,
                false,
                null,
                attributes,
                List.of(owningCourseGroup(schedule.getCourse())));
    }

    private TraceNodeDto toContextNode(AcademicContext context) {
        Map<String, Object> attributes = new LinkedHashMap<>();
        put(attributes, "value", context.getValue());
        put(attributes, "createdAt", context.getCreatedAt());
        put(attributes, "noteId",
                context.getNote() != null ? context.getNote().getId().toString() : null);
        put(attributes, "noteTitle",
                context.getNote() != null ? context.getNote().getTitle() : null);
        putCourseAttributes(attributes, context.getCourse());
        return new TraceNodeDto(
                TraceKind.context,
                context.getId().toString(),
                truncate(context.getValue()),
                null,
                false,
                null,
                attributes,
                courseAndNoteRelations(context.getCourse(), context.getNote()));
    }

    private List<TraceRelationGroupDto> courseRelations(Course course) {
        return List.of(
                group("Schedules", TraceKind.schedule,
                        course.getSchedules().stream().map(this::scheduleStub).toList()),
                group("Notes", TraceKind.note,
                        course.getNotes().stream().map(this::noteStub).toList()),
                group("Tasks", TraceKind.task,
                        course.getTasks().stream().map(this::taskStub).toList()),
                group("Events", TraceKind.event,
                        course.getAcademicEvents().stream().map(this::eventStub).toList()),
                group("Context Facts", TraceKind.context,
                        course.getAcademicContexts().stream().map(this::contextStub).toList()));
    }

    private List<TraceRelationGroupDto> noteRelations(Note note) {
        return List.of(
                owningCourseGroup(note.getCourse()),
                group("Child Tasks", TraceKind.task,
                        taskRepository.findByNoteIdOrderByCreatedAtDesc(note.getId())
                                .stream().map(this::taskStub).toList()),
                group("Child Events", TraceKind.event,
                        academicEventRepository.findByNoteIdOrderByDeadlineAsc(note.getId())
                                .stream().map(this::eventStub).toList()),
                group("Context Facts", TraceKind.context,
                        academicContextRepository.findByNoteIdOrderByCreatedAtDesc(note.getId())
                                .stream().map(this::contextStub).toList()),
                group("Referenced Images", TraceKind.image, referencedImageStubs(note)));
    }

    private List<TraceRelationGroupDto> courseAndNoteRelations(Course course, Note note) {
        return List.of(owningCourseGroup(course), sourceNoteGroup(note));
    }

    private TraceRelationGroupDto owningCourseGroup(Course course) {
        return group("Owning Course", TraceKind.course,
                course != null ? List.of(courseStub(course)) : List.of());
    }

    private TraceRelationGroupDto sourceNoteGroup(Note note) {
        return group("Source Note", TraceKind.note,
                note != null ? List.of(noteStub(note)) : List.of());
    }

    private List<TraceNodeStubDto> referencedImageStubs(Note note) {
        Set<UUID> imageIds = ImageReferenceExtractor.extractIds(note.getContent());
        if (imageIds.isEmpty()) {
            return List.of();
        }
        return imageRepository.findAllMetadataByIdIn(imageIds).stream()
                .map(this::imageStub).toList();
    }

    private TraceRelationGroupDto group(
            String groupName, TraceKind targetKind, List<TraceNodeStubDto> items) {
        return new TraceRelationGroupDto(groupName, targetKind, items.size(),
                items.size() > RELATION_ITEM_CAP ? items.subList(0, RELATION_ITEM_CAP) : items);
    }

    private TraceNodeStubDto courseStub(Course course) {
        return new TraceNodeStubDto(TraceKind.course, course.getId().toString(),
                course.getName(), course.getArchivedAt() != null ? "ARCHIVED" : "ACTIVE", true);
    }

    private TraceNodeStubDto noteStub(Note note) {
        return new TraceNodeStubDto(TraceKind.note, note.getId().toString(), note.getTitle(),
                note.getEntryDate() != null ? "Entry: " + note.getEntryDate() : null, true);
    }

    private TraceNodeStubDto taskStub(Task task) {
        return new TraceNodeStubDto(TraceKind.task, task.getId().toString(),
                task.getTitle(), taskSubtitle(task), true);
    }

    private TraceNodeStubDto eventStub(AcademicEvent event) {
        return new TraceNodeStubDto(TraceKind.event, event.getId().toString(),
                event.getTitle(), "Deadline: " + event.getDeadline(), true);
    }

    private TraceNodeStubDto scheduleStub(Schedule schedule) {
        return new TraceNodeStubDto(TraceKind.schedule, schedule.getId().toString(),
                schedule.getDay() + " " + schedule.getStartTime() + "-" + schedule.getEndTime(),
                null, true);
    }

    private TraceNodeStubDto imageStub(ImageMetadataView image) {
        return new TraceNodeStubDto(TraceKind.image, image.getId().toString(),
                image.getFilename() != null ? image.getFilename() : "Image " + image.getId(),
                image.getContentType(), true);
    }

    private TraceNodeStubDto contextStub(AcademicContext context) {
        return new TraceNodeStubDto(TraceKind.context, context.getId().toString(),
                truncate(context.getValue()), null, true);
    }

    private String truncate(String value) {
        if (value == null || value.length() <= 80) {
            return value;
        }
        return value.substring(0, 79) + "…";
    }

    private void putCourseAttributes(Map<String, Object> attributes, Course course) {
        if (course != null) {
            put(attributes, "courseId", course.getId());
            put(attributes, "courseName", course.getName());
        }
    }

    private String taskSubtitle(Task task) {
        StringBuilder subtitle = new StringBuilder();
        if (task.getScheduledDate() != null) {
            subtitle.append("Scheduled: ").append(task.getScheduledDate());
        }
        if (task.getDuration() != null) {
            if (subtitle.length() > 0) {
                subtitle.append(" | ");
            }
            subtitle.append(task.getDuration().toMinutes()).append("m");
        }
        return subtitle.length() > 0 ? subtitle.toString() : task.getStatus().name();
    }

    private void put(Map<String, Object> attributes, String key, Object value) {
        if (value != null) {
            attributes.put(key, value);
        }
    }
}
