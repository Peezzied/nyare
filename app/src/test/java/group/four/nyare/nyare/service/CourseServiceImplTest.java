package group.four.nyare.nyare.service;

import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.impl.CourseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ImageService imageService;

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
    @DisplayName("createCourse uses the session user and ignores a request user id")
    void createCourse_usesSessionUser_ignoresRequestUserId() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenReturn(sampleCourse);

        // when
        CourseResponse response = courseService.createCourse(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("createCourse stores and returns the request color")
    void createCourse_withColor_storesAndReturnsColor() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS", "flamingo");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CourseResponse response = courseService.createCourse(request, 1L);

        // then
        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(captor.capture());
        assertThat(captor.getValue().getColor()).isEqualTo("flamingo");
        assertThat(response.getColor()).isEqualTo("flamingo");
    }

    @Test
    @DisplayName("createCourse accepts a null color and stores null")
    void createCourse_withNullColor_storesNull() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        CourseResponse response = courseService.createCourse(request, 1L);

        // then
        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(captor.capture());
        assertThat(captor.getValue().getColor()).isNull();
        assertThat(response.getColor()).isNull();
    }

    @Test
    @DisplayName("createCourse defers the mutation event to afterCommit when synchronization is active")
    void createCourse_activeSynchronization_publishesMutationAfterCommit() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(courseRepository.save(any(Course.class))).thenReturn(sampleCourse);

        TransactionSynchronizationManager.initSynchronization();
        try {
            // when
            courseService.createCourse(request, 1L);

            // then: the mutation event waits for commit
            verify(eventPublisher, never()).publishEvent(any());
            for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
                sync.afterCommit();
            }
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
        verify(eventPublisher).publishEvent(any(AuditTraceEvent.class));
    }

    @Test
    @DisplayName("createCourse throws ResourceNotFoundException when user is not found")
    void createCourse_withUnknownUser_throwsResourceNotFoundException() {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.createCourse(request, 99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 99");
    }

    @Test
    @DisplayName("listCourses scopes results to the session user")
    void listCourses_scopedToUser_returnsOnlyOwnData() {
        // given
        Course otherCourse = new Course("CS102", "Data Structures", sampleUser);
        ReflectionTestUtils.setField(otherCourse, "id", 11L);
        when(courseRepository.findByUserIdAndArchivedAtIsNull(1L))
                .thenReturn(List.of(sampleCourse, otherCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(1L);

        // then
        assertThat(courses).hasSize(2);
        assertThat(courses).allSatisfy(course -> assertThat(course.getUserId()).isEqualTo(1L));
        verify(courseRepository).findByUserIdAndArchivedAtIsNull(1L);
    }

    @Test
    @DisplayName("getCourse returns course response when ID exists")
    void getCourse_withValidId_returnsCourse() {
        // given
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.getCourse(10L, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getCourse throws ResourceNotFoundException when ID is unknown")
    void getCourse_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.getCourse(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("getCourse throws ResourceNotFoundException when the course belongs to another user")
    void getCourse_otherUser_throwsResourceNotFound() {
        // given
        when(courseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.getCourse(10L, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("updateCourse updates name and description when the course exists")
    void updateCourse_withValidRequest_updatesAndReturnsCourse() {
        // given
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.updateCourse(10L, request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getName()).isEqualTo("CS201");
        assertThat(response.getDescription()).isEqualTo("Data Structures");
        assertThat(response.getUserId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("updateCourse changes the course color")
    void updateCourse_withColor_updatesColor() {
        // given
        CourseRequest request = new CourseRequest("CS201", "Data Structures", "flamingo");
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.updateCourse(10L, request, 1L);

        // then
        assertThat(sampleCourse.getColor()).isEqualTo("flamingo");
        assertThat(response.getColor()).isEqualTo("flamingo");
    }

    @Test
    @DisplayName("updateCourse accepts a null color and clears the stored value")
    void updateCourse_withNullColor_clearsColor() {
        // given
        sampleCourse.setColor("flamingo");
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.updateCourse(10L, request, 1L);

        // then
        assertThat(sampleCourse.getColor()).isNull();
        assertThat(response.getColor()).isNull();
    }

    @Test
    @DisplayName("updateCourse accepts a null description")
    void updateCourse_withNullDescription_clearsDescription() {
        // given
        CourseRequest request = new CourseRequest("CS201", null);
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.updateCourse(10L, request, 1L);

        // then
        assertThat(response.getName()).isEqualTo("CS201");
        assertThat(response.getDescription()).isNull();
    }

    @Test
    @DisplayName("updateCourse throws ResourceNotFoundException when ID is unknown")
    void updateCourse_withUnknownId_throwsResourceNotFoundException() {
        // given
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.updateCourse(99L, request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("updateCourse throws ResourceNotFoundException when the course belongs to another user")
    void updateCourse_otherUser_throwsResourceNotFound() {
        // given
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        when(courseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.updateCourse(10L, request, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteCourse removes course when ID exists")
    void deleteCourse_withValidId_deletesCourse() {
        // given
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        courseService.deleteCourse(10L, 1L);

        // then
        verify(courseRepository).delete(sampleCourse);
    }

    @Test
    @DisplayName("deleteCourse throws ResourceNotFoundException when ID is unknown")
    void deleteCourse_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.deleteCourse(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("deleteCourse throws ResourceNotFoundException when the course belongs to another user")
    void deleteCourse_otherUser_throwsResourceNotFound() {
        // given
        when(courseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.deleteCourse(10L, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("deleteCourse deletes images referenced by the course notes before deleting the course")
    void deleteCourse_notesWithImageRefs_deletesImages() {
        // given
        UUID imageId = UUID.fromString("123e4567-e89b-42d3-a456-426614174000");
        Note note = new Note(sampleCourse, "See ![x](/api/images/" + imageId + ")");
        sampleCourse.setNotes(List.of(note));
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        courseService.deleteCourse(10L, 1L);

        // then
        verify(imageService).deleteImages(Set.of(imageId), 1L);
        verify(courseRepository).delete(sampleCourse);
    }

    @Test
    @DisplayName("deleteCourse skips image deletion when notes contain no image references")
    void deleteCourse_noImageRefs_skipsImageDelete() {
        // given
        Note note = new Note(sampleCourse, "plain text without images");
        sampleCourse.setNotes(List.of(note));
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        courseService.deleteCourse(10L, 1L);

        // then
        verify(imageService, never()).deleteImages(any(), any());
        verify(courseRepository).delete(sampleCourse);
    }

    @Test
    @DisplayName("archiveCourse sets the archive timestamp on an active course")
    void archiveCourse_withActiveCourse_setsArchivedAt() {
        // given
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.archiveCourse(10L, 1L);

        // then
        assertThat(sampleCourse.getArchivedAt()).isNotNull();
        assertThat(response.getArchivedAt()).isEqualTo(sampleCourse.getArchivedAt());
    }

    @Test
    @DisplayName("archiveCourse keeps the original timestamp on an already archived course")
    void archiveCourse_alreadyArchived_isNoOp() {
        // given
        LocalDateTime archivedAt = LocalDateTime.of(2026, 1, 10, 9, 0);
        sampleCourse.setArchivedAt(archivedAt);
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.archiveCourse(10L, 1L);

        // then
        assertThat(sampleCourse.getArchivedAt()).isEqualTo(archivedAt);
        assertThat(response.getArchivedAt()).isEqualTo(archivedAt);
        verify(courseRepository, never()).save(any(Course.class));
    }

    @Test
    @DisplayName("updateCourse throws BadRequestException when the course is archived")
    void updateCourse_withArchivedCourse_throwsBadRequestException() {
        // given
        sampleCourse.setArchivedAt(LocalDateTime.of(2026, 1, 10, 9, 0));
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when & then
        assertThatThrownBy(() -> courseService.updateCourse(10L, request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Course is archived");
    }

    @Test
    @DisplayName("listCourses queries active courses only and excludes archived ones")
    void listCourses_excludesArchivedCourses() {
        // given
        when(courseRepository.findByUserIdAndArchivedAtIsNull(1L))
                .thenReturn(List.of(sampleCourse));

        // when
        List<CourseResponse> courses = courseService.listCourses(1L);

        // then
        assertThat(courses).extracting(CourseResponse::getId).containsExactly(10L);
        verify(courseRepository).findByUserIdAndArchivedAtIsNull(1L);
        verify(courseRepository, never()).findByUserIdAndArchivedAtIsNotNull(any());
    }

    @Test
    @DisplayName("unarchiveCourse clears the archive timestamp on an archived course")
    void unarchiveCourse_withArchivedCourse_clearsArchivedAt() {
        // given
        sampleCourse.setArchivedAt(LocalDateTime.of(2026, 1, 10, 9, 0));
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));

        // when
        CourseResponse response = courseService.unarchiveCourse(10L, 1L);

        // then
        assertThat(sampleCourse.getArchivedAt()).isNull();
        assertThat(response.getArchivedAt()).isNull();
    }

    @Test
    @DisplayName("unarchiveCourse throws ResourceNotFoundException when ID is unknown")
    void unarchiveCourse_withUnknownId_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.unarchiveCourse(99L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("unarchiveCourses clears the archive timestamps and returns the restored DTOs")
    void unarchiveCourses_withValidIds_clearsArchivedAtAndReturnsDtos() {
        // given
        Course otherCourse = new Course("CS102", "Data Structures", sampleUser);
        ReflectionTestUtils.setField(otherCourse, "id", 11L);
        sampleCourse.setArchivedAt(LocalDateTime.of(2026, 1, 10, 9, 0));
        otherCourse.setArchivedAt(LocalDateTime.of(2026, 1, 11, 9, 0));
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));
        when(courseRepository.findByIdAndUserId(11L, 1L)).thenReturn(Optional.of(otherCourse));

        // when
        List<CourseResponse> responses = courseService.unarchiveCourses(List.of(10L, 11L), 1L);

        // then
        assertThat(responses).hasSize(2);
        assertThat(responses).extracting(CourseResponse::getId).containsExactly(10L, 11L);
        assertThat(responses).allSatisfy(response -> assertThat(response.getArchivedAt()).isNull());
        assertThat(sampleCourse.getArchivedAt()).isNull();
        assertThat(otherCourse.getArchivedAt()).isNull();
    }

    @Test
    @DisplayName("unarchiveCourses throws ResourceNotFoundException and changes nothing when an ID is unknown")
    void unarchiveCourses_withUnknownId_throwsAndChangesNothing() {
        // given
        LocalDateTime archivedAt = LocalDateTime.of(2026, 1, 10, 9, 0);
        sampleCourse.setArchivedAt(archivedAt);
        when(courseRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(sampleCourse));
        when(courseRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.unarchiveCourses(List.of(10L, 99L), 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
        assertThat(sampleCourse.getArchivedAt()).isEqualTo(archivedAt);
    }

    @Test
    @DisplayName("unarchiveCourses throws ResourceNotFoundException when a course belongs to another user")
    void unarchiveCourses_withForeignCourse_throwsAndChangesNothing() {
        // given
        LocalDateTime archivedAt = LocalDateTime.of(2026, 1, 10, 9, 0);
        sampleCourse.setArchivedAt(archivedAt);
        when(courseRepository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> courseService.unarchiveCourses(List.of(10L), 2L))
                .isInstanceOf(ResourceNotFoundException.class);
        assertThat(sampleCourse.getArchivedAt()).isEqualTo(archivedAt);
    }

    @Test
    @DisplayName("archiveAllCourses stamps every active course with one shared timestamp and returns the DTOs")
    void archiveAllCourses_withActiveCourses_setsSharedArchivedAtAndReturnsDtos() {
        // given
        Course otherCourse = new Course("CS102", "Data Structures", sampleUser);
        ReflectionTestUtils.setField(otherCourse, "id", 11L);
        when(courseRepository.findByUserIdAndArchivedAtIsNull(1L))
                .thenReturn(List.of(sampleCourse, otherCourse));

        // when
        List<CourseResponse> responses = courseService.archiveAllCourses(1L);

        // then
        assertThat(sampleCourse.getArchivedAt()).isNotNull();
        assertThat(otherCourse.getArchivedAt()).isEqualTo(sampleCourse.getArchivedAt());
        assertThat(responses).extracting(CourseResponse::getId).containsExactly(10L, 11L);
        assertThat(responses)
                .allSatisfy(
                        response ->
                                assertThat(response.getArchivedAt())
                                        .isEqualTo(sampleCourse.getArchivedAt()));
    }

    @Test
    @DisplayName("archiveAllCourses returns an empty list when no active courses exist")
    void archiveAllCourses_withNoActiveCourses_returnsEmptyList() {
        // given
        when(courseRepository.findByUserIdAndArchivedAtIsNull(1L)).thenReturn(List.of());

        // when
        List<CourseResponse> responses = courseService.archiveAllCourses(1L);

        // then
        assertThat(responses).isEmpty();
    }

    @Test
    @DisplayName("archiveAllCourses propagates a repository failure so the transaction rolls back")
    void archiveAllCourses_whenRepositoryThrows_propagatesAndChangesNothing() {
        // given
        when(courseRepository.findByUserIdAndArchivedAtIsNull(1L))
                .thenThrow(new RuntimeException("DB read failed"));

        // when & then
        assertThatThrownBy(() -> courseService.archiveAllCourses(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("DB read failed");
        assertThat(sampleCourse.getArchivedAt()).isNull();
    }
}
