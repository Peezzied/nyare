package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.AcademicEventRequest;
import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.impl.AcademicEventServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AcademicEventServiceImplTest {

    @Mock
    private AcademicEventRepository academicEventRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private NoteRepository noteRepository;

    @InjectMocks
    private AcademicEventServiceImpl academicEventService;

    private Course sampleCourse;
    private Note sampleNote;
    private AcademicEvent sampleEvent;
    private UUID eventId;
    private UUID noteId;

    @BeforeEach
    void setUp() {
        sampleCourse = new Course("Software Engineering", "SE core");
        ReflectionTestUtils.setField(sampleCourse, "id", 1L);

        noteId = UUID.randomUUID();
        sampleNote = new Note(sampleCourse, "Project milestone notes");
        ReflectionTestUtils.setField(sampleNote, "id", noteId);

        eventId = UUID.randomUUID();
        sampleEvent = new AcademicEvent(sampleCourse, sampleNote, "Milestone 1",
                "Submit architectural diagram", LocalDateTime.now().plusDays(7));
        ReflectionTestUtils.setField(sampleEvent, "id", eventId);
    }

    @Test
    @DisplayName("createEvent creates and returns academic event when request is valid")
    void createEvent_withValidRequestAndNote_returnsResponse() {
        AcademicEventRequest request = new AcademicEventRequest(1L, noteId, "Milestone 1",
                "Submit architectural diagram", LocalDateTime.now().plusDays(7));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));
        when(academicEventRepository.save(any(AcademicEvent.class))).thenAnswer(inv -> {
            AcademicEvent ev = inv.getArgument(0);
            ReflectionTestUtils.setField(ev, "id", eventId);
            return ev;
        });

        AcademicEventResponse response = academicEventService.createEvent(request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Milestone 1");
        assertThat(response.getCourseId()).isEqualTo(1L);
        assertThat(response.getNoteId()).isEqualTo(noteId);
    }

    @Test
    @DisplayName("createEvent creates event without note when noteId is null")
    void createEvent_withoutNoteId_createsEvent() {
        AcademicEventRequest request = new AcademicEventRequest(1L, null, "Midterm Exam",
                "Room 302", LocalDateTime.now().plusDays(14));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(academicEventRepository.save(any(AcademicEvent.class))).thenAnswer(inv -> {
            AcademicEvent ev = inv.getArgument(0);
            ReflectionTestUtils.setField(ev, "id", eventId);
            return ev;
        });

        AcademicEventResponse response = academicEventService.createEvent(request);

        assertThat(response).isNotNull();
        assertThat(response.getNoteId()).isNull();
        assertThat(response.getTitle()).isEqualTo("Midterm Exam");
    }

    @Test
    @DisplayName("createEvent throws ResourceNotFoundException when course is not found")
    void createEvent_withUnknownCourse_throwsResourceNotFoundException() {
        AcademicEventRequest request = new AcademicEventRequest(99L, null, "Midterm", null, LocalDateTime.now().plusDays(5));
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> academicEventService.createEvent(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("createEvent throws ResourceNotFoundException when note is not found")
    void createEvent_withUnknownNote_throwsResourceNotFoundException() {
        UUID unknownNoteId = UUID.randomUUID();
        AcademicEventRequest request = new AcademicEventRequest(1L, unknownNoteId, "Midterm", null, LocalDateTime.now().plusDays(5));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(noteRepository.findById(unknownNoteId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> academicEventService.createEvent(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Note not found with ID: " + unknownNoteId);
    }

    @Test
    @DisplayName("createEvent throws BadRequestException when note belongs to different course")
    void createEvent_withNoteFromDifferentCourse_throwsBadRequestException() {
        Course otherCourse = new Course("Different Course", "Other");
        ReflectionTestUtils.setField(otherCourse, "id", 2L);
        Note otherNote = new Note(otherCourse, "Other notes");
        ReflectionTestUtils.setField(otherNote, "id", noteId);

        AcademicEventRequest request = new AcademicEventRequest(1L, noteId, "Midterm", null, LocalDateTime.now().plusDays(5));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(otherNote));

        assertThatThrownBy(() -> academicEventService.createEvent(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Note does not belong to course with ID: 1");
    }

    @Test
    @DisplayName("listEvents passes userId, courseId, and upcoming to repository")
    void listEvents_passesFiltersToRepository() {
        ArgumentCaptor<LocalDateTime> timeCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        when(academicEventRepository.findAllFiltered(eq(42L), eq(1L), eq(true), timeCaptor.capture()))
                .thenReturn(List.of(sampleEvent));

        List<AcademicEventResponse> responses = academicEventService.listEvents(42L, 1L, true);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(eventId);
        assertThat(timeCaptor.getValue()).isNotNull();
    }

    @Test
    @DisplayName("getEvent returns event when found")
    void getEvent_withValidId_returnsEvent() {
        when(academicEventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));

        AcademicEventResponse response = academicEventService.getEvent(eventId);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(eventId);
    }

    @Test
    @DisplayName("getEvent throws ResourceNotFoundException when event not found")
    void getEvent_withUnknownId_throwsResourceNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        when(academicEventRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> academicEventService.getEvent(unknownId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Academic event not found with ID: " + unknownId);
    }

    @Test
    @DisplayName("updateEvent updates event fields when valid")
    void updateEvent_withValidRequest_updatesAndReturnsEvent() {
        AcademicEventRequest request = new AcademicEventRequest(1L, noteId, "Updated Milestone",
                "Updated details", LocalDateTime.now().plusDays(10));
        when(academicEventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(sampleNote));

        AcademicEventResponse response = academicEventService.updateEvent(eventId, request);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Updated Milestone");
        assertThat(response.getDescription()).isEqualTo("Updated details");
    }

    @Test
    @DisplayName("updateEvent throws ResourceNotFoundException when event not found")
    void updateEvent_withUnknownEvent_throwsResourceNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        AcademicEventRequest request = new AcademicEventRequest(1L, null, "Title", null, LocalDateTime.now().plusDays(5));
        when(academicEventRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> academicEventService.updateEvent(unknownId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Academic event not found with ID: " + unknownId);
    }

    @Test
    @DisplayName("updateEvent throws ResourceNotFoundException when course not found")
    void updateEvent_withUnknownCourse_throwsResourceNotFoundException() {
        AcademicEventRequest request = new AcademicEventRequest(99L, null, "Title", null, LocalDateTime.now().plusDays(5));
        when(academicEventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(courseRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> academicEventService.updateEvent(eventId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 99");
    }

    @Test
    @DisplayName("updateEvent throws BadRequestException when note belongs to different course")
    void updateEvent_withNoteFromDifferentCourse_throwsBadRequestException() {
        Course otherCourse = new Course("Other Course", "Other");
        ReflectionTestUtils.setField(otherCourse, "id", 2L);
        Note otherNote = new Note(otherCourse, "Other notes");
        ReflectionTestUtils.setField(otherNote, "id", noteId);

        AcademicEventRequest request = new AcademicEventRequest(1L, noteId, "Title", null, LocalDateTime.now().plusDays(5));
        when(academicEventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(sampleCourse));
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(otherNote));

        assertThatThrownBy(() -> academicEventService.updateEvent(eventId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Note does not belong to course with ID: 1");
    }

    @Test
    @DisplayName("deleteEvent deletes event when found")
    void deleteEvent_withValidId_deletesEvent() {
        when(academicEventRepository.findById(eventId)).thenReturn(Optional.of(sampleEvent));

        academicEventService.deleteEvent(eventId);

        verify(academicEventRepository).delete(sampleEvent);
    }

    @Test
    @DisplayName("deleteEvent throws ResourceNotFoundException when event not found")
    void deleteEvent_withUnknownId_throwsResourceNotFoundException() {
        UUID unknownId = UUID.randomUUID();
        when(academicEventRepository.findById(unknownId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> academicEventService.deleteEvent(unknownId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Academic event not found with ID: " + unknownId);
    }
}
