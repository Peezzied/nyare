package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.impl.NoteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    @Mock
    private ImageRepository imageRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private NoteServiceImpl noteService;

    private Course course;
    private Note note;
    private UUID noteId;
    private User user;

    @BeforeEach
    void setUp() {
        course = new Course("Computer Systems", "CS intro course");
        noteId = UUID.randomUUID();
        note = new Note(course, "Study notes");
        user = new User("note_user");
    }

    @Test
    void createNote_withValidRequest_returnsResponse() {
        // given
        NoteRequest request = new NoteRequest(1L, "Lecture 1");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Untitled Note");
        assertThat(response.getContent()).isEqualTo("Lecture 1");
    }

    @Test
    void createNote_withCustomEntryDate_setsEntryDateOnNote() {
        // given
        LocalDate customDate = LocalDate.now().minusDays(3);
        NoteRequest request = new NoteRequest(1L, "Past note content", customDate);
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(inv -> inv.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getEntryDate()).isEqualTo(customDate);
    }

    @Test
    void createNote_withEntryDateOlderThanHorizon_throwsBadRequestException() {
        // given
        LocalDate tooOldDate = LocalDate.now().minusDays(15);
        NoteRequest request = new NoteRequest(1L, "Ancient note content", tooOldDate);

        // when & then
        assertThatThrownBy(() -> noteService.createNote(request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Entry date cannot be older than 14 days");
    }

    @Test
    void createNote_withExplicitTitle_savesAndReturnsExplicitTitle() {
        // given
        NoteRequest request = new NoteRequest(1L, "Explicit Title", "Note content");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Explicit Title");
        assertThat(response.getContent()).isEqualTo("Note content");
    }

    @Test
    void createNote_withNullTitle_defaultsToUntitledNote() {
        // given
        NoteRequest request = new NoteRequest(1L, null, "# Heading Title\nBody content");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Untitled Note");
        assertThat(response.getContent()).isEqualTo("# Heading Title\nBody content");
    }

    @Test
    void createNote_withBlankTitleAndEmptyContent_usesUntitledNoteFallback() {
        // given
        NoteRequest request = new NoteRequest(1L, "   ", "   ");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Untitled Note");
    }

    @Test
    void createNote_withBlankTitleAndHeadingContent_stillDefaultsToUntitledNote() {
        // given
        String longLine = "A".repeat(80);
        NoteRequest request = new NoteRequest(1L, "  ", "## " + longLine);
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Untitled Note");
    }

    @Test
    void createNote_withNonExistentCourse_throwsResourceNotFoundException() {
        // given
        NoteRequest request = new NoteRequest(999L, "Lecture 1");
        when(courseRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.createNote(request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 999");
    }

    @Test
    void createNote_courseOfOtherUser_throwsResourceNotFound() {
        // given
        NoteRequest request = new NoteRequest(1L, "Lecture 1");
        when(courseRepository.findByIdAndUserId(1L, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.createNote(request, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateNote_withValidRequest_returnsResponse() {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated notes");
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(note));
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.updateNote(noteId, request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).isEqualTo("Updated notes");
    }

    @Test
    void updateNote_withNewTitle_updatesTitle() {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated Title", "Updated notes");
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(note));
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.updateNote(noteId, request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Updated Title");
        assertThat(response.getContent()).isEqualTo("Updated notes");
    }

    @Test
    void updateNote_withNullTitleAndCustomExistingTitle_preservesExistingTitle() {
        // given
        Note customNote = new Note(course, "Custom Title", "Original content");
        NoteRequest request = new NoteRequest(1L, null, "Updated notes without title");
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(customNote));
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.updateNote(noteId, request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Custom Title");
        assertThat(response.getContent()).isEqualTo("Updated notes without title");
    }

    @Test
    void updateNote_withNullTitleAndDefaultExistingTitle_keepsUntitledNote() {
        // given
        Note defaultNote = new Note(course, "Untitled Note", "Original content");
        NoteRequest request = new NoteRequest(1L, null, "### New Section Header\nNew body");
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(defaultNote));
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.updateNote(noteId, request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Untitled Note");
        assertThat(response.getContent()).isEqualTo("### New Section Header\nNew body");
    }

    @Test
    void updateNote_withNonExistentNote_throwsResourceNotFoundException() {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated notes");
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.updateNote(noteId, request, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Note not found with ID: " + noteId);
    }

    @Test
    void updateNote_otherUser_throwsResourceNotFound() {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated notes");
        when(noteRepository.findByIdAndCourseUserId(noteId, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.updateNote(noteId, request, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteNote_withValidId_deletesNote() {
        // given
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(note));

        // when
        noteService.deleteNote(noteId, 1L);

        // then
        verify(noteRepository).delete(note);
    }

    @Test
    void deleteNote_otherUser_throwsResourceNotFound() {
        // given
        when(noteRepository.findByIdAndCourseUserId(noteId, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.deleteNote(noteId, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getNote_withValidId_returnsResponseWithTitle() {
        // given
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(note));

        // when
        NoteResponse response = noteService.getNote(noteId, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("Untitled Note");
        assertThat(response.getContent()).isEqualTo("Study notes");
    }

    @Test
    void getNote_otherUser_throwsResourceNotFound() {
        // given
        when(noteRepository.findByIdAndCourseUserId(noteId, 2L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> noteService.getNote(noteId, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listNotes_withCourseId_returnsSummariesForCourse() {
        // given
        when(courseRepository.existsById(1L)).thenReturn(true);
        when(noteRepository.findAllFiltered(42L, 1L, false, null, null, null)).thenReturn(List.of(note));

        // when
        List<NoteSummaryResponse> responses = noteService.listNotes(42L, 1L, false, null, null, null);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getTitle()).isEqualTo("Untitled Note");
        assertThat(responses.get(0).getPreview()).isEqualTo("Study notes");
        assertThat(responses.get(0).isTruncated()).isFalse();
    }

    @Test
    void listNotes_withNonExistentCourse_throwsResourceNotFoundException() {
        // given
        when(courseRepository.existsById(999L)).thenReturn(false);

        // when & then
        assertThatThrownBy(() -> noteService.listNotes(42L, 999L, false, null, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Course not found with ID: 999");
    }

    @Test
    void listNotes_scopedToUser_returnsOnlyOwnData() {
        // given
        Note otherNote = new Note(course, "Other notes");
        when(noteRepository.findAllFiltered(42L, null, false, null, null, null)).thenReturn(List.of(note, otherNote));

        // when
        List<NoteSummaryResponse> responses = noteService.listNotes(42L, null, false, null, null, null);

        // then
        assertThat(responses).hasSize(2);
        verify(noteRepository).findAllFiltered(42L, null, false, null, null, null);
    }

    @Test
    void listNotes_withLongContent_truncatesPreviewTo200Chars() {
        // given
        String longContent = "a".repeat(250);
        Note longNote = new Note(course, longContent);
        when(noteRepository.findAllFiltered(42L, null, false, null, null, null)).thenReturn(List.of(longNote));

        // when
        List<NoteSummaryResponse> responses = noteService.listNotes(42L, null, false, null, null, null);

        // then
        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getPreview()).hasSize(200);
        assertThat(responses.get(0).isTruncated()).isTrue();
        assertThat(responses.get(0).getContentLength()).isEqualTo(250);
    }

    @Test
    void listNotes_withQuery_sendsLowercaseLikePatternToRepository() {
        // given
        when(noteRepository.findAllFiltered(42L, null, false, "%lecture%", null, null))
                .thenReturn(List.of(note));

        // when
        List<NoteSummaryResponse> responses = noteService.listNotes(42L, null, false,
                "Lecture", null, null);

        // then
        assertThat(responses).hasSize(1);
        verify(noteRepository).findAllFiltered(42L, null, false, "%lecture%", null, null);
    }

    @Test
    void listNotes_withBlankQuery_sendsNullPatternToRepository() {
        // given
        when(noteRepository.findAllFiltered(42L, null, false, null, null, null))
                .thenReturn(List.of(note));

        // when
        List<NoteSummaryResponse> responses = noteService.listNotes(42L, null, false,
                "   ", null, null);

        // then
        assertThat(responses).hasSize(1);
        verify(noteRepository).findAllFiltered(42L, null, false, null, null, null);
    }

    @Test
    void listNotes_withFromAfterTo_throwsBadRequestException() {
        // given
        LocalDate from = LocalDate.of(2026, 10, 10);
        LocalDate to = LocalDate.of(2026, 10, 1);

        // when & then
        assertThatThrownBy(() -> noteService.listNotes(42L, null, false, null, from, to))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("from must not be after to");
    }

    @Test
    void createNote_withUnknownImageReference_throwsBadRequestException() {
        // given
        UUID unknownImageId = UUID.randomUUID();
        NoteRequest request = new NoteRequest(1L, "Note with ![x](/api/images/" + unknownImageId + ")");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));

        // when & then
        assertThatThrownBy(() -> noteService.createNote(request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("unknown image")
                .hasMessageContaining(unknownImageId.toString());
        verify(noteRepository, never()).save(any());
    }

    @Test
    void createNote_withKnownImageReference_succeeds() {
        // given
        Image image = new Image(new byte[]{1, 2, 3}, "image/png", "slide.png", 3L, user);
        org.springframework.test.util.ReflectionTestUtils.setField(image, "id", UUID.randomUUID());
        UUID imageId = image.getId();
        NoteRequest request = new NoteRequest(1L, "Note with ![x](/api/images/" + imageId + ")");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(imageRepository.findByUserIdAndIdIn(any(), anySet())).thenReturn(List.of(image));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        NoteResponse response = noteService.createNote(request, 1L);

        // then
        assertThat(response).isNotNull();
        assertThat(response.getContent()).contains(imageId.toString());
    }

    @Test
    void updateNote_withUnknownImageReference_throwsBadRequestException() {
        // given
        UUID unknownImageId = UUID.randomUUID();
        NoteRequest request = new NoteRequest(1L, "Updated ![x](/api/images/" + unknownImageId + ")");
        when(noteRepository.findByIdAndCourseUserId(noteId, 1L)).thenReturn(Optional.of(note));
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));

        // when & then
        assertThatThrownBy(() -> noteService.updateNote(noteId, request, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("unknown image")
                .hasMessageContaining(unknownImageId.toString());
        verify(noteRepository, never()).save(any());
    }

    @Test
    void createNote_withoutImageReferences_doesNotQueryImageRepository() {
        // given
        NoteRequest request = new NoteRequest(1L, "Plain text note");
        when(courseRepository.findByIdAndUserId(1L, 1L)).thenReturn(Optional.of(course));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // when
        noteService.createNote(request, 1L);

        // then
        verify(imageRepository, never()).findByUserIdAndIdIn(any(), anySet());
    }
}
