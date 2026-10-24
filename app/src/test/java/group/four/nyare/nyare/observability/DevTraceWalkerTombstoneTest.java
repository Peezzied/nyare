package group.four.nyare.nyare.observability;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.MutationAction;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.ai.observability.event.TriggerSource;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.service.impl.DevTraceWalker;
import group.four.nyare.nyare.observability.sink.DevAuditTraceSink;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevTraceWalkerTombstoneTest {

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
    private ImageRepository imageRepository;

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private DevAuditTraceSink traceSink;

    private DevTraceWalker walker;

    @BeforeEach
    void setUp() {
        walker = new DevTraceWalker(
                courseRepository,
                noteRepository,
                taskRepository,
                academicEventRepository,
                academicContextRepository,
                imageRepository,
                scheduleRepository,
                traceSink);
    }

    private AuditTraceEvent mutationEvent(
            MutationAction action, TraceKind kind, String entityId,
            String changeSummary, Instant timestamp) {
        return new AuditTraceEvent(
                UUID.randomUUID(), timestamp, AuditCategory.DATA_MUTATION, AuditSeverity.INFO,
                changeSummary, 1L, "student_jane", TriggerSource.WEB_SESSION, action,
                kind, entityId, changeSummary, null,
                null, null, null, null, null, null, null,
                null, null, null, null);
    }

    @Test
    void resolve_withDeletedTaskId_returnsTombstoneNode() {
        // given
        UUID taskId = UUID.randomUUID();
        Instant deletedAt = Instant.parse("2026-10-24T10:16:00Z");
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());
        when(traceSink.snapshot()).thenReturn(List.of(
                mutationEvent(MutationAction.DELETE, TraceKind.task, taskId.toString(),
                        "Task deleted: 'Read Chapter 3'", deletedAt)));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.task, taskId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.task);
        assertThat(node.id()).isEqualTo(taskId.toString());
        assertThat(node.displayTitle()).isEqualTo("[Deleted] Read Chapter 3");
        assertThat(node.status()).isEqualTo("DELETED");
        assertThat(node.isDeleted()).isTrue();
        assertThat(node.deletedAt()).isEqualTo(deletedAt);
        assertThat(node.attributes())
                .containsEntry("tombstoneNote", "Record was deleted during session")
                .containsEntry("deletedBy", "student_jane (ID: 1)");
        assertThat(node.relations()).isEmpty();
    }

    @Test
    void resolve_withDeletedCourseIdAndUnparseableSummary_fallsBackToKindIdTitle() {
        // given
        Instant deletedAt = Instant.parse("2026-10-24T10:16:00Z");
        when(courseRepository.findById(10L)).thenReturn(Optional.empty());
        when(traceSink.snapshot()).thenReturn(List.of(
                mutationEvent(MutationAction.DELETE, TraceKind.course, "10",
                        "Course deleted", deletedAt)));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.course, "10");

        // then
        assertThat(node.isDeleted()).isTrue();
        assertThat(node.displayTitle()).isEqualTo("[Deleted] course 10");
        assertThat(node.deletedAt()).isEqualTo(deletedAt);
    }

    @Test
    void resolve_withArchiveEventOnly_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findById(10L)).thenReturn(Optional.empty());
        when(traceSink.snapshot()).thenReturn(List.of(
                mutationEvent(MutationAction.ARCHIVE, TraceKind.course, "10",
                        "Course archived: 'CS101'", Instant.now())));

        // when & then
        assertThatThrownBy(() -> walker.resolve(TraceKind.course, "10"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("10");
    }

    @Test
    void resolve_withDeleteEventForDifferentKind_throwsResourceNotFoundException() {
        // given
        when(courseRepository.findById(5L)).thenReturn(Optional.empty());
        when(traceSink.snapshot()).thenReturn(List.of(
                mutationEvent(MutationAction.DELETE, TraceKind.schedule, "5",
                        "Schedule deleted: 'CS101 MONDAY 09:00-10:30'", Instant.now())));

        // when & then
        assertThatThrownBy(() -> walker.resolve(TraceKind.course, "5"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("5");
    }

    @Test
    void resolve_withDeleteEventForDifferentId_throwsResourceNotFoundException() {
        // given
        UUID taskId = UUID.randomUUID();
        when(taskRepository.findById(taskId)).thenReturn(Optional.empty());
        when(traceSink.snapshot()).thenReturn(List.of(
                mutationEvent(MutationAction.DELETE, TraceKind.task, UUID.randomUUID().toString(),
                        "Task deleted: 'Other task'", Instant.now())));

        // when & then
        assertThatThrownBy(() -> walker.resolve(TraceKind.task, taskId.toString()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(taskId.toString());
    }
}
