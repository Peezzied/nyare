package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.service.ScheduleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;

    public ScheduleServiceImpl(ScheduleRepository scheduleRepository,
                               CourseRepository courseRepository) {
        this.scheduleRepository = scheduleRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public ScheduleResponse createSchedule(ScheduleRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found with ID: " + request.getCourseId()));

        validateTimes(request.getStartTime(), request.getEndTime());

        Schedule schedule = new Schedule(course, request.getDay(),
                request.getStartTime(), request.getEndTime());

        Schedule saved = scheduleRepository.save(schedule);
        return toResponse(saved);
    }

    @Override
    public List<ScheduleResponse> listSchedules(Long courseId, DayOfWeek day) {
        List<Schedule> schedules;

        if (courseId != null && day != null) {
            schedules = scheduleRepository.findByCourseIdAndDayOrderByStartTimeAsc(courseId, day);
        } else if (courseId != null) {
            schedules = scheduleRepository.findByCourseIdOrderByDayAscStartTimeAsc(courseId);
        } else {
            // No repository method exists for "all courses, filtered by day only" — filter in memory instead
            schedules = scheduleRepository.findAll();
            if (day != null) {
                schedules = schedules.stream()
                        .filter(s -> s.getDay() == day)
                        .collect(Collectors.toList());
            }
            schedules.sort(Comparator.comparing(Schedule::getDay)
                    .thenComparing(Schedule::getStartTime));
        }

        return schedules.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ScheduleResponse getSchedule(Long id) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule not found with ID: " + id));
        return toResponse(schedule);
    }

    @Override
    @Transactional
    public ScheduleResponse updateSchedule(Long id, ScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Schedule not found with ID: " + id));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course not found with ID: " + request.getCourseId()));

        validateTimes(request.getStartTime(), request.getEndTime());

        schedule.setCourse(course);
        schedule.setDay(request.getDay());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());

        return toResponse(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Schedule not found with ID: " + id);
        }
        scheduleRepository.deleteById(id);
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