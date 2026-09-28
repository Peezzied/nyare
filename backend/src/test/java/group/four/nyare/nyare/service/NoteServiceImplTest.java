package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.impl.NoteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NoteServiceImplTest {

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private NoteServiceImpl noteService;

    private Course course;
    private Note note;
    private UUID noteId;

    @BeforeEach
    void setUp() {
        course = new Course("Computer Systems", "CS intro course");
        noteId = UUID.randomUUID();
        note = new Note(course, "Study notes");
    }

    @Test
    void createNote_withValidRequest_returnsResponse() {
        // given
        NoteRequest request = new NoteRequest(1L, "Lecture 1");
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Lecture 1");
    }

    @Test
    void createNote_withNonExistentCourse_throwsResourceNotFoundException() {
        // given
        NoteRequest request = new NoteRequest(999L, "Lecture 1");
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.createNote(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 999");
    }

    @Test
    void updateNote_withValidRequest_returnsResponse() {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated notes");
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.updateNote(noteId, request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Updated notes");
    }

    @Test
    void updateNote_withNonExistentNote_throwsResourceNotFoundException() {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated notes");
        when(noteRepository.findById(noteId)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.updateNote(noteId, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Note not found with ID: " + noteId);
    }

    @Test
    void deleteNote_withValidId_deletesNote() {
        // given
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

        // when
        noteService.deleteNote(noteId);

        // then
        verify(noteRepository).delete(note);
    }

    @Test
    void listNotes_withCourseId_returnsNotesForCourse() {
        // given
        when(courseRepository.existsById(1L)).thenReturn(true);
        when(noteRepository.findByCourseIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(note));

        // when
        List<NoteResponse> responses = noteService.listNotes(1L);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getContent()).isEqualTo("Study notes");
    }

    @Test
    void listNotes_withNonExistentCourse_throwsResourceNotFoundException() {
        // given
        when(courseRepository.existsById(999L)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> noteService.listNotes(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 999");
    }

    @Test
    void listNotes_withoutCourseId_returnsAllNotes() {
        // given
        when(noteRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(note));

        // when
        List<NoteResponse> responses = noteService.listNotes(null);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getContent()).isEqualTo("Study notes");
    }
}
