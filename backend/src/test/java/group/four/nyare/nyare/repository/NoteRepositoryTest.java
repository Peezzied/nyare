package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
class NoteRepositoryTest {

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Test
    @DisplayName("findTodayDirtyNotes returns unprocessed and modified notes only")
    void findTodayDirtyNotesFiltersCleanNotes() {
        Course course = courseRepository.save(new Course("CS101", "Intro to CS"));

        // Note 1: Never processed (lastProcessedAt is null) -> Dirty
        Note note1 = new Note(course, new NoteContent("Unprocessed note", null));
        note1 = noteRepository.save(note1);

        // Note 2: Processed after update -> Clean
        Note note2 = new Note(course, new NoteContent("Processed note", null));
        note2 = noteRepository.save(note2);
        note2.setLastProcessedAt(Instant.now().plusSeconds(60));
        note2 = noteRepository.save(note2);

        LocalDate today = LocalDate.now();
        ZoneId zone = ZoneId.systemDefault();
        Instant startOfDay = today.atStartOfDay(zone).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(zone).toInstant();

        List<Note> dirtyNotes = noteRepository.findTodayDirtyNotes(startOfDay, endOfDay);

        assertThat(dirtyNotes).extracting(Note::getId).contains(note1.getId());
        assertThat(dirtyNotes).extracting(Note::getId).doesNotContain(note2.getId());
    }
}
