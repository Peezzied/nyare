package group.four.nyare.nyare.service;

import group.four.nyare.nyare.ai.ImageAiProcessor;
import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.dto.PlannerStatusResponse;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.ImageRepository;
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
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.InOrder;

@ExtendWith(MockitoExtension.class)
class StudyPlannerServiceImplTest {

    @Mock
    NoteRepository noteRepository;
    @Mock
    TaskRepository taskRepository;
    @Mock
    AcademicEventRepository academicEventRepository;
    @Mock
    AcademicContextRepository academicContextRepository;
    @Mock
    ScheduleRepository scheduleRepository;
    @Mock
    ImageRepository imageRepository;
    @Mock
    ImageAiProcessor imageAiProcessor;
    @Mock
    StudyPlannerEngine studyPlannerEngine;

    StudyPlannerServiceImpl service;

    static final LocalDate DATE = LocalDate.of(2026, 9, 28);
    static final Long USER_ID = 42L;

    @BeforeEach
    void setUp() {
        service = new StudyPlannerServiceImpl(
                noteRepository, taskRepository,
                academicEventRepository, academicContextRepository,
                scheduleRepository, imageRepository,
                imageAiProcessor, studyPlannerEngine);
    }

    @Test
    @DisplayName("processNotes throws BadRequestException when userId is null")
    void processNotes_nullUserId_throwsBadRequest() {
        assertThatThrownBy(() -> service.processNotes((Long) null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User identifier is required for processing");
        assertThatThrownBy(() -> service.processNotes(DATE, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User identifier is required for processing");
    }

    @Test
    @DisplayName("processNotes throws BadRequestException when no dirty notes exist")
    void processNotes_noDirtyNotes_throwsBadRequest() {
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of());

        assertThatThrownBy(() -> service.processNotes(USER_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No journal notes found to process");

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of());

        assertThatThrownBy(() -> service.processNotes(DATE, USER_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No journal notes found");
    }

    @Test
    @DisplayName("getPlannerStatus throws BadRequestException when userId is null")
    void getPlannerStatus_nullUserId_throwsBadRequest() {
        assertThatThrownBy(() -> service.getPlannerStatus(null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User identifier is required");
    }

    @Test
    @DisplayName("getPlannerStatus returns empty summary when no dirty notes exist")
    void getPlannerStatus_noDirtyNotes_returnsEmptySummary() {
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of());

        PlannerStatusResponse response = service.getPlannerStatus(USER_ID);

        assertThat(response.isHasPendingNotes()).isFalse();
        assertThat(response.getDirtyNoteCount()).isEqualTo(0);
        assertThat(response.getDirtyDates()).isEmpty();
        assertThat(response.getCourseNames()).isEmpty();
        assertThat(response.getPendingNotes()).isEmpty();
    }

    @Test
    @DisplayName("getPlannerStatus returns pending note counts and distinct dates")
    void getPlannerStatus_withDirtyNotes_returnsPendingSummary() {
        Course course = courseWithId(1L, "CS101");
        Note note1 = new Note(course, "Monday note", "Content 1", LocalDate.of(2026, 10, 1));
        Note note2 = new Note(course, "Wednesday note", "Content 2", LocalDate.of(2026, 10, 3));
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        ReflectionTestUtils.setField(note1, "id", id1);
        ReflectionTestUtils.setField(note2, "id", id2);
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of(note1, note2));

        PlannerStatusResponse response = service.getPlannerStatus(USER_ID);

        assertThat(response.isHasPendingNotes()).isTrue();
        assertThat(response.getDirtyNoteCount()).isEqualTo(2);
        assertThat(response.getDirtyDates()).containsExactly(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 3));
        assertThat(response.getCourseNames()).containsExactly("CS101");
        assertThat(response.getPendingNotes()).isNotNull().hasSize(2);

        PlannerStatusResponse.PendingNoteSummary first = response.getPendingNotes().get(0);
        assertThat(first.getId()).isEqualTo(id1);
        assertThat(first.getTitle()).isEqualTo("Monday note");
        assertThat(first.getCourseName()).isEqualTo("CS101");
        assertThat(first.getEntryDate()).isEqualTo(LocalDate.of(2026, 10, 1));

        PlannerStatusResponse.PendingNoteSummary second = response.getPendingNotes().get(1);
        assertThat(second.getId()).isEqualTo(id2);
        assertThat(second.getTitle()).isEqualTo("Wednesday note");
        assertThat(second.getCourseName()).isEqualTo("CS101");
        assertThat(second.getEntryDate()).isEqualTo(LocalDate.of(2026, 10, 3));
    }

    @Test
    @DisplayName("processNotes processes dirty notes chronologically per date, deletes old uncompleted items, and aggregates summary")
    void processNotes_multiDaySequential_processesChronologicallyAndDeletesOldItems() {
        Course course1 = courseWithId(1L, "CS101");
        Course course2 = courseWithId(2L, "CS202");

        LocalDate day1 = LocalDate.of(2026, 10, 1);
        LocalDate day2 = LocalDate.of(2026, 10, 3);

        Note noteDay1 = new Note(course1, "Day 1 content", day1);
        Note noteDay2 = new Note(course2, "Day 2 content", day2);
        ReflectionTestUtils.setField(noteDay1, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(noteDay2, "id", UUID.randomUUID());

        // Note repository returns notes out of order; service groups and sorts chronologically
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of(noteDay2, noteDay1));

        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());

        StudyPlannerEngine.ExtractedTask task1 = new StudyPlannerEngine.ExtractedTask(
                null, null, noteDay1.getId(), "Task 1", "Desc 1", day1.plusDays(1), 30);
        StudyPlannerEngine.ExtractedTask task2 = new StudyPlannerEngine.ExtractedTask(
                null, null, noteDay2.getId(), "Task 2", "Desc 2", day2.plusDays(1), 45);

        StudyPlannerEngine.ExtractedEvent event1 = new StudyPlannerEngine.ExtractedEvent(
                null, noteDay1.getId(), "Event 1", "Event Desc 1", day1.plusDays(2).atTime(9, 0));
        StudyPlannerEngine.ExtractedContext context2 = new StudyPlannerEngine.ExtractedContext(
                null, noteDay2.getId(), "Fact 2");

        when(studyPlannerEngine.process(eq(List.of(noteDay1)), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(task1), List.of(event1), List.of()));
        when(studyPlannerEngine.process(eq(List.of(noteDay2)), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(task2), List.of(), List.of(context2)));

        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicContextRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ProcessSummaryResponse summary = service.processNotes(USER_ID);

        // Verify chronological execution order
        InOrder inOrder = inOrder(studyPlannerEngine);
        inOrder.verify(studyPlannerEngine).process(eq(List.of(noteDay1)), any(), any(), any(), any(), any());
        inOrder.verify(studyPlannerEngine).process(eq(List.of(noteDay2)), any(), any(), any(), any(), any());

        // Verify aggregated summary
        assertThat(summary.getTasksCreated()).isEqualTo(2);
        assertThat(summary.getEventsCreated()).isEqualTo(1);
        assertThat(summary.getContextsCreated()).isEqualTo(1);
        assertThat(summary.getAffectedCourseIds()).containsExactly(1L, 2L);

        // Verify notes stamped with lastProcessedAt
        assertThat(noteDay1.getLastProcessedAt()).isNotNull();
        assertThat(noteDay2.getLastProcessedAt()).isNotNull();
    }

    @Test
    @ExtendWith(OutputCaptureExtension.class)
    @DisplayName("processNotes audits run trigger and completion with user scope")
    void processNotes_auditsTriggerAndCompletion(CapturedOutput output) {
        Course course = courseWithId(1L, "CS101");
        Note note = new Note(course, "Content", LocalDate.of(2026, 10, 1));
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(USER_ID);

        assertThat(output.getAll())
                .contains("[AI AUDIT - PROCESS TRIGGERED] UserId: " + USER_ID)
                .contains("Notes: 1")
                .contains("Dates: 2026-10-01")
                .contains("Courses: CS101")
                .contains("[AI AUDIT - PROCESS COMPLETED] UserId: " + USER_ID);
    }

    @Test
    @DisplayName("processNotes calls user-scoped task and schedule queries")
    void processNotes_callsUserScopedTaskAndScheduleQueries() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(taskRepository).findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull());
        verify(scheduleRepository).findAllFiltered(eq(USER_ID), isNull(), eq(false));
    }

    @Test
    @DisplayName("processNotes scopes context query to dirty-note courses only")
    void processNotes_scopesContextToDirtyCourses() {
        Course c1 = courseWithId(1L, "CS101");
        Course c2 = courseWithId(2L, "CS202");
        Note n1 = noteWithCourse(c1);
        Note n2 = noteWithCourse(c2);
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(n1, n2));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(academicContextRepository).findByCourseIdInOrderByCreatedAtDesc(Set.of(1L, 2L));
    }

    @Test
    @DisplayName("processNotes passes NOW as the event window start")
    void processNotes_passesNowToEventQuery() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<LocalDateTime> nowCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), nowCaptor.capture(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());

