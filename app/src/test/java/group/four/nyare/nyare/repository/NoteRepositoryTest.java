package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class NoteRepositoryTest {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    private User user1;
    private User user2;
    private Course course1;
    private Course course2;

    @BeforeEach
    void setUp() {
        user1 = userRepository.save(new User("user1_" + UUID.randomUUID()));
        user2 = userRepository.save(new User("user2_" + UUID.randomUUID()));
        course1 = courseRepository.save(new Course("CS101", "Intro to CS", user1));
        course2 = courseRepository.save(new Course("CS202", "Data Structures", user2));
    }

    @Test
    @DisplayName("findDirtyNotes returns unprocessed notes for user and excludes other users")
    void findDirtyNotes_isolatesDirtyNotesByUser() {
        Note note1 = noteRepository.save(new Note(course1, "User 1 dirty note"));
        Note note2 = noteRepository.save(new Note(course2, "User 2 dirty note"));

        List<Note> user1DirtyNotes = noteRepository.findDirtyNotes(user1.getId(), LocalDate.now(), false);
        List<Note> user2DirtyNotes = noteRepository.findDirtyNotes(user2.getId(), LocalDate.now(), false);

        assertThat(user1DirtyNotes).extracting(Note::getId).containsExactly(note1.getId());
        assertThat(user2DirtyNotes).extracting(Note::getId).containsExactly(note2.getId());
    }

    @Test
    @DisplayName("findDirtyNotes excludes processed notes not updated since last processing")
    void findDirtyNotes_excludesCleanNotes() {
        Note dirtyNote = noteRepository.save(new Note(course1, "Unprocessed note"));

        Note cleanNote = new Note(course1, "Processed note");
        cleanNote.setLastProcessedAt(Instant.now().plusSeconds(60));
        cleanNote = noteRepository.save(cleanNote);

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId(), LocalDate.now(), false);

        assertThat(dirtyNotes).extracting(Note::getId).contains(dirtyNote.getId());
        assertThat(dirtyNotes).extracting(Note::getId).doesNotContain(cleanNote.getId());
    }

    @Test
    @DisplayName("findDirtyNotes excludes notes flagged excludedFromAi")
    void findDirtyNotes_excludedNote_isNotReturned() {
        // given
        Note includedNote = noteRepository.save(new Note(course1, "Included dirty note"));
        Note excludedNote = new Note(course1, "Excluded dirty note");
        excludedNote.setExcludedFromAi(true);
        noteRepository.save(excludedNote);

        // when
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId(), false);

        // then
        assertThat(dirtyNotes).extracting(Note::getId)
                .containsExactly(includedNote.getId());
    }

    @Test
    @DisplayName("findDirtyNotes for a date excludes notes flagged excludedFromAi")
    void findDirtyNotes_byDate_excludedNote_isNotReturned() {
        // given
        Note includedNote = noteRepository.save(new Note(course1, "Included dated note"));
        Note excludedNote = new Note(course1, "Excluded dated note");
        excludedNote.setExcludedFromAi(true);
        noteRepository.save(excludedNote);

        // when
        List<Note> dirtyNotes =
                noteRepository.findDirtyNotes(user1.getId(), LocalDate.now(), false);

        // then
        assertThat(dirtyNotes).extracting(Note::getId)
                .containsExactly(includedNote.getId());
    }

    @Test
    @DisplayName("findDirtyNotes returns the note again after exclusion is cleared")
    void findDirtyNotes_afterExclusionCleared_returnsNote() {
        // given
        Note note = new Note(course1, "Cleared exclusion note");
        note.setExcludedFromAi(true);
        note = noteRepository.save(note);
        note.setExcludedFromAi(false);
        noteRepository.save(note);

        // when
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId(), false);

        // then
        assertThat(dirtyNotes).extracting(Note::getId).containsExactly(note.getId());
    }

    @Test
    @DisplayName("findDirtyNotes does not return a cleared note that stays clean by timestamp")
    void findDirtyNotes_afterExclusionCleared_cleanNote_stillNotReturned() {
        // given
        Note note = new Note(course1, "Cleared but clean note");
        note.setExcludedFromAi(true);
        note = noteRepository.save(note);
        note.setExcludedFromAi(false);
        note.setLastProcessedAt(Instant.now().plusSeconds(60));
        noteRepository.save(note);

        // when
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId(), false);

        // then
        assertThat(dirtyNotes).extracting(Note::getId).doesNotContain(note.getId());
    }

    @Test
    @DisplayName("findAllFiltered isolates notes between users and filters by course")
    void findAllFiltered_isolatesNotesAndAppliesCourseFilter() {
        Course course1b = courseRepository.save(new Course("CS103", "Algorithms", user1));

        Note note1a = noteRepository.save(new Note(course1, "Note 1A"));
        Note note1b = noteRepository.save(new Note(course1b, "Note 1B"));
        Note note2 = noteRepository.save(new Note(course2, "Note 2"));

        List<Note> user1AllNotes = noteRepository.findAllFiltered(user1.getId(), null, false, null, null, null);
        assertThat(user1AllNotes).extracting(Note::getId).containsExactlyInAnyOrder(note1a.getId(), note1b.getId());
        assertThat(user1AllNotes).extracting(Note::getId).doesNotContain(note2.getId());

        List<Note> user1Course1Notes = noteRepository.findAllFiltered(user1.getId(), course1.getId(), false, null, null, null);
        assertThat(user1Course1Notes).extracting(Note::getId).containsExactly(note1a.getId());
    }

    @Test
    @DisplayName("findDirtyNotes returns backdated dirty notes ordered chronologically")
    void findDirtyNotes_returnsBackdatedDirtyNotesOrdered() {
        Note olderNote = new Note(course1, "Monday note", LocalDate.now().minusDays(2));
        Note newerNote = new Note(course1, "Wednesday note", LocalDate.now());
        noteRepository.save(newerNote);
        noteRepository.save(olderNote);

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId(), false);

        assertThat(dirtyNotes).extracting(Note::getId)
                .containsExactly(olderNote.getId(), newerNote.getId());
    }

    @Test
    @DisplayName("findAllFiltered hides notes on archived courses unless archived is true")
    void findAllFiltered_hidesArchivedCourseNotes() {
        Note note = noteRepository.save(new Note(course1, "Note on soon-archived course"));
        course1.setArchivedAt(LocalDateTime.now());

        List<Note> activeNotes = noteRepository.findAllFiltered(user1.getId(), null, false, null, null, null);
        List<Note> archivedNotes = noteRepository.findAllFiltered(user1.getId(), null, true, null, null, null);

        assertThat(activeNotes).extracting(Note::getId).doesNotContain(note.getId());
        assertThat(archivedNotes).extracting(Note::getId).containsExactly(note.getId());
    }

    @Test
    @DisplayName("findDirtyNotes hides dirty notes on archived courses unless archived is true")
    void findDirtyNotes_hidesArchivedCourseNotes() {
        Note dirtyNote = noteRepository.save(new Note(course1, "Dirty note on archived course"));
        course1.setArchivedAt(LocalDateTime.now());

        List<Note> activeDirty = noteRepository.findDirtyNotes(user1.getId(), false);
        List<Note> archivedDirty = noteRepository.findDirtyNotes(user1.getId(), true);

        assertThat(activeDirty).extracting(Note::getId).doesNotContain(dirtyNote.getId());
        assertThat(archivedDirty).extracting(Note::getId).containsExactly(dirtyNote.getId());
    }

    @Test
    @DisplayName("findDirtyNotes for a date hides dirty notes on archived courses")
    void findDirtyNotes_forDate_hidesArchivedCourseNotes() {
        Note dirtyNote = noteRepository.save(new Note(course1, "Dated dirty note"));
        course1.setArchivedAt(LocalDateTime.now());

        List<Note> activeDirty =
                noteRepository.findDirtyNotes(user1.getId(), LocalDate.now(), false);
        List<Note> archivedDirty =
                noteRepository.findDirtyNotes(user1.getId(), LocalDate.now(), true);

        assertThat(activeDirty).extracting(Note::getId).doesNotContain(dirtyNote.getId());
        assertThat(archivedDirty).extracting(Note::getId).containsExactly(dirtyNote.getId());
    }
}

