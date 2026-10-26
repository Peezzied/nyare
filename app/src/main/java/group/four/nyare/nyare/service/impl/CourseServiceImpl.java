package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.observability.event.*;
import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.CourseService;
import group.four.nyare.nyare.service.ImageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Service implementation for course management.
 */
@Service
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private static final Logger log = LoggerFactory.getLogger(CourseServiceImpl.class);

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final ImageService imageService;

    public CourseServiceImpl(CourseRepository courseRepository, UserRepository userRepository,
            ApplicationEventPublisher eventPublisher, ImageService imageService) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.imageService = imageService;
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CourseRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Course course = new Course(request.getName(), request.getDescription(), user);
        course.setColor(request.getColor());
        Course savedCourse = courseRepository.save(course);
        publishMutation(MutationAction.CREATE, savedCourse, userId,
                "Course created: '" + savedCourse.getName() + "'");
        return toResponse(savedCourse);
    }

    @Override
    public List<CourseResponse> listCourses(Long userId) {
        return courseRepository.findByUserIdAndArchivedAtIsNull(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<CourseResponse> listArchivedCourses(Long userId) {
        return courseRepository.findByUserIdAndArchivedAtIsNotNull(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CourseResponse getCourse(Long id, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        return toResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        if (course.getArchivedAt() != null) {
            throw new BadRequestException("Course is archived");
        }
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setColor(request.getColor());
        publishMutation(MutationAction.UPDATE, course, userId,
                "Course updated: '" + course.getName() + "'");
        return toResponse(course);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        // Delete note-referenced images before the cascade removes the notes.
        Set<UUID> imageIds = new HashSet<>();
        for (Note note : course.getNotes()) {
            imageIds.addAll(ImageReferenceExtractor.extractIds(note.getContent()));
        }
        if (!imageIds.isEmpty()) {
            imageService.deleteImages(imageIds, userId);
        }
        courseRepository.delete(course);
        publishMutation(MutationAction.DELETE, course, userId,
                "Course deleted: '" + course.getName() + "'");
    }

    @Override
    @Transactional
    public CourseResponse archiveCourse(Long id, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        if (course.getArchivedAt() == null) {
            course.setArchivedAt(LocalDateTime.now());
            publishMutation(MutationAction.ARCHIVE, course, userId,
                    "Course archived: '" + course.getName() + "'");
        }
        return toResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse unarchiveCourse(Long id, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        if (course.getArchivedAt() != null) {
            course.setArchivedAt(null);
            publishMutation(MutationAction.ARCHIVE, course, userId,
                    "Course unarchived: '" + course.getName() + "'");
        }
        return toResponse(course);
    }

    @Override
    @Transactional
    public List<CourseResponse> archiveAllCourses(Long userId) {
        List<Course> courses = courseRepository.findByUserIdAndArchivedAtIsNull(userId);
        LocalDateTime archivedAt = LocalDateTime.now();
        courses.forEach(course -> {
            course.setArchivedAt(archivedAt);
            publishMutation(MutationAction.ARCHIVE, course, userId,
                    "Course archived: '" + course.getName() + "'");
        });
        return courses.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<CourseResponse> unarchiveCourses(List<Long> courseIds, Long userId) {
        List<Course> courses = courseIds.stream()
                .map(id -> courseRepository.findByIdAndUserId(id, userId)
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Course not found with ID: " + id)))
                .toList();
        courses.forEach(course -> {
            if (course.getArchivedAt() != null) {
                course.setArchivedAt(null);
                publishMutation(MutationAction.ARCHIVE, course, userId,
                        "Course unarchived: '" + course.getName() + "'");
            }
        });
        return courses.stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Publishes a {@link AuditCategory#DATA_MUTATION} trace event for a course
     * mutation. Listener failures are swallowed: dev tooling must never break
     * a mutation.
     */
    private void publishMutation(MutationAction action, Course course, Long userId, String summary) {
        try {
            User user = course.getUser();
            AuditTraceEvent event = new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                    summary, userId, user != null ? user.getUsername() : null,
                    TriggerSource.WEB_SESSION, action, TraceKind.course,
                    String.valueOf(course.getId()), summary,
                    null, null, null, null, null, course.getId(),
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
            log.warn("Audit trace listener failed for course {} event: {}", action, e.getMessage());
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

    private CourseResponse toResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getUser() != null ? course.getUser().getId() : null,
                course.getColor(),
                course.getArchivedAt()
        );
    }
}
