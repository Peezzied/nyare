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

        List<Note> user1DirtyNotes = noteRepository.findDirtyNotes(user1.getId(), LocalDate.now());
        List<Note> user2DirtyNotes = noteRepository.findDirtyNotes(user2.getId(), LocalDate.now());

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

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(user1.getId(), LocalDate.now());

        assertThat(dirtyNotes).extracting(Note::getId).contains(dirtyNote.getId());
        assertThat(dirtyNotes).extracting(Note::getId).doesNotContain(cleanNote.getId());
    }

    @Test
    @DisplayName("findAllFiltered isolates notes between users and filters by course")
    void findAllFiltered_isolatesNotesAndAppliesCourseFilter() {
        Course course1b = courseRepository.save(new Course("CS103", "Algorithms", user1));

        Note note1a = noteRepository.save(new Note(course1, "Note 1A"));
        Note note1b = noteRepository.save(new Note(course1b, "Note 1B"));
        Note note2 = noteRepository.save(new Note(course2, "Note 2"));

        List<Note> user1AllNotes = noteRepository.findAllFiltered(user1.getId(), null);
        assertThat(user1AllNotes).extracting(Note::getId).containsExactlyInAnyOrder(note1a.getId(), note1b.getId());
        assertThat(user1AllNotes).extracting(Note::getId).doesNotContain(note2.getId());

        List<Note> user1Course1Notes = noteRepository.findAllFiltered(user1.getId(), course1.getId());
        assertThat(user1Course1Notes).extracting(Note::getId).containsExactly(note1a.getId());
    }
}
