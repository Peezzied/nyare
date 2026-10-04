package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.CourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CourseServiceImpl courseService;

    private User sampleUser;
    private Course sampleCourse;

    @BeforeEach
    void setUp() {
        sampleUser = new User("alice");
        ReflectionTestUtils.setField(sampleUser, "id", 1L);

        sampleCourse = new Course("CS101", "Intro to CS", sampleUser);
        ReflectionTestUtils.setField(sampleCourse, "id", 10L);
    }

    @Test
    @DisplayName("createCourse uses session user when present")
    void createCourse_withSessionUser_createsAndReturnsCourse() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenReturn(sampleCourse);

        // when
        CourseResponse response = courseService.createCourse(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("CS101");
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("createCourse uses request userId when session user is null")
    void createCourse_withFallbackUserIdInRequest_createsAndReturnsCourse() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS", 1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenReturn(sampleCourse);

        // when
        CourseResponse response = courseService.createCourse(request, null);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("createCourse throws BadRequestException when no user identifier is present")
    void createCourse_withoutUser_throwsBadRequestException() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");

        // when & then
        assertThatThrownBy(() -> courseService.createCourse(request, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User identifier is required to create a course");
    }

    @Test
    @DisplayName("createCourse throws ResourceNotFoundException when user is not found")
    void createCourse_withUnknownUser_throwsResourceNotFoundException() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS", 99L);
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.createCourse(request, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 99");
    }

    @Test
    @DisplayName("listCourses returns user courses when session user is present")
    void listCourses_withSessionUser_returnsUserCourses() {
        // given
        when(courseRepository.findByUserId(1L)).thenReturn(List.of(sampleCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(1L, null);

        // then
        assertThat(courses).hasSize(1);
        assertThat(courses.get(0).getName()).isEqualTo("CS101");
    }

    @Test
    @DisplayName("listCourses returns user courses when query userId is present")
    void listCourses_withQueryUserId_returnsUserCourses() {
        // given
        when(courseRepository.findByUserId(1L)).thenReturn(List.of(sampleCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(null, 1L);

        // then
        assertThat(courses).hasSize(1);
        assertThat(courses.get(0).getName()).isEqualTo("CS101");
    }

    @Test
    @DisplayName("listCourses returns all courses when no user filter is provided")
    void listCourses_withoutFilter_returnsAllCourses() {
        // given
        when(courseRepository.findAll()).thenReturn(List.of(sampleCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(null, null);

        // then
        assertThat(courses).hasSize(1);
    }

    @Test
    @DisplayName("getCourse returns course response when ID exists")
    void getCourse_withValidId_returnsCourse() {
        // given
        when(courseRepository.findById(10L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.getCourse(10L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getCourse throws ResourceNotFoundException when ID is unknown")
    void getCourse_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.getCourse(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("deleteCourse removes course when ID exists")
    void deleteCourse_withValidId_deletesCourse() {
        // given
        when(courseRepository.findById(10L)).thenReturn(Optional.of(sampleCourse));

        // when
        courseService.deleteCourse(10L);

        // then
        verify(courseRepository).delete(sampleCourse);
    }

    @Test
    @DisplayName("deleteCourse throws ResourceNotFoundException when ID is unknown")
    void deleteCourse_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.deleteCourse(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }
}
