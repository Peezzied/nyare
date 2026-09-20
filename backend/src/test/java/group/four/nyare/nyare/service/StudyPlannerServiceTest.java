package group.four.nyare.nyare.service;

import group.four.nyare.nyare.ai.NoteProcessor;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.PlanCategory;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.impl.StudyPlannerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudyPlannerServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private AcademicEventRepository academicEventRepository;

    @Mock
    private AcademicContextRepository academicContextRepository;

    @Mock
    private NoteProcessor noteProcessor;

    @Mock
    private TransactionTemplate transactionTemplate;

    private StudyPlannerServiceImpl studyPlannerService;

    @BeforeEach
    void setUp() {
        lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(null);
        });

        studyPlannerService = new StudyPlannerServiceImpl(
                courseRepository,
                noteRepository,
                taskRepository,
                academicEventRepository,
                academicContextRepository,
                noteProcessor,
                transactionTemplate
        );
    }

    @Test
    @DisplayName("Task derives SCHEDULED category when scheduledDate is present")
    void taskDerivesScheduledCategory() {
        Course course = new Course("CS101", "Intro to CS");
        Task task = new Task(course, "Finish lab", LocalDate.now().plusDays(1), null);
        assertThat(task.getPlanCategory()).isEqualTo(PlanCategory.SCHEDULED);

        task.setDuration(Duration.ofMinutes(60));
        assertThat(task.getPlanCategory()).isEqualTo(PlanCategory.SCHEDULED);
    }

    @Test
    @DisplayName("Task derives LATER category when duration is present and scheduledDate is null")
    void taskDerivesLaterCategory() {
        Course course = new Course("CS101", "Intro to CS");
        Task task = new Task(course, "Study chapter 3");
        task.setDuration(Duration.ofMinutes(45));

        assertThat(task.getPlanCategory()).isEqualTo(PlanCategory.LATER);
    }

    @Test
    @DisplayName("Task derives BACKLOG category when scheduledDate and duration are both null")
    void taskDerivesBacklogCategory() {
        Course course = new Course("CS101", "Intro to CS");
        Task task = new Task(course, "General reading");

        assertThat(task.getPlanCategory()).isEqualTo(PlanCategory.BACKLOG);
    }

    @Test
    @DisplayName("processTodayNotes throws BadRequestException when no notes exist today")
    void processTodayNotesThrowsWhenNoNotes() {
        Course course = new Course("CS101", "Intro to CS");
        when(courseRepository.findAll()).thenReturn(List.of(course));
        when(noteRepository.findTodayNotesByCourseId(eq(course.getId()), any(LocalDate.class))).thenReturn(List.of());

        assertThatThrownBy(() -> studyPlannerService.processTodayNotes())
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No journal notes found for today to process");
    }

    @Test
    @DisplayName("processTodayNotes returns counts summary when today's notes exist")
    void processTodayNotesSucceedsWhenNotesExist() {
        Course course = new Course("CS101", "Intro to CS");
        Note note = new Note(course, new NoteContent("Test markdown content", null));

        when(courseRepository.findAll()).thenReturn(List.of(course));
        when(noteRepository.findTodayNotesByCourseId(eq(course.getId()), any(LocalDate.class))).thenReturn(List.of(note));
        when(noteProcessor.process(any())).thenReturn(new NoteProcessor.ExtractedData(
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList()
        ));
        when(taskRepository.saveAll(any())).thenReturn(List.of());
        when(academicEventRepository.saveAll(any())).thenReturn(List.of());
        when(academicContextRepository.saveAll(any())).thenReturn(List.of());

        ProcessSummaryResponse response = studyPlannerService.processTodayNotes();

        assertThat(response).isNotNull();
        assertThat(response.getTasksCreated()).isEqualTo(0);
        assertThat(response.getEventsCreated()).isEqualTo(0);
        assertThat(response.getContextsCreated()).isEqualTo(0);
    }

    @Test
    @DisplayName("processTodayNotes materializes entities returned by NoteProcessor")
    void processTodayNotesMaterializesExtractedEntities() {
        Course course = new Course("CS101", "Intro to CS");
        Note note = new Note(course, new NoteContent("Finish homework 1 and exam on Friday", null));
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        NoteProcessor.ExtractedTask extractedTask = new NoteProcessor.ExtractedTask(
                "n1",
                noteId,
                "Finish homework 1",
                "Complete exercises 1-5",
                LocalDate.now().plusDays(2),
                60
        );
        NoteProcessor.ExtractedEvent extractedEvent = new NoteProcessor.ExtractedEvent(
                "n1",
                noteId,
                "CS101 Midterm Exam",
                "Covers chapters 1 to 4",
                LocalDateTime.now().plusDays(5)
        );
        NoteProcessor.ExtractedContext extractedContext = new NoteProcessor.ExtractedContext(
                "n1",
                noteId,
                "Student struggled with recursion topics"
        );
        NoteProcessor.ExtractedData extractedData = new NoteProcessor.ExtractedData(
                List.of(extractedTask),
                List.of(extractedEvent),
                List.of(extractedContext)
        );

        when(courseRepository.findAll()).thenReturn(List.of(course));
        when(noteRepository.findTodayNotesByCourseId(eq(course.getId()), any(LocalDate.class))).thenReturn(List.of(note));
        when(noteProcessor.process(List.of(note))).thenReturn(extractedData);
        when(taskRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(academicEventRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(academicContextRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        ProcessSummaryResponse response = studyPlannerService.processTodayNotes();

        assertThat(response).isNotNull();
        assertThat(response.getTasksCreated()).isEqualTo(1);
        assertThat(response.getEventsCreated()).isEqualTo(1);
        assertThat(response.getContextsCreated()).isEqualTo(1);
    }
}
