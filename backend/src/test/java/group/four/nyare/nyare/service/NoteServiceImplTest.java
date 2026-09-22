package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ImageMetadataUpdateRequest;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.ImageMetadata;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.impl.NoteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
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
        NoteContent content = new NoteContent("Study notes", Collections.emptyMap());
        note = new Note(course, content);
    }

    @Test
    void createNote_withValidRequest_returnsResponse() {
        // given
        NoteContent content = new NoteContent("Lecture 1", Collections.emptyMap());
        NoteRequest request = new NoteRequest(1L, content);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent().getMarkdown()).isEqualTo("Lecture 1");
    }

    @Test
    void createNote_withNonExistentCourse_throwsResourceNotFoundException() {
        // given
        NoteContent content = new NoteContent("Lecture 1", Collections.emptyMap());
        NoteRequest request = new NoteRequest(999L, content);
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.createNote(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 999");
    }

    @Test
    void updateImageMetadata_withMismatchedKeys_throwsBadRequestException() {
        // given
        NoteContent content = new NoteContent("Diagram: ![Architecture][fig-1]", Map.of("fig-1", new ImageMetadata("data", "desc")));
        Note existingNote = new Note(course, content);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(existingNote));

        Map<String, ImageMetadata> updatedMap = new HashMap<>();
        updatedMap.put("fig-2", new ImageMetadata("data2", "desc2"));
        ImageMetadataUpdateRequest request = new ImageMetadataUpdateRequest(updatedMap);

        // when & then
        assertThatThrownBy(() -> noteService.updateImageMetadata(noteId, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Image metadata keys do not match markdown image references");
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
}
