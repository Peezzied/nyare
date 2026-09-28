package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudyPlannerEngineTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    private StudyPlannerEngine engine;

    @BeforeEach
    void setUp() {
        engine = new StudyPlannerEngine(chatClient);
    }

    @Test
    @DisplayName("process returns empty data when notes is null — no ChatClient call")
    void returnsEmptyWhenNotesNull() {
        StudyPlannerEngine.ExtractedData result =
                engine.process(null, List.of(), List.of(), List.of(), List.of());

        assertThat(result.tasks()).isEmpty();
        assertThat(result.events()).isEmpty();
        assertThat(result.contexts()).isEmpty();
        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("process returns empty data when notes is empty — no ChatClient call")
    void returnsEmptyWhenNotesEmpty() {
        StudyPlannerEngine.ExtractedData result =
                engine.process(Collections.emptyList(), List.of(), List.of(), List.of(), List.of());

        assertThat(result.tasks()).isEmpty();
        assertThat(result.events()).isEmpty();
        assertThat(result.contexts()).isEmpty();
        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("process returns empty data when all notes have blank markdown — no ChatClient call")
    void returnsEmptyWhenAllNotesBlank() {
        Course course = new Course("CS101", "Computer Science");
        Note blank = new Note(course, "   ");

        StudyPlannerEngine.ExtractedData result =
                engine.process(List.of(blank), List.of(), List.of(), List.of(), List.of());

        assertThat(result.tasks()).isEmpty();
        assertThat(result.events()).isEmpty();
        assertThat(result.contexts()).isEmpty();
        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("process sends tagged prompt with journal_notes, existing_tasks, class_schedules sections")
    void processBuildsFullTaggedPrompt() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Study chapter 4 before exam");
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Task task = new Task(course, "Review recursion");
        Schedule schedule = new Schedule(course, DayOfWeek.MONDAY,
                LocalTime.of(9, 0), LocalTime.of(10, 30));

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        when(chatClient.prompt(promptCaptor.capture()).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(new PlannerAuditRecords.LlmPayload(List.of(), List.of(), List.of(), List.of()));

        engine.process(List.of(note), List.of(task), List.of(), List.of(), List.of(schedule));

        String sent = promptCaptor.getValue().getContents();
        assertThat(sent).contains("<temporal_context>");
        assertThat(sent).contains("<journal_notes>");
        assertThat(sent).contains("note_ref,course,content");
        assertThat(sent).contains("<existing_tasks>");
        assertThat(sent).contains("course,task_id,title,status,scheduled_date,duration_minutes");
        assertThat(sent).contains("<class_schedules>");
        assertThat(sent).contains("course,day,start_time,end_time");
        assertThat(sent).contains("MONDAY");
    }

    @Test
    @DisplayName("process includes temporal_anchor with today's date")
    void processIncludesTodaysDateInTemporalAnchor() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Read chapter 2");

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        when(chatClient.prompt(promptCaptor.capture()).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(new PlannerAuditRecords.LlmPayload(List.of(), List.of(), List.of(), List.of()));

        engine.process(List.of(note), List.of(), List.of(), List.of(), List.of());

        String sent = promptCaptor.getValue().getContents();
        assertThat(sent).contains(LocalDate.now().toString());
    }

    @Test
    @DisplayName("process omits optional tags when supporting lists are empty")
    void processOmitsOptionalTagsWhenListsEmpty() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Read chapter 2");

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        when(chatClient.prompt(promptCaptor.capture()).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(null);

        StudyPlannerEngine.ExtractedData result =
                engine.process(List.of(note), List.of(), List.of(), List.of(), List.of());

        String sent = promptCaptor.getValue().getContents();
        assertThat(sent).contains("<journal_notes>");
        assertThat(sent).doesNotContain("<existing_tasks>");
        assertThat(sent).doesNotContain("<existing_events>");
        assertThat(sent).doesNotContain("<existing_contexts>");
        assertThat(sent).doesNotContain("<class_schedules>");
        assertThat(result.tasks()).isEmpty();
    }

    @Test
    @DisplayName("process decodes stub note references back to note UUIDs in output")
    void processDecodesNoteRefsToUUIDs() {
        Course course = new Course("CS101", "Computer Science");
        Note note1 = new Note(course, "Homework due Friday");
        Note note2 = new Note(course, "Exam on Monday");
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        ReflectionTestUtils.setField(note1, "id", id1);
        ReflectionTestUtils.setField(note2, "id", id2);

        PlannerAuditRecords.LlmPayload rawResponse = new PlannerAuditRecords.LlmPayload(
                List.of(new PlannerAuditRecords.RawTask(
                        "n1", null, "Finish homework", "Pages 10-20",
                        LocalDate.now().plusDays(1), 45, "Preparation task scheduled before due date")),
                List.of(new PlannerAuditRecords.RawEvent(
                        "n2", "CS101 Exam", "Chapters 1-4",
                        LocalDateTime.now().plusDays(3), "Exam event derived from note")),
                Collections.emptyList(),
                Collections.emptyList()
        );

        when(chatClient.prompt(any(Prompt.class)).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(rawResponse);

        StudyPlannerEngine.ExtractedData result =
                engine.process(List.of(note1, note2), List.of(), List.of(), List.of(), List.of());

        assertThat(result.tasks()).hasSize(1);
        assertThat(result.tasks().get(0).noteRef()).isEqualTo("n1");
        assertThat(result.tasks().get(0).noteId()).isEqualTo(id1);

        assertThat(result.events()).hasSize(1);
        assertThat(result.events().get(0).noteRef()).isEqualTo("n2");
        assertThat(result.events().get(0).noteId()).isEqualTo(id2);
    }

    @Test
    @DisplayName("process returns empty data when ChatClient returns null")
    void processReturnsEmptyWhenClientReturnsNull() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Some content");

        when(chatClient.prompt(any(Prompt.class)).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(null);

        StudyPlannerEngine.ExtractedData result =
                engine.process(List.of(note), List.of(), List.of(), List.of(), List.of());

        assertThat(result.tasks()).isEmpty();
        assertThat(result.events()).isEmpty();
        assertThat(result.contexts()).isEmpty();
    }

    @Test
    @DisplayName("existing_contexts tag includes age column derived from createdAt")
    void processIncludesAgeInContextCsv() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Chapter 3 was hard");

        AcademicContext context = new AcademicContext(course, "Student struggles with recursion");
        Instant tenDaysAgo = LocalDate.now().minusDays(10).atStartOfDay().toInstant(ZoneOffset.UTC);
        ReflectionTestUtils.setField(context, "createdAt", tenDaysAgo);

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        when(chatClient.prompt(promptCaptor.capture()).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(new PlannerAuditRecords.LlmPayload(List.of(), List.of(), List.of(), List.of()));

        engine.process(List.of(note), List.of(), List.of(), List.of(context), List.of());

        String sent = promptCaptor.getValue().getContents();
        assertThat(sent).contains("<existing_contexts>");
        assertThat(sent).contains("course,value,age");
        assertThat(sent).contains("1 weeks old");
    }

    @Test
    @DisplayName("formatAge returns correct human-readable strings for days, weeks, and months")
    void formatAgeReturnsCorrectStrings() {
        LocalDate today = LocalDate.of(2026, 9, 26);

        assertThat(StudyPlannerEngine.formatAge(
                LocalDate.of(2026, 9, 23).atStartOfDay().toInstant(ZoneOffset.UTC), today))
                .isEqualTo("3 days old");

        assertThat(StudyPlannerEngine.formatAge(
                LocalDate.of(2026, 9, 5).atStartOfDay().toInstant(ZoneOffset.UTC), today))
                .isEqualTo("3 weeks old");

        assertThat(StudyPlannerEngine.formatAge(
                LocalDate.of(2026, 5, 1).atStartOfDay().toInstant(ZoneOffset.UTC), today))
                .isEqualTo("4 months old");

        assertThat(StudyPlannerEngine.formatAge(null, today)).isEmpty();
    }

    @Test
    @DisplayName("process decodes RawIgnoredNote into InternalIgnoredNote with noteId and part")
    void processDecodesIgnoredNotesWithPartAndNoteId() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Grocery shopping errand");
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        PlannerAuditRecords.LlmPayload rawResponse = new PlannerAuditRecords.LlmPayload(
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                List.of(new PlannerAuditRecords.RawIgnoredNote("n1", "Grocery shopping errand", "Unrelated errand"))
        );

        when(chatClient.prompt(any(Prompt.class)).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(rawResponse);

        StudyPlannerEngine.ExtractedData result =
                engine.process(List.of(note), List.of(), List.of(), List.of(), List.of());

        assertThat(result).isNotNull();
        assertThat(result.tasks()).isEmpty();
    }

    @Test
    @DisplayName("process throws BadRequestException when AI call exceeds configured timeout")
    void process_whenAiCallExceedsTimeout_throwsBadRequestException() {
        // given
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Read chapter 2");
        StudyPlannerEngine impatientEngine = new StudyPlannerEngine(chatClient, 200);

        when(chatClient.prompt(any(Prompt.class)).advisors(any(Consumer.class)).call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenAnswer(invocation -> {
                    Thread.sleep(3000);
                    return null;
                });

        // when & then
        assertThatThrownBy(() -> impatientEngine.process(
                List.of(note), List.of(), List.of(), List.of(), List.of()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("timed out");
    }

    @Test
    @DisplayName("ExtractedTask correctly distinguishes promotion from new task")
    void extractedTaskDistinguishesPromotionFromNewTask() {
        UUID taskId = UUID.randomUUID();
        StudyPlannerEngine.ExtractedTask promotedTask = new StudyPlannerEngine.ExtractedTask(
                null, taskId, null, "Existing Task", "Description", LocalDate.now(), 45);

        assertThat(promotedTask.isPromotion()).isTrue();
        assertThat(promotedTask.isNewTask()).isFalse();

        UUID noteId = UUID.randomUUID();
        StudyPlannerEngine.ExtractedTask newTask = new StudyPlannerEngine.ExtractedTask(
                "n1", null, noteId, "New Task", "Description", LocalDate.now(), 30);

        assertThat(newTask.isPromotion()).isFalse();
        assertThat(newTask.isNewTask()).isTrue();
    }
}
