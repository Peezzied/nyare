package group.four.nyare.nyare.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class NoteTest {

    @Test
    @DisplayName("Note tracks and updates lastProcessedAt timestamp")
    void noteTracksLastProcessedAt() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, new NoteContent("Markdown text", null));

        assertThat(note.getLastProcessedAt()).isNull();

        Instant processedTime = Instant.now();
        note.setLastProcessedAt(processedTime);

        assertThat(note.getLastProcessedAt()).isEqualTo(processedTime);
    }
}
