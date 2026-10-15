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
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of());

        assertThatThrownBy(() -> service.processNotes(USER_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No journal notes found to process");

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of());

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
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of());

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
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of(note1, note2));

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
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of(noteDay2, noteDay1));

        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());

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

        // Verify chronological execution order and cleanup
        InOrder inOrder = inOrder(studyPlannerEngine, taskRepository, academicEventRepository, academicContextRepository);
        inOrder.verify(taskRepository).deleteByNoteInAndStatusNot(List.of(noteDay1), TaskStatus.COMPLETED);
        inOrder.verify(academicEventRepository).deleteByNoteIn(List.of(noteDay1));
        inOrder.verify(academicContextRepository).deleteByNoteIn(List.of(noteDay1));
        inOrder.verify(studyPlannerEngine).process(eq(List.of(noteDay1)), any(), any(), any(), any(), any());

        inOrder.verify(taskRepository).deleteByNoteInAndStatusNot(List.of(noteDay2), TaskStatus.COMPLETED);
        inOrder.verify(academicEventRepository).deleteByNoteIn(List.of(noteDay2));
        inOrder.verify(academicContextRepository).deleteByNoteIn(List.of(noteDay2));
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
    @DisplayName("processNotes calls user-scoped task and schedule queries")
    void processNotes_callsUserScopedTaskAndScheduleQueries() {
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(taskRepository).findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull());
        verify(scheduleRepository).findAllFiltered(eq(USER_ID), isNull());
    }

    @Test
    @DisplayName("processNotes scopes context query to dirty-note courses only")
    void processNotes_scopesContextToDirtyCourses() {
        Course c1 = courseWithId(1L, "CS101");
        Course c2 = courseWithId(2L, "CS202");
        Note n1 = noteWithCourse(c1);
        Note n2 = noteWithCourse(c2);
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(n1, n2));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(taskRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicEventRepository.saveAll(anyList())).thenReturn(List.of());
        when(academicContextRepository.saveAll(anyList())).thenReturn(List.of());
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ArgumentCaptor<LocalDateTime> nowCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), nowCaptor.capture())).thenReturn(List.of());

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
        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of(existingTask));
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L);
        ReflectionTestUtils.setField(image, "id", imageId);

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(imageAiProcessor.describeImage(any(), any())).thenReturn("Binary tree diagram");
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L);
        ReflectionTestUtils.setField(image, "id", imageId);

        String longDescription = "Important fact. ".repeat(50);

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(imageAiProcessor.describeImage(any(), any())).thenReturn(longDescription);
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L);
        ReflectionTestUtils.setField(image, "id", imageId);
        image.setDescription("Existing description");

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE, USER_ID);

        verify(imageAiProcessor, never()).describeImage(any(), any());
        verify(imageRepository, never()).saveAll(anyList());
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

        when(noteRepository.findDirtyNotes(eq(USER_ID), eq(DATE))).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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
    @DisplayName("processNotes cancelled before first date throws CancellationException and skips engine")
    void processNotes_listenerCancelledBeforeFirstDate_throwsCancellationAndSkipsEngine() {
        // given
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of(note));

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
        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of(note));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());

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

        when(noteRepository.findDirtyNotes(USER_ID)).thenReturn(List.of(noteDay1, noteDay2));
        when(taskRepository.findAllFiltered(eq(USER_ID), isNull(), isNull(), isNull())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(eq(USER_ID), isNull(), eq(true), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(anySet())).thenReturn(List.of());
        when(scheduleRepository.findAllFiltered(eq(USER_ID), isNull())).thenReturn(List.of());
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
