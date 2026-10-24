package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.MutationAction;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.ai.observability.event.TriggerSource;
import group.four.nyare.nyare.dto.AcademicEventRequest;
import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.AcademicEventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
@Transactional(readOnly = true)
public class AcademicEventServiceImpl implements AcademicEventService {

    private static final Logger log = LoggerFactory.getLogger(AcademicEventServiceImpl.class);

    private final AcademicEventRepository academicEventRepository;
    private final CourseRepository courseRepository;
    private final NoteRepository noteRepository;
    private final ApplicationEventPublisher eventPublisher;

    public AcademicEventServiceImpl(AcademicEventRepository academicEventRepository,
                                   CourseRepository courseRepository,
                                   NoteRepository noteRepository,
                                   ApplicationEventPublisher eventPublisher) {
        this.academicEventRepository = academicEventRepository;
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public AcademicEventResponse createEvent(AcademicEventRequest request, Long userId) {
        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));
        requireActiveCourse(course);

        Note note = null;
        if (request.getNoteId() != null) {
            note = noteRepository.findById(request.getNoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + request.getNoteId()));
            if (!note.getCourse().getId().equals(course.getId())) {
                throw new BadRequestException("Note does not belong to course with ID: " + course.getId());
            }
        }

        AcademicEvent event = new AcademicEvent(course, note, request.getTitle(), request.getDescription(), request.getDeadline());
        AcademicEvent savedEvent = academicEventRepository.save(event);
        publishMutation(MutationAction.CREATE, savedEvent, userId,
                "Academic event created: '" + savedEvent.getTitle() + "'");
        return toResponse(savedEvent);
    }

    @Override
    public List<AcademicEventResponse> listEvents(Long userId, Long courseId, Boolean upcoming, Boolean archived,
                                                  String q, LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BadRequestException("from must not be after to");
        }
        String pattern = (q == null || q.isBlank()) ? null : '%' + q.toLowerCase() + '%';
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fromBound = from != null ? from.atStartOfDay() : null;
        LocalDateTime toBound = to != null ? to.plusDays(1).atStartOfDay() : null;
        return academicEventRepository.findAllFiltered(userId, courseId, upcoming, now, archived,
                pattern, fromBound, toBound)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AcademicEventResponse getEvent(UUID id, Long userId) {
        AcademicEvent event = academicEventRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with ID: " + id));
        return toResponse(event);
    }

    @Override
    @Transactional
    public AcademicEventResponse updateEvent(UUID id, AcademicEventRequest request, Long userId) {
        AcademicEvent event = academicEventRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with ID: " + id));
        requireActiveCourse(event.getCourse());

        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));
        requireActiveCourse(course);

        Note note = null;
        if (request.getNoteId() != null) {
            note = noteRepository.findById(request.getNoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + request.getNoteId()));
            if (!note.getCourse().getId().equals(course.getId())) {
                throw new BadRequestException("Note does not belong to course with ID: " + course.getId());
            }
        }

        event.setCourse(course);
        event.setNote(note);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setDeadline(request.getDeadline());

        publishMutation(MutationAction.UPDATE, event, userId,
                "Academic event updated: '" + event.getTitle() + "'");
        return toResponse(event);
    }

    @Override
    @Transactional
    public void deleteEvent(UUID id, Long userId) {
        AcademicEvent event = academicEventRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with ID: " + id));
        requireActiveCourse(event.getCourse());
        academicEventRepository.delete(event);
        publishMutation(MutationAction.DELETE, event, userId,
                "Academic event deleted: '" + event.getTitle() + "'");
    }

    /**
     * Publishes a {@link AuditCategory#DATA_MUTATION} trace event for an
     * academic event mutation. Listener failures are swallowed: dev tooling
     * must never break a mutation.
     */
    private void publishMutation(MutationAction action, AcademicEvent event, Long userId, String summary) {
        try {
            Course course = event.getCourse();
            User user = course != null ? course.getUser() : null;
            Note note = event.getNote();
            AuditTraceEvent auditEvent = new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                    summary, userId, user != null ? user.getUsername() : null,
                    TriggerSource.WEB_SESSION, action, TraceKind.event,
                    String.valueOf(event.getId()), summary,
                    null, note != null ? note.getId() : null, null, event.getId(), null,
                    course != null ? course.getId() : null,
                    null, null, null, null, null, null);
            // Defer until afterCommit so a commit-time rollback cannot leave a
            // phantom mutation event in the dev trace feed.
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        publishEvent(auditEvent);
                    }
                });
            } else {
                publishEvent(auditEvent);
            }
        } catch (Exception e) {
            log.warn("Audit trace listener failed for event {} event: {}", action, e.getMessage());
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

    private AcademicEventResponse toResponse(AcademicEvent event) {
        AcademicEventResponse res = new AcademicEventResponse();
        res.setId(event.getId());
        res.setCourseId(event.getCourse().getId());
        res.setNoteId(event.getNote() != null ? event.getNote().getId() : null);
        res.setTitle(event.getTitle());
        res.setDescription(event.getDescription());
        res.setDeadline(event.getDeadline());
        res.setCreatedAt(event.getCreatedAt());
        return res;
    }
}
