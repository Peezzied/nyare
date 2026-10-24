package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.MutationAction;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.ai.observability.event.TriggerSource;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.NoteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation for journal note management.
 */
@Service
@Transactional(readOnly = true)
public class NoteServiceImpl implements NoteService {

    public static final int DEFAULT_MAX_BACKDATE_DAYS = 14;

    private static final int PREVIEW_MAX_LENGTH = 200;

    private static final Logger log = LoggerFactory.getLogger(NoteServiceImpl.class);

    @Value("${nyare.notes.max-backdate-days:14}")
    private int maxBackdateDays = DEFAULT_MAX_BACKDATE_DAYS;

    private final NoteRepository noteRepository;
    private final CourseRepository courseRepository;
    private final ImageRepository imageRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    public NoteServiceImpl(NoteRepository noteRepository, CourseRepository courseRepository,
            ImageRepository imageRepository, ApplicationEventPublisher eventPublisher,
            UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.courseRepository = courseRepository;
        this.imageRepository = imageRepository;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public NoteResponse createNote(NoteRequest request, Long userId) {
        validateEntryDate(request.getEntryDate(), resolveBackdatingDays(userId));

        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));
        requireActiveCourse(course);

        validateImageReferences(request.getContent(), userId);

        String title;
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            title = request.getTitle().trim();
        } else {
            title = Note.DEFAULT_TITLE;
        }

        LocalDate entryDate = request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now();
        Note note = new Note(course, title, request.getContent(), entryDate);
        Note savedNote = noteRepository.save(note);
        publishMutation(MutationAction.CREATE, savedNote, userId,
                "Note created: '" + savedNote.getTitle() + "'");
        return toResponse(savedNote);
    }

    @Override
    public List<NoteSummaryResponse> listNotes(Long userId, Long courseId, Boolean archived,
                                               String q, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("from must not be after to");
        }
        if (courseId != null) {
            if (!courseRepository.existsById(courseId)) {
                throw new ResourceNotFoundException("Course not found with ID: " + courseId);
            }
        }

        String pattern = (q == null || q.isBlank()) ? null : '%' + q.toLowerCase() + '%';
        return noteRepository.findAllFiltered(userId, courseId, archived, pattern, from, to)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    public NoteResponse getNote(UUID id, Long userId) {
        Note note = noteRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        return toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse updateNote(UUID id, NoteRequest request, Long userId) {
        if (request.getEntryDate() != null) {
            validateEntryDate(request.getEntryDate(), resolveBackdatingDays(userId));
        }

        Note note = noteRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        requireActiveCourse(note.getCourse());

        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));
        requireActiveCourse(course);

        validateImageReferences(request.getContent(), userId);

        note.setCourse(course);
        note.setContent(request.getContent());

        if (request.getEntryDate() != null) {
            note.setEntryDate(request.getEntryDate());
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            note.setTitle(request.getTitle().trim());
        }

        Note savedNote = noteRepository.save(note);
        publishMutation(MutationAction.UPDATE, savedNote, userId,
                "Note updated: '" + savedNote.getTitle() + "'");
        return toResponse(savedNote);
    }

    @Override
    @Transactional
    public void deleteNote(UUID id, Long userId) {
        Note note = noteRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        requireActiveCourse(note.getCourse());
        noteRepository.delete(note);
        publishMutation(MutationAction.DELETE, note, userId,
                "Note deleted: '" + note.getTitle() + "'");
    }

    /**
     * Publishes a {@link AuditCategory#DATA_MUTATION} trace event for a note
     * mutation. Listener failures are swallowed: dev tooling must never break
     * a mutation.
     */
    private void publishMutation(MutationAction action, Note note, Long userId, String summary) {
        try {
            Course course = note.getCourse();
            User user = course != null ? course.getUser() : null;
            AuditTraceEvent event = new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                    summary, userId, user != null ? user.getUsername() : null,
                    TriggerSource.WEB_SESSION, action, TraceKind.note,
                    String.valueOf(note.getId()), summary,
                    null, note.getId(), null, null, null,
                    course != null ? course.getId() : null,
                    null, null, null, null, null, null);
            // Defer until afterCommit so a commit-time rollback cannot leave a
            // phantom mutation event in the dev trace feed.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        publishEvent(event);
                    }
                });
            } else {
                publishEvent(event);
            }
        } catch (Exception e) {
            log.warn("Audit trace listener failed for note {} event: {}", action, e.getMessage());
        }
    }

    private void publishEvent(AuditTraceEvent event) {
        try {
            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.warn("Audit trace listener failed for {} {} event: {}",
                    event.entityKind(), event.mutationAction(), e.getMessage());
        }
    }

    private void requireActiveCourse(Course course) {
        if (course.getArchivedAt() != null) {
            throw new BadRequestException("Course is archived");
        }
    }

    private int resolveBackdatingDays(Long userId) {
        return userRepository.findById(userId)
                .map(User::getBackdatingHorizonDays)
                .filter(days -> days != null)
                .orElse(maxBackdateDays);
    }

    private void validateEntryDate(LocalDate entryDate, int horizonDays) {
        if (entryDate == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        if (entryDate.isAfter(today)) {
            throw new BadRequestException("Entry date cannot be in the future");
        }
        LocalDate oldestAllowed = today.minusDays(horizonDays);
        if (entryDate.isBefore(oldestAllowed)) {
            throw new BadRequestException("Entry date cannot be older than " + horizonDays + " days");
        }
    }

    private void validateImageReferences(String content, Long userId) {
        Set<UUID> referenced = ImageReferenceExtractor.extractIds(content);
        if (referenced.isEmpty()) {
            return;
        }
        Set<UUID> existing = imageRepository.findByUserIdAndIdIn(userId, referenced).stream()
                .map(Image::getId)
                .collect(Collectors.toSet());
        Set<UUID> missing = new LinkedHashSet<>(referenced);
        missing.removeAll(existing);
        if (!missing.isEmpty()) {
            throw new BadRequestException("Note references unknown image(s): " + missing);
        }
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getCourse() != null ? note.getCourse().getId() : null,
                note.getTitle(),
                note.getContent(),
                note.getEntryDate(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                note.getLastProcessedAt()
        );
    }

    private NoteSummaryResponse toSummary(Note note) {
        String content = note.getContent() != null ? note.getContent() : "";
        boolean truncated = content.length() > PREVIEW_MAX_LENGTH;
        String preview = truncated ? content.substring(0, PREVIEW_MAX_LENGTH) : content;
        return new NoteSummaryResponse(
                note.getId(),
                note.getCourse() != null ? note.getCourse().getId() : null,
                note.getTitle(),
                preview,
                truncated,
                content.length(),
                note.getEntryDate(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
