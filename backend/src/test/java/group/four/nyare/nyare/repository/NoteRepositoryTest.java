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
import java.time.ZoneId;
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

    private User defaultUser;

    @BeforeEach
    void setUp() {
        defaultUser = userRepository.save(new User("testuser_" + UUID.randomUUID()));
    }

    @Test
    @DisplayName("findDirtyNotes returns unprocessed and modified notes only")
    void findDirtyNotesFiltersCleanNotes() {
        Course course = courseRepository.save(new Course("CS101", "Intro to CS", defaultUser));

        // Note 1: Never processed (lastProcessedAt is null) -> Dirty
        Note note1 = new Note(course, "Unprocessed note");
        note1 = noteRepository.save(note1);

        // Note 2: Processed after update -> Clean
        Note note2 = new Note(course, "Processed note");
        note2 = noteRepository.save(note2);
        note2.setLastProcessedAt(Instant.now().plusSeconds(60));
        note2 = noteRepository.save(note2);

        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = today.atStartOfDay(zone).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(zone).toInstant();

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(startOfDay, endOfDay);

        assertThat(dirtyNotes).extracting(Note::getId).contains(note1.getId());
        assertThat(dirtyNotes).extracting(Note::getId).doesNotContain(note2.getId());
    }

    @Test
    @DisplayName("findAllByOrderByCreatedAtDesc returns notes ordered newest first")
    void findAllByOrderByCreatedAtDescReturnsOrderedNotes() {
        Course course = courseRepository.save(new Course("CS102", "Data Structures", defaultUser));

        Note olderNote = new Note(course, "Older Note");
        olderNote.setCreatedAt(Instant.now().minusSeconds(3600));
        noteRepository.save(olderNote);

        Note newerNote = new Note(course, "Newer Note");
        newerNote.setCreatedAt(Instant.now());
        noteRepository.save(newerNote);

        List<Note> allNotes = noteRepository.findAllByOrderByCreatedAtDesc();

        assertThat(allNotes).isNotEmpty();
        int newerIndex = allNotes.indexOf(newerNote);
        int olderIndex = allNotes.indexOf(olderNote);
        assertThat(newerIndex).isLessThan(olderIndex);
    }
}
