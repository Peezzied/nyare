package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ScheduleRequest;
import group.four.nyare.nyare.dto.ScheduleResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.service.impl.ScheduleServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceImplTest {

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private Course sampleCourse;
    private Schedule sampleSchedule;

    @BeforeEach
    void setUp() {
        sampleCourse = new Course("Computer Networks", "CN core");
        ReflectionTestUtils.setField(sampleCourse, "id", 1L);

        sampleSchedule = new Schedule(sampleCourse, DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(10, 30));
        ReflectionTestUtils.setField(sampleSchedule, "id", 10L);
    }

    @Test
    @DisplayName("createSchedule creates and returns schedule when valid")
    void createSchedule_withValidRequest_returnsResponse() {
        ScheduleRequest request = new ScheduleRequest(1L, DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(10, 30));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(scheduleRepository.save(any(Schedule.class))).thenReturn(sampleSchedule);

        ScheduleResponse response = scheduleService.createSchedule(request);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getCourseId()).isEqualTo(1L);
        assertThat(response.getDay()).isEqualTo(DayOfWeek.MONDAY);
    }

    @Test
    @DisplayName("createSchedule throws ResourceNotFoundException when course is not found")
    void createSchedule_withUnknownCourse_throwsResourceNotFoundException() {
        ScheduleRequest request = new ScheduleRequest(99L, DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(10, 30));
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scheduleService.createSchedule(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("createSchedule throws BadRequestException when start time is after end time")
    void createSchedule_withInvalidTimes_throwsBadRequestException() {
        ScheduleRequest request = new ScheduleRequest(1L, DayOfWeek.MONDAY,
                LocalTime.of(11, 0), LocalTime.of(10, 0));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));

        assertThatThrownBy(() -> scheduleService.createSchedule(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Start time must be before end time");
    }

    @Test
    @DisplayName("listSchedules passes userId and courseId to repository and filters by day")
    void listSchedules_withDayFilter_returnsFilteredSchedules() {
        Schedule tuesdaySchedule = new Schedule(sampleCourse, DayOfWeek.TUESDAY,
                LocalTime.of(9, 0), LocalTime.of(10, 30));
        ReflectionTestUtils.setField(tuesdaySchedule, "id", 11L);

        when(scheduleRepository.findAllFiltered(42L, 1L))
                .thenReturn(List.of(sampleSchedule, tuesdaySchedule));

        List<ScheduleResponse> responses = scheduleService.listSchedules(42L, 1L, DayOfWeek.MONDAY);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(10L);
        verify(scheduleRepository).findAllFiltered(42L, 1L);
    }

    @Test
    @DisplayName("listSchedules without day returns all repository schedules")
    void listSchedules_withoutDay_returnsAllSchedules() {
        when(scheduleRepository.findAllFiltered(42L, 1L))
                .thenReturn(List.of(sampleSchedule));

        List<ScheduleResponse> responses = scheduleService.listSchedules(42L, 1L, null);

        assertThat(responses).hasSize(1);
        verify(scheduleRepository).findAllFiltered(42L, 1L);
    }

    @Test
    @DisplayName("getSchedule returns schedule when found")
    void getSchedule_withValidId_returnsSchedule() {
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(sampleSchedule));

        ScheduleResponse response = scheduleService.getSchedule(10L);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getSchedule throws ResourceNotFoundException when schedule is not found")
    void getSchedule_withUnknownId_throwsResourceNotFoundException() {
        when(scheduleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scheduleService.getSchedule(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Schedule not found with ID: 99");
    }

    @Test
    @DisplayName("updateSchedule updates and returns schedule when valid")
    void updateSchedule_withValidRequest_updatesAndReturnsSchedule() {
        ScheduleRequest request = new ScheduleRequest(1L, DayOfWeek.WEDNESDAY,
                LocalTime.of(14, 0), LocalTime.of(16, 0));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(sampleSchedule));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));

        ScheduleResponse response = scheduleService.updateSchedule(10L, request);

        assertThat(response).isNotNull();
        assertThat(response.getDay()).isEqualTo(DayOfWeek.WEDNESDAY);
        assertThat(response.getStartTime()).isEqualTo(LocalTime.of(14, 0));
    }

    @Test
    @DisplayName("updateSchedule throws ResourceNotFoundException when schedule not found")
    void updateSchedule_withUnknownSchedule_throwsResourceNotFoundException() {
        ScheduleRequest request = new ScheduleRequest(1L, DayOfWeek.WEDNESDAY,
                LocalTime.of(14, 0), LocalTime.of(16, 0));
        when(scheduleRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scheduleService.updateSchedule(99L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Schedule not found with ID: 99");
    }

    @Test
    @DisplayName("updateSchedule throws ResourceNotFoundException when course not found")
    void updateSchedule_withUnknownCourse_throwsResourceNotFoundException() {
        ScheduleRequest request = new ScheduleRequest(99L, DayOfWeek.WEDNESDAY,
                LocalTime.of(14, 0), LocalTime.of(16, 0));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(sampleSchedule));
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> scheduleService.updateSchedule(10L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("updateSchedule throws BadRequestException when start time is equal to or after end time")
    void updateSchedule_withInvalidTimes_throwsBadRequestException() {
        ScheduleRequest request = new ScheduleRequest(1L, DayOfWeek.WEDNESDAY,
                LocalTime.of(16, 0), LocalTime.of(14, 0));
        when(scheduleRepository.findById(10L)).thenReturn(Optional.of(sampleSchedule));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));

        assertThatThrownBy(() -> scheduleService.updateSchedule(10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Start time must be before end time");
    }

    @Test
    @DisplayName("deleteSchedule deletes schedule when found")
    void deleteSchedule_withValidId_deletesSchedule() {
        when(scheduleRepository.existsById(10L)).thenReturn(true);

        scheduleService.deleteSchedule(10L);

        verify(scheduleRepository).deleteById(10L);
    }

    @Test
    @DisplayName("deleteSchedule throws ResourceNotFoundException when schedule not found")
    void deleteSchedule_withUnknownId_throwsResourceNotFoundException() {
        when(scheduleRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> scheduleService.deleteSchedule(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Schedule not found with ID: 99");
    }
}
