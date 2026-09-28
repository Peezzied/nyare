package group.four.nyare.nyare.service;

import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.impl.StudyPlannerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudyPlannerServiceImplTest {

    @Mock NoteRepository noteRepository;
    @Mock TaskRepository taskRepository;
    @Mock AcademicEventRepository academicEventRepository;
    @Mock AcademicContextRepository academicContextRepository;
    @Mock ScheduleRepository scheduleRepository;
    @Mock StudyPlannerEngine studyPlannerEngine;

    StudyPlannerServiceImpl service;

    static final LocalDate DATE = LocalDate.of(2026, 9, 28);

    @BeforeEach
    void setUp() {
        service = new StudyPlannerServiceImpl(
                noteRepository, taskRepository,
                academicEventRepository, academicContextRepository,
                scheduleRepository, studyPlannerEngine);
    }

    @Test
    @DisplayName("processNotes throws BadRequestException when no dirty notes exist")
    void processNotes_noDirtyNotes_throwsBadRequest() {
        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of());

        assertThatThrownBy(() -> service.processNotes(DATE))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No journal notes found");
    }

    @Test
    @DisplayName("processNotes calls findAllOpen with no filter arguments")
    void processNotes_callsGlobalTaskQuery() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of(note));
        when(taskRepository.findAllOpen()).thenReturn(List.of());
        when(academicEventRepository.findAllFromNow(any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllOrderByDayAscStartTimeAsc()).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE);

        verify(taskRepository).findAllOpen();
        verify(scheduleRepository).findAllOrderByDayAscStartTimeAsc();
    }

    @Test
    @DisplayName("processNotes scopes context query to dirty-note courses only")
    void processNotes_scopesContextToDirtyCourses() {
        Course c1 = courseWithId(1L, "CS101");
        Course c2 = courseWithId(2L, "CS202");
        Note n1 = noteWithCourse(c1);
        Note n2 = noteWithCourse(c2);
        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of(n1, n2));
        when(taskRepository.findAllOpen()).thenReturn(List.of());
        when(academicEventRepository.findAllFromNow(any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllOrderByDayAscStartTimeAsc()).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE);

        verify(academicContextRepository).findByCourseIdInOrderByCreatedAtDesc(Set.of(1L, 2L));
    }

    @Test
    @DisplayName("processNotes passes NOW as the event window start")
    void processNotes_passesNowToEventQuery() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of(note));
        when(taskRepository.findAllOpen()).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllOrderByDayAscStartTimeAsc()).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<LocalDateTime> nowCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        when(academicEventRepository.findAllFromNow(nowCaptor.capture())).thenReturn(List.of());

        LocalDateTime before = LocalDateTime.now();
        service.processNotes(DATE);
        LocalDateTime after = LocalDateTime.now();

        assertThat(nowCaptor.getValue()).isBetween(before.minusSeconds(1), after.plusSeconds(1));
    }

    @Test
    @DisplayName("processNotes stamps lastProcessedAt on processed notes")
    void processNotes_stampsLastProcessedAt() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of(note));
        when(taskRepository.findAllOpen()).thenReturn(List.of());
        when(academicEventRepository.findAllFromNow(any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllOrderByDayAscStartTimeAsc()).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE);

        assertThat(note.getLastProcessedAt()).isNotNull();
        verify(noteRepository).saveAll(List.of(note));
    }

    @Test
    @DisplayName("processNotes updates promoted tasks using in-memory taskMap")
    void processNotes_promotesTaskWithoutExtraSqlLookup() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID taskId = UUID.randomUUID();
        Task existingTask = new Task(course, "Existing Study Task");
        try {
            var f = Task.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(existingTask, taskId);
        } catch (Exception e) { throw new RuntimeException(e); }

        StudyPlannerEngine.ExtractedTask promotion = new StudyPlannerEngine.ExtractedTask(
                null, taskId, null, "Existing Study Task", null, LocalDate.of(2026, 9, 30), 60);

        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of(note));
        when(taskRepository.findAllOpen()).thenReturn(List.of(existingTask));
        when(academicEventRepository.findAllFromNow(any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllOrderByDayAscStartTimeAsc()).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(promotion), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ProcessSummaryResponse response = service.processNotes(DATE);

        assertThat(existingTask.getScheduledDate()).isEqualTo(LocalDate.of(2026, 9, 30));
        assertThat(existingTask.getDuration()).isEqualTo(Duration.ofMinutes(60));
        assertThat(response.getTasksCreated()).isEqualTo(0);
    }

    // --- helpers ---

    private Course courseWithId(long id, String name) {
        Course c = new Course(name, name + " desc");
        try {
            var f = Course.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(c, id);
        } catch (Exception e) { throw new RuntimeException(e); }
        return c;
    }

    private Note noteWithCourse(Course course) {
        return new Note(course, new NoteContent("Some content", null));
    }
}