        LocalDateTime before = LocalDateTime.now();
        service.processNotes(DATE, USER_ID);
        LocalDateTime after = LocalDateTime.now();

        assertThat(nowCaptor.getValue()).isBetween(before.minusSeconds(1), after.plusSeconds(1));
    }

    @Test
    @DisplayName("processNotes stamps lastProcessedAt on processed notes")
    void processNotes_stampsLastProcessedAt() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

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
        ReflectionTestUtils.setField(existingTask, "id", taskId);

        StudyPlannerEngine.ExtractedTask promotion = new StudyPlannerEngine.ExtractedTask(
                null, taskId, null, "Existing Study Task", null, LocalDate.of(2026, 9, 30), 60);

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(existingTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(promotion), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ProcessSummaryResponse response = service.processNotes(DATE, USER_ID);

        assertThat(existingTask.getScheduledDate()).isEqualTo(LocalDate.of(2026, 9, 30));
        assertThat(existingTask.getDuration()).isEqualTo(Duration.ofMinutes(60));
        assertThat(response.getTasksCreated()).isEqualTo(0);
        assertThat(response.getAffectedCourseIds()).containsExactly(1L);
    }

    @Test
    @DisplayName("processNotes extracts image IDs from notes, updates missing descriptions, and saves to repository")
    void processNotes_extractsAndUpdatesMissingImageDescriptions() {
        UUID imageId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setContent("Check lecture slide ![slide](/api/images/" + imageId + ")");
        ReflectionTestUtils.setField(note, "id", noteId);

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L, null);
        ReflectionTestUtils.setField(image, "id", imageId);

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(imageAiProcessor.describeImage(any(), any())).thenReturn("Binary tree diagram");
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(imageAiProcessor).describeImage(image.getData(), image.getContentType());
        verify(imageRepository).saveAll(argThat(list -> {
            List<Image> images = (List<Image>) list;
            return images.size() == 1 && "Binary tree diagram".equals(images.get(0).getDescription());
        }));
    }

    @Test
    @DisplayName("processNotes truncates overlong AI image description to persist cap")
    void processNotes_truncatesOverlongImageDescription() {
        UUID imageId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setContent("Check lecture slide ![slide](/api/images/" + imageId + ")");
        ReflectionTestUtils.setField(note, "id", noteId);

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L, null);
        ReflectionTestUtils.setField(image, "id", imageId);

        String longDescription = "Important fact. ".repeat(50);

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(imageAiProcessor.describeImage(any(), any())).thenReturn(longDescription);
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        ArgumentCaptor<List<Image>> captor = ArgumentCaptor.forClass(List.class);
        verify(imageRepository).saveAll(captor.capture());
        String persisted = captor.getValue().get(0).getDescription();
        assertThat(persisted.length()).isLessThanOrEqualTo(500);
        assertThat(persisted).endsWith("…");
    }

    @Test
    @DisplayName("processNotes reuses existing image description without calling AI processor")
    void processNotes_reusesExistingImageDescriptionWithoutCallingAi() {
        UUID imageId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setContent("Check diagram ![slide](/api/images/" + imageId + ")");
        ReflectionTestUtils.setField(note, "id", noteId);

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L, null);
        ReflectionTestUtils.setField(image, "id", imageId);
        image.setDescription("Existing description");

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(imageAiProcessor, never()).describeImage(any(), any());
        verify(imageRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("processNotes processes multiple missing image descriptions concurrently and persists all")
    void processNotes_withMultipleMissingImageDescriptions_processesConcurrentlyAndPersistsAll() {
        UUID imgId1 = UUID.randomUUID();
        UUID imgId2 = UUID.randomUUID();
        UUID imgId3 = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setContent("Images: ![img1](/api/images/" + imgId1 + ") ![img2](/api/images/" + imgId2 + ") ![img3](/api/images/" + imgId3 + ")");
        ReflectionTestUtils.setField(note, "id", noteId);

        Image img1 = new Image(new byte[]{1}, "image/png", "img1.png", 1L, null);
        ReflectionTestUtils.setField(img1, "id", imgId1);
        Image img2 = new Image(new byte[]{2}, "image/png", "img2.png", 1L, null);
        ReflectionTestUtils.setField(img2, "id", imgId2);
        Image img3 = new Image(new byte[]{3}, "image/png", "img3.png", 1L, null);
        ReflectionTestUtils.setField(img3, "id", imgId3);

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(img1, img2, img3));
        when(imageAiProcessor.describeImage(eq(img1.getData()), eq(img1.getContentType()))).thenReturn("Description 1");
        when(imageAiProcessor.describeImage(eq(img2.getData()), eq(img2.getContentType()))).thenReturn("Description 2");
        when(imageAiProcessor.describeImage(eq(img3.getData()), eq(img3.getContentType()))).thenReturn("Description 3");
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(imageAiProcessor).describeImage(img1.getData(), img1.getContentType());
        verify(imageAiProcessor).describeImage(img2.getData(), img2.getContentType());
        verify(imageAiProcessor).describeImage(img3.getData(), img3.getContentType());

        ArgumentCaptor<List<Image>> captor = ArgumentCaptor.forClass(List.class);
        verify(imageRepository).saveAll(captor.capture());
        List<Image> saved = captor.getValue();
        assertThat(saved).hasSize(3);
        assertThat(saved).extracting(Image::getDescription).containsExactlyInAnyOrder("Description 1", "Description 2", "Description 3");
    }

    @Test
    @DisplayName("processNotes updates and persists generated note titles")
    void processNotes_extractedNoteTitlesPresent_updatesAndPersistsNoteTitles() {
        // given
        UUID noteId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setTitle("Untitled Note");
        ReflectionTestUtils.setField(note, "id", noteId);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(), List.of(), List.of(), Map.of(noteId, "  Derivatives and Integrals  "));

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        service.processNotes(DATE, USER_ID);

        // then
        assertThat(note.getTitle()).isEqualTo("Derivatives and Integrals");
        verify(noteRepository).saveAll(argThat((List<Note> notes) ->
                notes.stream().anyMatch(n -> "Derivatives and Integrals".equals(n.getTitle()))
        ));
    }

    @Test
    @DisplayName("processNotes ignores generated titles for notes with custom titles")
    void processNotes_noteTitleForCustomTitledNote_keepsExistingTitle() {
        // given
        UUID noteId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setTitle("Chapter 4 Notes");
        ReflectionTestUtils.setField(note, "id", noteId);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(), List.of(), List.of(), Map.of(noteId, "AI Replacement Title"));

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        service.processNotes(DATE, USER_ID);

        // then
        assertThat(note.getTitle()).isEqualTo("Chapter 4 Notes");
    }

    @Test
    @DisplayName("processNotes cancelled before first date throws CancellationException and skips engine")
    void processNotes_listenerCancelledBeforeFirstDate_throwsCancellationAndSkipsEngine() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of(note));

        ProcessListener listener = new ProcessListener() {
            @Override
            public boolean isCancelled() {
                return true;
            }
        };

        // when/then
        assertThatThrownBy(() -> service.processNotes(USER_ID, listener))
                .isInstanceOf(java.util.concurrent.CancellationException.class)
                .hasMessageContaining("Processing cancelled");

        verify(studyPlannerEngine, never()).process(any(), any(), any(), any(), any(), any());
        verify(taskRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("processNotes cancelled during engine call throws CancellationException without persisting")
    void processNotes_cancelledDuringEngineCall_throwsCancellationWithoutPersisting() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());

        java.util.concurrent.atomic.AtomicBoolean engineCalled = new java.util.concurrent.atomic.AtomicBoolean();
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    engineCalled.set(true);
                    return new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of());
                });

        ProcessListener listener = new ProcessListener() {
            @Override
            public boolean isCancelled() {
                return engineCalled.get();
            }
        };

        // when/then
        assertThatThrownBy(() -> service.processNotes(USER_ID, listener))
                .isInstanceOf(java.util.concurrent.CancellationException.class)
                .hasMessageContaining("Processing cancelled");

        verify(taskRepository, never()).saveAll(anyList());
        verify(academicEventRepository, never()).saveAll(anyList());
        verify(academicContextRepository, never()).saveAll(anyList());
        verify(noteRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("processNotes reports onDateStarted progress per date in chronological order")
    void processNotes_multipleDates_reportsProgressPerDateInOrder() {
        // given
        Course course = courseWithId(1L, "CS101");
        LocalDate day1 = LocalDate.of(2026, 10, 1);
        LocalDate day2 = LocalDate.of(2026, 10, 3);
        Note noteDay1 = new Note(course, "Day 1 content", day1);
        Note noteDay2 = new Note(course, "Day 2 content", day2);

        when(noteRepository.findDirtyNotes(USER_ID, false)).thenReturn(List.of(noteDay1, noteDay2));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ProcessListener listener = org.mockito.Mockito.mock(ProcessListener.class);

        // when
        service.processNotes(USER_ID, listener);

        // then
        InOrder inOrder = inOrder(listener);
        inOrder.verify(listener).onDateStarted(day1, 1, 2);
        inOrder.verify(listener).onDateStarted(day2, 2, 2);
    }

    // --- Deduplication & Enrichment Tests (012-ai-extraction-dedup) ---

    @Test
    @DisplayName("US1: Restating an existing open task creates zero new tasks and leaves existing task unchanged")
    void processNotes_restatingExistingOpenTask_createsZeroTasksAndLeavesExistingUnchanged() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Task existingTask = new Task(course, "Read chapter 4");
        UUID taskId = UUID.randomUUID();
        ReflectionTestUtils.setField(existingTask, "id", taskId);
        existingTask.setDescription("Initial description");
        existingTask.setScheduledDate(LocalDate.of(2026, 10, 5));
        existingTask.setDuration(Duration.ofMinutes(45));

        // Note repeats the task without new date/duration info, extracted as a new task candidate with same title
        StudyPlannerEngine.ExtractedTask candidateTask = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "Read chapter 4", "Rushed read chapter 4 description", null, null);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(candidateTask), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(existingTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isZero();
        assertThat(summary.getTasksPromoted()).isZero();
        assertThat(existingTask.getTitle()).isEqualTo("Read chapter 4");
        assertThat(existingTask.getDescription()).isEqualTo("Initial description");
        assertThat(existingTask.getScheduledDate()).isEqualTo(LocalDate.of(2026, 10, 5));
        assertThat(existingTask.getDuration()).isEqualTo(Duration.ofMinutes(45));

        ArgumentCaptor<List<Task>> taskCaptor = ArgumentCaptor.forClass(List.class);
        verify(taskRepository).saveAll(taskCaptor.capture());
        List<Task> savedTasks = taskCaptor.getValue();
        // Zero new tasks inserted
        assertThat(savedTasks.stream().filter(t -> t.getId() == null)).isEmpty();
    }

    @Test
    @DisplayName("US1: Rephrased review task for same course and quiz creates zero new tasks and leaves existing task unchanged")
    void processNotes_rephrasedTaskForSameQuiz_createsZeroTasksAndLeavesExistingUnchanged() {
        // given
        Course course = courseWithId(1L, "GE Elective 1");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Task existingTask = new Task(course, "Review last lesson for quiz");
        UUID taskId = UUID.randomUUID();
        ReflectionTestUtils.setField(existingTask, "id", taskId);
        existingTask.setScheduledDate(LocalDate.of(2026, 10, 22));

        // Note LLM outputs reworded task title: "Review for GE Elective 1 quiz"
        StudyPlannerEngine.ExtractedTask candidateTask = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "Review for GE Elective 1 quiz", "Prepare for the quiz tomorrow", LocalDate.of(2026, 10, 22), null);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(candidateTask), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(existingTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isZero();
        assertThat(summary.getTasksPromoted()).isZero();
        assertThat(existingTask.getTitle()).isEqualTo("Review last lesson for quiz");
    }

    @Test
    @DisplayName("US1: Restating an upcoming academic event creates zero new events")
    void processNotes_restatingExistingEvent_createsZeroEvents() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        LocalDateTime deadline = LocalDateTime.of(2026, 10, 30, 10, 0);
        AcademicEvent existingEvent = new AcademicEvent(course, note, "Calculus Midterm Exam", "Coverage ch 1-4", deadline);
        ReflectionTestUtils.setField(existingEvent, "id", UUID.randomUUID());

        // Extracted candidate with exact same event title and deadline
        StudyPlannerEngine.ExtractedEvent candidateEvent = new StudyPlannerEngine.ExtractedEvent(
                "n1", noteId, "Calculus Midterm Exam", "Midterm exam in 2 weeks", deadline);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(), List.of(candidateEvent), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(existingEvent));
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getEventsCreated()).isZero();
        ArgumentCaptor<List<AcademicEvent>> eventCaptor = ArgumentCaptor.forClass(List.class);
        verify(academicEventRepository).saveAll(eventCaptor.capture());
        List<AcademicEvent> savedEvents = eventCaptor.getValue();
        assertThat(savedEvents.stream().filter(e -> e.getId() == null)).isEmpty();
    }

    @Test
    @DisplayName("US1: Restating an existing academic context fact creates zero new contexts")
    void processNotes_restatingExistingContext_createsZeroContexts() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        AcademicContext existingContext = new AcademicContext(course, note, "Student finds recursion difficult");
        ReflectionTestUtils.setField(existingContext, "id", UUID.randomUUID());

        StudyPlannerEngine.ExtractedContext candidateContext = new StudyPlannerEngine.ExtractedContext(
                "n1", noteId, "Student finds recursion difficult");

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(), List.of(), List.of(candidateContext));

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of(existingContext));
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getContextsCreated()).isZero();
        ArgumentCaptor<List<AcademicContext>> contextCaptor = ArgumentCaptor.forClass(List.class);
        verify(academicContextRepository).saveAll(contextCaptor.capture());
        List<AcademicContext> savedContexts = contextCaptor.getValue();
        assertThat(savedContexts.stream().filter(c -> c.getId() == null)).isEmpty();
    }

    @Test
    @DisplayName("US1: Multiple dirty notes in batch containing identical items deduplicate intra-batch")
    void processNotes_intraBatchDuplicates_extractsAtMostOnce() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note1 = noteWithCourse(course);
        UUID note1Id = UUID.randomUUID();
        ReflectionTestUtils.setField(note1, "id", note1Id);

        Note note2 = noteWithCourse(course);
        UUID note2Id = UUID.randomUUID();
        ReflectionTestUtils.setField(note2, "id", note2Id);

        StudyPlannerEngine.ExtractedTask task1 = new StudyPlannerEngine.ExtractedTask(
                "n1", null, note1Id, "Finish homework 1", "Homework 1 details", null, null);
        StudyPlannerEngine.ExtractedTask task2 = new StudyPlannerEngine.ExtractedTask(
                "n2", null, note2Id, "finish homework 1 ", "Homework 1 again", null, null);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(task1, task2), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note1, note2));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isEqualTo(1);
    }

    @Test
    @DisplayName("US2: Existing backlog task updates scheduledDate and duration when new info is present")
    void processNotes_backlogTaskWithNewInfo_updatesDateAndDurationKeepingTitle() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Task backlogTask = new Task(course, "Work on term paper");
        UUID taskId = UUID.randomUUID();
        ReflectionTestUtils.setField(backlogTask, "id", taskId);
        backlogTask.setDescription("Original student description");

        LocalDate newDate = LocalDate.of(2026, 10, 15);
        StudyPlannerEngine.ExtractedTask candidateTask = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "Work on term paper", "term paper due next Tuesday", newDate, 60);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(candidateTask), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(backlogTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isZero();
        assertThat(summary.getTasksPromoted()).isEqualTo(1);
        assertThat(backlogTask.getTitle()).isEqualTo("Work on term paper");
        assertThat(backlogTask.getDescription()).isEqualTo("Original student description");
        assertThat(backlogTask.getScheduledDate()).isEqualTo(newDate);
        assertThat(backlogTask.getDuration()).isEqualTo(Duration.ofMinutes(60));
    }

    @Test
    @DisplayName("US2: Existing scheduled task retains date and duration when restated note omits them")
    void processNotes_scheduledTaskRestatedWithoutDate_preservesExistingDateAndDuration() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Task scheduledTask = new Task(course, "Review discrete math notes");
        UUID taskId = UUID.randomUUID();
        ReflectionTestUtils.setField(scheduledTask, "id", taskId);
        LocalDate existingDate = LocalDate.of(2026, 10, 8);
        Duration existingDuration = Duration.ofMinutes(30);
        scheduledTask.setScheduledDate(existingDate);
        scheduledTask.setDuration(existingDuration);

        // Candidate extracted with null scheduledDate and null duration
        StudyPlannerEngine.ExtractedTask candidateTask = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "Review discrete math notes", "just reviewing notes", null, null);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(candidateTask), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(scheduledTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isZero();
        assertThat(summary.getTasksPromoted()).isZero();
        assertThat(scheduledTask.getScheduledDate()).isEqualTo(existingDate);
        assertThat(scheduledTask.getDuration()).isEqualTo(existingDuration);
    }

    @Test
    @DisplayName("US2: Existing event updates deadline when note states a new explicit deadline")
    void processNotes_existingEventWithChangedDeadline_updatesDeadlineWithoutDuplicate() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        LocalDateTime oldDeadline = LocalDateTime.of(2026, 10, 20, 9, 0);
        AcademicEvent existingEvent = new AcademicEvent(course, note, "Physics Lab Report", "Lab report due", oldDeadline);
        ReflectionTestUtils.setField(existingEvent, "id", UUID.randomUUID());

        LocalDateTime newDeadline = LocalDateTime.of(2026, 10, 25, 17, 0);
        StudyPlannerEngine.ExtractedEvent candidateEvent = new StudyPlannerEngine.ExtractedEvent(
                "n1", noteId, "Physics Lab Report", "moved to friday 5pm", newDeadline);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(), List.of(candidateEvent), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(existingEvent));
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getEventsCreated()).isZero();
        assertThat(existingEvent.getDeadline()).isEqualTo(newDeadline);
    }

    @Test
    @DisplayName("US3: Manually created open task is not duplicated by dirty note")
    void processNotes_manualTaskRestated_notDuplicated() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        // Manually created task: origin is null or USER, note is null
        Task manualTask = new Task(course, "Review linked lists");
        UUID manualTaskId = UUID.randomUUID();
        ReflectionTestUtils.setField(manualTask, "id", manualTaskId);
        manualTask.setNote(null);

        StudyPlannerEngine.ExtractedTask candidateTask = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "Review linked lists", "practice linked lists", null, null);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(candidateTask), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(manualTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isZero();
        assertThat(summary.getTasksPromoted()).isZero();
    }

    @Test
    @DisplayName("US3: Manually created academic event is not duplicated by dirty note")
    void processNotes_manualEventRestated_notDuplicated() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        LocalDateTime deadline = LocalDateTime.of(2026, 11, 1, 23, 59);
        AcademicEvent manualEvent = new AcademicEvent(course, null, "Project Milestone 1", "Manual event", deadline);
        ReflectionTestUtils.setField(manualEvent, "id", UUID.randomUUID());

        StudyPlannerEngine.ExtractedEvent candidateEvent = new StudyPlannerEngine.ExtractedEvent(
                "n1", noteId, "Project Milestone 1", "Submit milestone 1", deadline);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(), List.of(candidateEvent), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of(manualEvent));
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getEventsCreated()).isZero();
    }

    @Test
    @DisplayName("processNotes reports accurate tasksCreated and tasksPromoted counts in ProcessSummaryResponse")
    void processNotes_withNewAndPromotedTasks_reportsAccurateSummaryCounts() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Task existingTask1 = new Task(course, "Finish Assignment 1");
        ReflectionTestUtils.setField(existingTask1, "id", UUID.randomUUID());
        existingTask1.setScheduledDate(LocalDate.of(2026, 10, 1));

        Task existingTask2 = new Task(course, "Read Chapter 5");
        ReflectionTestUtils.setField(existingTask2, "id", UUID.randomUUID());

        Task existingTask3 = new Task(course, "Untouched task");
        ReflectionTestUtils.setField(existingTask3, "id", UUID.randomUUID());

        // Task 1: new scheduled date -> promoted
        LocalDate newDate = LocalDate.of(2026, 10, 5);
        StudyPlannerEngine.ExtractedTask candidate1 = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "Finish Assignment 1", "desc", newDate, null);

        // Task 2: new duration -> promoted
        StudyPlannerEngine.ExtractedTask candidate2 = new StudyPlannerEngine.ExtractedTask(
                "n2", null, noteId, "Read Chapter 5", "desc", null, 45);

        // Task 3: no changes -> not promoted
        StudyPlannerEngine.ExtractedTask candidate3 = new StudyPlannerEngine.ExtractedTask(
                "n3", null, noteId, "Untouched task", "desc", null, null);

        // Task 4: brand new task -> created
        StudyPlannerEngine.ExtractedTask candidate4 = new StudyPlannerEngine.ExtractedTask(
                "n4", null, noteId, "Brand New Task", "desc", LocalDate.of(2026, 10, 10), 60);

        StudyPlannerEngine.ExtractedData extracted = new StudyPlannerEngine.ExtractedData(
                List.of(candidate1, candidate2, candidate3, candidate4), List.of(), List.of());

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE), eq(false))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull(), eq(false), isNull(), isNull(), isNull()))
                .thenReturn(List.of(existingTask1, existingTask2, existingTask3));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any(), eq(false), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull(), eq(false))).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any())).thenReturn(extracted);
        when(taskRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        // when
        ProcessSummaryResponse summary = service.processNotes(DATE, USER_ID);

        // then
        assertThat(summary.getTasksCreated()).isEqualTo(1);
        assertThat(summary.getTasksPromoted()).isEqualTo(2);
    }

    // --- helpers ---

    private Course courseWithId(long id, String name) {
        Course c = new Course(name, name + " desc");
        ReflectionTestUtils.setField(c, "id", id);
        return c;
    }

    private Note noteWithCourse(Course course) {
        return new Note(course, "Some content");
    }
}
