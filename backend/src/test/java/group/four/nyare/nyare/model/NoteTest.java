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
        Note note = new Note(course, "Markdown text");

        assertThat(note.getLastProcessedAt()).isNull();

        Instant processedTime = Instant.now();
        note.setLastProcessedAt(processedTime);

        assertThat(note.getLastProcessedAt()).isEqualTo(processedTime);
    }

    @Test
    @DisplayName("Note stores and updates entryDate")
    void noteStoresAndUpdatesEntryDate() {
        Course course = new Course("CS101", "Computer Science");
        java.time.LocalDate pastDate = java.time.LocalDate.now().minusDays(2);
        Note note = new Note(course, "Past lecture content", pastDate);

        assertThat(note.getEntryDate()).isEqualTo(pastDate);

        java.time.LocalDate updatedDate = java.time.LocalDate.now().minusDays(1);
        note.setEntryDate(updatedDate);
        assertThat(note.getEntryDate()).isEqualTo(updatedDate);
    }

    @Test
    @DisplayName("requiresGeneratedTitle returns true for default and blank titles")
    void requiresGeneratedTitle_untitledOrBlank_returnsTrue() {
        Course course = new Course("CS101", "Computer Science");

        assertThat(new Note(course, "Content").requiresGeneratedTitle()).isTrue();
        assertThat(new Note(course, "Untitled Note", "Content").requiresGeneratedTitle()).isTrue();

        Note blank = new Note(course, "Custom Title", "Content");
        blank.setTitle("   ");
        assertThat(blank.requiresGeneratedTitle()).isTrue();
    }

    @Test
    @DisplayName("requiresGeneratedTitle returns false for custom titles")
    void requiresGeneratedTitle_customTitle_returnsFalse() {
        Course course = new Course("CS101", "Computer Science");

        assertThat(new Note(course, "Chapter 4 Notes", "Content").requiresGeneratedTitle()).isFalse();
    }
}
