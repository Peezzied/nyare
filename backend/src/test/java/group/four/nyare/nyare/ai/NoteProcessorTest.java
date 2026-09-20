package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.ImageMetadata;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NoteProcessorTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    private NoteProcessor noteProcessor;

    @BeforeEach
    void setUp() {
        noteProcessor = new NoteProcessor(chatClient);
    }

    @Test
    @DisplayName("process returns empty data immediately when notes list is null or empty")
    void processReturnsEmptyWhenNullOrEmptyList() {
        NoteProcessor.ExtractedData nullResult = noteProcessor.process(null);
        assertThat(nullResult.tasks()).isEmpty();
        assertThat(nullResult.events()).isEmpty();
        assertThat(nullResult.contexts()).isEmpty();

        NoteProcessor.ExtractedData emptyResult = noteProcessor.process(Collections.emptyList());
        assertThat(emptyResult.tasks()).isEmpty();
        assertThat(emptyResult.events()).isEmpty();
        assertThat(emptyResult.contexts()).isEmpty();

        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("process returns empty data when notes contain only blank markdown")
    void processReturnsEmptyWhenNotesHaveBlankContent() {
        Course course = new Course("CS101", "Computer Science");
        Note blankNote = new Note(course, new NoteContent("   ", null));

        NoteProcessor.ExtractedData result = noteProcessor.process(List.of(blankNote));

        assertThat(result.tasks()).isEmpty();
        assertThat(result.events()).isEmpty();
        assertThat(result.contexts()).isEmpty();
        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("process converts notes to CSV with stub references and decodes noteId")
    void processConvertsNotesToCsvAndDecodesNoteId() {
        Course course = new Course("CS101", "Computer Science");
        Note note1 = new Note(course, new NoteContent("Finish reading chapter 4", null));
        Note note2 = new Note(course, new NoteContent("Midterm exam scheduled on Friday", null));

        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        org.springframework.test.util.ReflectionTestUtils.setField(note1, "id", id1);
        org.springframework.test.util.ReflectionTestUtils.setField(note2, "id", id2);

        // Simulated AI response containing compact noteRef "n1" and "n2"
        NoteProcessor.ExtractedTask rawTask = new NoteProcessor.ExtractedTask(
                "n1",
                null,
                "Finish reading chapter 4",
                "Read pages 50-80",
                LocalDate.now().plusDays(1),
                30
        );
        NoteProcessor.ExtractedEvent rawEvent = new NoteProcessor.ExtractedEvent(
                "n2",
                null,
                "Midterm exam",
                "Covers chapters 1-4",
                LocalDateTime.now().plusDays(4)
        );
        NoteProcessor.ExtractedData expectedRaw = new NoteProcessor.ExtractedData(
                List.of(rawTask),
                List.of(rawEvent),
                Collections.emptyList()
        );

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        when(chatClient.prompt(promptCaptor.capture()).call().entity(NoteProcessor.ExtractedData.class))
                .thenReturn(expectedRaw);

        NoteProcessor.ExtractedData actual = noteProcessor.process(List.of(note1, note2));

        assertThat(actual).isNotNull();
        assertThat(actual.tasks()).hasSize(1);
        assertThat(actual.tasks().get(0).title()).isEqualTo("Finish reading chapter 4");
        assertThat(actual.tasks().get(0).noteRef()).isEqualTo("n1");
        assertThat(actual.tasks().get(0).noteId()).isEqualTo(id1);

        assertThat(actual.events()).hasSize(1);
        assertThat(actual.events().get(0).title()).isEqualTo("Midterm exam");
        assertThat(actual.events().get(0).noteRef()).isEqualTo("n2");
        assertThat(actual.events().get(0).noteId()).isEqualTo(id2);

        String promptSent = promptCaptor.getValue().getContents();
        assertThat(promptSent).contains("<journal_notes>");
        assertThat(promptSent).contains("note_ref,course,content");
        assertThat(promptSent).contains("n1,CS101");
        assertThat(promptSent).contains("n2,CS101");
        assertThat(promptSent).contains("</journal_notes>");
    }

    @Test
    @DisplayName("process serializes image metadata with compact stub references")
    void processIncludesImagesCsvTagWithStubReferences() {
        Course course = new Course("CS101", "Computer Science");
        ImageMetadata imageMeta = new ImageMetadata("base64data", "ER diagram for laboratory 2");
        NoteContent content = new NoteContent("Database schema lecture", Map.of("diagram.png", imageMeta));
        Note noteWithImage = new Note(course, content);

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        when(chatClient.prompt(promptCaptor.capture()).call().entity(NoteProcessor.ExtractedData.class))
                .thenReturn(null);

        NoteProcessor.ExtractedData result = noteProcessor.process(List.of(noteWithImage));

        assertThat(result).isNotNull();
        assertThat(result.tasks()).isEmpty();

        String promptSent = promptCaptor.getValue().getContents();
        assertThat(promptSent).contains("<journal_notes>");
        assertThat(promptSent).contains("<images>");
        assertThat(promptSent).contains("image_ref,note_ref,description");
        assertThat(promptSent).contains("i1,n1,ER diagram for laboratory 2");
        assertThat(promptSent).contains("</images>");
    }
}
