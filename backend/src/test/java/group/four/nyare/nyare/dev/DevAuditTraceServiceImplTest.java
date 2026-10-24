package group.four.nyare.nyare.dev;

import group.four.nyare.nyare.ai.event.AuditCategory;
import group.four.nyare.nyare.ai.event.AuditSeverity;
import group.four.nyare.nyare.ai.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.event.LifecycleState;
import group.four.nyare.nyare.ai.event.MutationAction;
import group.four.nyare.nyare.ai.event.TraceKind;
import group.four.nyare.nyare.ai.event.TriggerSource;
import group.four.nyare.nyare.dev.dto.AuditTraceEventDto;
import group.four.nyare.nyare.dev.dto.DevDashboardViewModel;
import group.four.nyare.nyare.dev.dto.TraceNodeDto;
import group.four.nyare.nyare.dev.dto.TraceNodeStubDto;
import group.four.nyare.nyare.dev.service.impl.DevAuditTraceServiceImpl;
import group.four.nyare.nyare.dev.service.impl.DevTraceWalker;
import group.four.nyare.nyare.dev.sink.DevAuditTraceSink;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevAuditTraceServiceImplTest {

    @Mock
    private DevAuditTraceSink sink;

    @Mock
    private DevTraceWalker walker;

    @Mock
    private CourseRepository courseRepository;

    private DevAuditTraceServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DevAuditTraceServiceImpl(sink, walker, courseRepository);
    }

    private AuditTraceEvent lifecycleEvent(LifecycleState state, UUID runId,
                                           String changeSummary, Long durationMs) {
        return new AuditTraceEvent(
                UUID.randomUUID(), Instant.now(), AuditCategory.LIFECYCLE, AuditSeverity.INFO,
                "lifecycle", 1L, "student_jane", TriggerSource.WEB_SESSION, null,
                TraceKind.lifecycle, runId.toString(), changeSummary, runId,
                null, null, null, null, null, null, null,
                durationMs, state, null, null);
    }

    @Test
    void getFeed_withCategoryFilter_returnsMatchingEventsNewestFirst() {
        // given
        AuditTraceEvent lifecycle = lifecycleEvent(
                LifecycleState.COMPLETED, UUID.randomUUID(), null, 1000L);
        AuditTraceEvent planning = new AuditTraceEvent(
                UUID.randomUUID(), Instant.now(), AuditCategory.TASK_PLANNING, AuditSeverity.INFO,
                "planning", null, null, null, null,
                TraceKind.note, UUID.randomUUID().toString(), null, null,
                UUID.randomUUID(), null, null, null, null, "rationale", null, null, null, null, null);
        when(sink.snapshot()).thenReturn(List.of(lifecycle, planning));

        // when
        List<AuditTraceEventDto> feed = service.getFeed(AuditCategory.LIFECYCLE, null, 500);

        // then
        assertThat(feed).hasSize(1);
        assertThat(feed.get(0).category()).isEqualTo(AuditCategory.LIFECYCLE);
        assertThat(feed.get(0).id()).isEqualTo(lifecycle.id());
    }

    @Test
    void getDashboardView_withRetainedEvents_returnsModelAttributes() {
        // given
        AuditTraceEvent event = lifecycleEvent(LifecycleState.STARTED, UUID.randomUUID(), null, null);
        when(sink.snapshot()).thenReturn(List.of(event));
        User user = new User("student_jane");
        Course course = new Course("Introduction to Computer Science", "CS101 course", user);
        ReflectionTestUtils.setField(course, "id", 10L);
        course.setColor("#0EA5E9");
        when(courseRepository.findAll()).thenReturn(List.of(course));

        // when
        DevDashboardViewModel view = service.getDashboardView();

        // then
        assertThat(view.totalRetained()).isEqualTo(1);
        assertThat(view.events()).hasSize(1);
        assertThat(view.courses()).containsExactly(
                new group.four.nyare.nyare.dev.dto.CourseTraceSummaryDto(
                        10L, "Introduction to Computer Science", "#0EA5E9"));
        assertThat(view.categories()).hasSize(AuditCategory.values().length);
        assertThat(view.severities()).containsExactly(AuditSeverity.values());
    }

    @Test
    void resolveNode_withStoredKind_delegatesToWalker() {
        // given
        TraceNodeDto expected = new TraceNodeDto(
                TraceKind.note, "id", "Lecture 4", "PROCESSED",
                false, null, Map.of(), List.of());
        when(walker.resolve(TraceKind.note, "id")).thenReturn(expected);

        // when & then
        assertThat(service.resolveNode("note", "id")).isSameAs(expected);
    }

    @Test
    void resolveNode_withLifecycleKind_synthesizesNodeFromRunEvents() {
        // given: the buffer iterates newest-first, COMPLETED ahead of STARTED
        UUID runId = UUID.randomUUID();
        UUID noteA = UUID.randomUUID();
        UUID noteB = UUID.randomUUID();
        AuditTraceEvent completed = lifecycleEvent(LifecycleState.COMPLETED, runId, null, 1234L);
        AuditTraceEvent started = lifecycleEvent(
                LifecycleState.STARTED, runId, "Target notes: " + noteA + ", " + noteB, null);
        when(sink.snapshot()).thenReturn(List.of(completed, started));
        when(walker.resolve(TraceKind.note, noteA.toString()))
                .thenReturn(new TraceNodeDto(TraceKind.note, noteA.toString(), "Lecture 4",
                        "PROCESSED", false, null, Map.of(), List.of()));
        when(walker.resolve(TraceKind.note, noteB.toString()))
                .thenThrow(new ResourceNotFoundException("not found"));

        // when
        TraceNodeDto node = service.resolveNode("lifecycle", runId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.lifecycle);
        assertThat(node.id()).isEqualTo(runId.toString());
        assertThat(node.status()).isEqualTo("COMPLETED");
        assertThat(node.attributes())
                .containsEntry("runId", runId.toString())
                .containsEntry("state", "COMPLETED")
                .containsEntry("durationMs", 1234L)
                .containsEntry("targetNoteIds", List.of(noteA.toString(), noteB.toString()))
                .containsEntry("eventsRetained", 2);
        assertThat(node.relations()).hasSize(1);
        var sourceNotes = node.relations().get(0);
        assertThat(sourceNotes.groupName()).isEqualTo("Source Notes");
        assertThat(sourceNotes.targetKind()).isEqualTo(TraceKind.note);
        assertThat(sourceNotes.totalCount()).isEqualTo(2);
        assertThat(sourceNotes.items()).extracting(TraceNodeStubDto::id)
                .containsExactly(noteA.toString(), noteB.toString());
        assertThat(sourceNotes.items().get(0).isExact()).isTrue();
        assertThat(sourceNotes.items().get(0).title()).isEqualTo("Lecture 4");
        assertThat(sourceNotes.items().get(1).isExact()).isFalse();
    }

    @Test
    void resolveNode_withUnknownKind_throwsBadRequestException() {
        // when & then
        assertThatThrownBy(() -> service.resolveNode("bogus", "1"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("bogus");
    }

    @Test
    void resolveNode_withUnknownRunId_throwsResourceNotFoundException() {
        // given
        when(sink.snapshot()).thenReturn(List.of());

        // when & then
        assertThatThrownBy(() -> service.resolveNode("lifecycle", UUID.randomUUID().toString()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resolveReferences_withMutationAudit_returnsExactStubsWithoutDuplicates() {
        // given: a DATA_MUTATION event cites the task twice (entityId and taskId)
        UUID taskId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        AuditTraceEvent event = new AuditTraceEvent(
                UUID.randomUUID(), Instant.now(), AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                "Task created: 'Read Chapter 3'", 1L, "student_jane", TriggerSource.WEB_SESSION,
                MutationAction.CREATE, TraceKind.task, taskId.toString(), "summary", null,
                noteId, taskId, null, null, null, null, null, null, null, null, null);
        when(walker.resolve(TraceKind.task, taskId.toString()))
                .thenReturn(new TraceNodeDto(TraceKind.task, taskId.toString(), "Read Chapter 3",
                        "TODO", false, null, Map.of(), List.of()));
        when(walker.resolve(TraceKind.note, noteId.toString()))
                .thenReturn(new TraceNodeDto(TraceKind.note, noteId.toString(), "Lecture 4",
                        "PROCESSED", false, null, Map.of(), List.of()));

        // when
        List<TraceNodeStubDto> refs = service.resolveReferences(AuditTraceEventDto.from(event));

        // then
        assertThat(refs).hasSize(2);
        assertThat(refs.get(0).kind()).isEqualTo(TraceKind.task);
        assertThat(refs.get(0).title()).isEqualTo("Read Chapter 3");
        assertThat(refs.get(0).isExact()).isTrue();
        assertThat(refs.get(1).kind()).isEqualTo(TraceKind.note);
    }

    @Test
    void resolveReferences_withTaskPlanningAudit_addsInferredTitleMatch() {
        // given: a TASK_PLANNING audit names a title, never a task id
        UUID noteId = UUID.randomUUID();
        AuditTraceEvent event = new AuditTraceEvent(
                UUID.randomUUID(), Instant.now(), AuditCategory.TASK_PLANNING, AuditSeverity.INFO,
                "[AI AUDIT - TASK PLANNING] NoteId: " + noteId
                        + " | Title: \"Read Chapter 3\" | Scheduled: 2026-10-25"
                        + " | Duration: 45 | Rationale: Quiz on Monday",
                null, null, null, null, TraceKind.note, noteId.toString(), null, null,
                noteId, null, null, null, null, "Quiz on Monday", null, null, null, null, null);
        TraceNodeStubDto inferred = new TraceNodeStubDto(
                TraceKind.task, UUID.randomUUID().toString(), "Read Chapter 3",
                "Scheduled: 2026-10-25 | 45m", false);
        when(walker.findTaskStubByTitle(noteId, "Read Chapter 3")).thenReturn(Optional.of(inferred));
        when(walker.resolve(TraceKind.note, noteId.toString()))
                .thenThrow(new ResourceNotFoundException("not found"));

        // when
        List<TraceNodeStubDto> refs = service.resolveReferences(AuditTraceEventDto.from(event));

        // then
        assertThat(refs).hasSize(2);
        assertThat(refs.get(0).kind()).isEqualTo(TraceKind.note);
        assertThat(refs.get(0).title()).startsWith("[missing]");
        assertThat(refs.get(1)).isEqualTo(inferred);
        assertThat(refs.get(1).isExact()).isFalse();
    }

    @Test
    void resolveReferences_withPromptRefEntityId_returnsUnresolvedStub() {
        // given: entityId "n2" is a prompt ref, not a record identifier
        AuditTraceEvent event = new AuditTraceEvent(
                UUID.randomUUID(), Instant.now(), AuditCategory.UNRELATED_INFO, AuditSeverity.WARN,
                "[AI AUDIT - UNRELATED INFO] NoteId: n2 | Part: \"text\" | Reason: personal",
                null, null, null, null, TraceKind.note, "n2", null, null,
                null, null, null, null, null, "personal", "text", null, null, null, null);

        // when
        List<TraceNodeStubDto> refs = service.resolveReferences(AuditTraceEventDto.from(event));

        // then
        assertThat(refs).hasSize(1);
        assertThat(refs.get(0).id()).isEqualTo("n2");
        assertThat(refs.get(0).isExact()).isFalse();
        verifyNoInteractions(walker);
    }
}
