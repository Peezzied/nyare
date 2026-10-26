package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.observability.event.*;
import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.service.ScheduleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ScheduleServiceImpl implements ScheduleService {

    private static final Logger log = LoggerFactory.getLogger(ScheduleServiceImpl.class);

    private final ScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository,
                               CourseRepository courseRepository,
                               ApplicationEventPublisher eventPublisher) {
        this.scheduleRepository = scheduleRepository;
        this.courseRepository = courseRepository;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request, Long userId) {
        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found with ID: " + request.getCourseId()));
        requireActiveCourse(course);

        validateTimes(request.getStartTime(), request.getEndTime());

        Schedule schedule = new Schedule(course, request.getDay(),
                request.getStartTime(), request.getEndTime());

        Schedule saved = scheduleRepository.save(schedule);
        publishMutation(MutationAction.CREATE, saved, userId, "Schedule created: " + describe(saved));
        return toResponse(saved);
    }

    @Override
    public List<ScheduleResponse> listSchedules(Long userId, Long courseId, DayOfWeek day, Boolean archived) {
        List<Schedule> schedules = scheduleRepository.findAllFiltered(userId, courseId, archived);
        if (day != null) {
            schedules = schedules.stream()
                    .filter(s -> s.getDay() == day)
                    .toList();
        }

        return schedules.stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public ScheduleResponse getSchedule(Long id, Long userId) {
        Schedule schedule = scheduleRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule not found with ID: " + id));
        return toResponse(schedule);
    }

    @Override
    @Transactional
    public ScheduleResponse updateSchedule(Long id, ScheduleRequest request, Long userId) {
        Schedule schedule = scheduleRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule not found with ID: " + id));
        requireActiveCourse(schedule.getCourse());

        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found with ID: " + request.getCourseId()));
        requireActiveCourse(course);

        validateTimes(request.getStartTime(), request.getEndTime());

        schedule.setCourse(course);
        schedule.setDay(request.getDay());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());

        publishMutation(MutationAction.UPDATE, schedule, userId, "Schedule updated: " + describe(schedule));
        return toResponse(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id, Long userId) {
        Schedule schedule = scheduleRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found with ID: " + id));
        requireActiveCourse(schedule.getCourse());
        scheduleRepository.delete(schedule);
        publishMutation(MutationAction.DELETE, schedule, userId, "Schedule deleted: " + describe(schedule));
    }

    private static String describe(Schedule schedule) {
        Course course = schedule.getCourse();
        String name = course != null ? course.getName() : "?";
        return "'" + name + " " + schedule.getDay() + " "
                + schedule.getStartTime() + "-" + schedule.getEndTime() + "'";
    }

    /**
     * Publishes a {@link AuditCategory#DATA_MUTATION} trace event for a
     * schedule mutation. Listener failures are swallowed: dev tooling must
     * never break a mutation.
     */
    private void publishMutation(MutationAction action, Schedule schedule, Long userId, String summary) {
        try {
            Course course = schedule.getCourse();
            User user = course != null ? course.getUser() : null;
            AuditTraceEvent event = new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                    summary, userId, user != null ? user.getUsername() : null,
                    TriggerSource.WEB_SESSION, action, TraceKind.schedule,
                    String.valueOf(schedule.getId()), summary,
                    null, null, null, null, null,
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
            log.warn("Audit trace listener failed for schedule {} event: {}", action, e.getMessage());
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

    private void validateTimes(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new BadRequestException("Start time must be before end time");
        }
    }

    private ScheduleResponse toResponse(Schedule schedule) {
        return new ScheduleResponse(
                schedule.getId(),
                schedule.getCourse().getId(),
                schedule.getDay(),
                schedule.getStartTime(),
                schedule.getEndTime()
        );
    }
}