package group.four.nyare.nyare.observability;

import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.dto.TraceNodeStubDto;
import group.four.nyare.nyare.observability.dto.TraceRelationGroupDto;
import group.four.nyare.nyare.observability.service.impl.DevTraceWalker;
import group.four.nyare.nyare.observability.sink.DevAuditTraceSink;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.model.enums.PlanCategory;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageMetadataView;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevTraceWalkerTest {

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

    private User user;
    private Course course;

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

        user = new User("student_jane");
        ReflectionTestUtils.setField(user, "id", 1L);
        course = new Course("Introduction to Computer Science", "CS101 course", user);
        ReflectionTestUtils.setField(course, "id", 10L);
    }

    @Test
    void resolve_withNoteId_returnsPopulatedNoteNode() {
        // given
        UUID noteId = UUID.randomUUID();
        Note note = new Note(course, "Lecture 4 Notes", "content", LocalDate.of(2026, 10, 24));
        ReflectionTestUtils.setField(note, "id", noteId);
        ReflectionTestUtils.setField(note, "createdAt", Instant.parse("2026-10-24T09:00:00Z"));
        ReflectionTestUtils.setField(note, "lastProcessedAt", Instant.parse("2026-10-24T10:00:00Z"));
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.note, noteId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.note);
        assertThat(node.id()).isEqualTo(noteId.toString());
        assertThat(node.displayTitle()).isEqualTo("Lecture 4 Notes");
        assertThat(node.status()).isEqualTo("PROCESSED");
        assertThat(node.isDeleted()).isFalse();
        assertThat(node.deletedAt()).isNull();
        assertThat(node.attributes())
                .containsEntry("entryDate", LocalDate.of(2026, 10, 24))
                .containsEntry("courseId", 10L)
                .containsEntry("courseName", "Introduction to Computer Science");
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly(
                        "Owning Course", "Child Tasks", "Child Events",
                        "Context Facts", "Referenced Images");
    }

    @Test
    void resolve_withTaskId_returnsPopulatedTaskNode() {
        // given
        UUID taskId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Note note = new Note(course, "Lecture 4 Notes", "content", LocalDate.of(2026, 10, 24));
        ReflectionTestUtils.setField(note, "id", noteId);
        Task task = new Task(course, "Read Chapter 3", LocalDate.of(2026, 10, 25), Duration.ofMinutes(45));
        task.setNote(note);
        task.setStatus(TaskStatus.TODO);
        ReflectionTestUtils.setField(task, "id", taskId);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.task, taskId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.task);
        assertThat(node.id()).isEqualTo(taskId.toString());
        assertThat(node.displayTitle()).isEqualTo("Read Chapter 3");
        assertThat(node.status()).isEqualTo("TODO");
        assertThat(node.attributes())
                .containsEntry("scheduledDate", LocalDate.of(2026, 10, 25))
                .containsEntry("durationMinutes", 45L)
                .containsEntry("planCategory", PlanCategory.SCHEDULED.name())
                .containsEntry("noteId", noteId.toString())
                .containsEntry("courseId", 10L);
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Owning Course", "Source Note");
    }

    @Test
    void resolve_withEventId_returnsPopulatedEventNode() {
        // given
        UUID eventId = UUID.randomUUID();
        LocalDateTime deadline = LocalDateTime.now().plusDays(3);
        AcademicEvent event = new AcademicEvent(course, "Midterm Exam", deadline);
        ReflectionTestUtils.setField(event, "id", eventId);
        when(academicEventRepository.findById(eventId)).thenReturn(Optional.of(event));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.event, eventId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.event);
        assertThat(node.id()).isEqualTo(eventId.toString());
        assertThat(node.displayTitle()).isEqualTo("Midterm Exam");
        assertThat(node.attributes())
                .containsEntry("deadline", deadline)
                .containsEntry("courseId", 10L)
                .containsEntry("courseName", "Introduction to Computer Science");
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Owning Course", "Source Note");
    }

    @Test
    void resolve_withImageId_returnsMetadataWithoutBinaryContent() {
        // given
        UUID imageId = UUID.randomUUID();
        ImageMetadataView image = mock(ImageMetadataView.class);
        when(image.getId()).thenReturn(imageId);
        when(image.getContentType()).thenReturn("image/png");
        when(image.getFilename()).thenReturn("diagram.png");
        when(image.getSize()).thenReturn(3L);
        when(image.getDescription()).thenReturn("class diagram");
        when(imageRepository.findMetadataById(imageId)).thenReturn(Optional.of(image));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.image, imageId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.image);
        assertThat(node.id()).isEqualTo(imageId.toString());
        assertThat(node.displayTitle()).isEqualTo("diagram.png");
        assertThat(node.attributes())
                .containsEntry("contentType", "image/png")
                .containsEntry("filename", "diagram.png")
                .containsEntry("size", 3L)
                .containsEntry("description", "class diagram")
                .doesNotContainKey("data");
        assertThat(node.attributes().values()).noneMatch(byte[].class::isInstance);
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Referencing Notes");
        // The entity path would select the binary column; only the projection may run.
        verify(imageRepository, never()).findById(any());
    }

    @Test
    void resolve_withCourseId_returnsPopulatedCourseNode() {
        // given
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.course, "10");

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.course);
        assertThat(node.id()).isEqualTo("10");
        assertThat(node.displayTitle()).isEqualTo("Introduction to Computer Science");
        assertThat(node.status()).isEqualTo("ACTIVE");
        assertThat(node.attributes())
                .containsEntry("name", "Introduction to Computer Science")
                .containsEntry("description", "CS101 course");
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Schedules", "Notes", "Tasks", "Events", "Context Facts");
    }

    @Test
    void resolve_withScheduleId_returnsPopulatedScheduleNode() {
        // given
        Schedule schedule = new Schedule(
                course, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30));
        ReflectionTestUtils.setField(schedule, "id", 5L);
        when(scheduleRepository.findById(5L)).thenReturn(Optional.of(schedule));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.schedule, "5");

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.schedule);
        assertThat(node.id()).isEqualTo("5");
        assertThat(node.attributes())
                .containsEntry("day", "MONDAY")
                .containsEntry("startTime", LocalTime.of(9, 0))
                .containsEntry("endTime", LocalTime.of(10, 30))
                .containsEntry("courseId", 10L);
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Owning Course");
    }

    @Test
    void resolve_withUnknownNoteId_throwsResourceNotFoundException() {
        // given
        UUID noteId = UUID.randomUUID();
        when(noteRepository.findById(noteId)).thenReturn(Optional.empty());
        when(traceSink.snapshot()).thenReturn(List.of());

        // when & then
        assertThatThrownBy(() -> walker.resolve(TraceKind.note, noteId.toString()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(noteId.toString());
    }

    @Test
    void resolve_withMalformedId_throwsResourceNotFoundException() {
        // given
        when(traceSink.snapshot()).thenReturn(List.of());

        // when & then
        assertThatThrownBy(() -> walker.resolve(TraceKind.note, "unknown-id"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("unknown-id");
    }

    @Test
    void resolve_withLifecycleKind_throwsBadRequestException() {
        // when & then
        assertThatThrownBy(() -> walker.resolve(TraceKind.lifecycle, UUID.randomUUID().toString()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("lifecycle");
    }

    @Test
    void findTaskStubByTitle_withMatchingTitle_returnsInferredStub() {
        // given
        UUID noteId = UUID.randomUUID();
        Task task = new Task(course, "Read Chapter 3", LocalDate.of(2026, 10, 25), Duration.ofMinutes(45));
        ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
        when(taskRepository.findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(noteId, "read chapter 3"))
                .thenReturn(Optional.of(task));

        // when
        Optional<TraceNodeStubDto> stub = walker.findTaskStubByTitle(noteId, "read chapter 3");

        // then
        assertThat(stub).isPresent();
        assertThat(stub.get().kind()).isEqualTo(TraceKind.task);
        assertThat(stub.get().title()).isEqualTo("Read Chapter 3");
        assertThat(stub.get().isExact()).isFalse();
    }

    @Test
    void findTaskStubByTitle_withNoMatch_returnsEmpty() {
        // given
        UUID noteId = UUID.randomUUID();
        when(taskRepository.findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(noteId, "missing"))
                .thenReturn(Optional.empty());

        // when
        Optional<TraceNodeStubDto> stub = walker.findTaskStubByTitle(noteId, "missing");

        // then
        assertThat(stub).isEmpty();
    }

    @Test
    void findEventStubByTitle_withMatchingTitle_returnsInferredStub() {
        // given
        UUID noteId = UUID.randomUUID();
        AcademicEvent event = new AcademicEvent(course, "Midterm Exam", LocalDateTime.of(2026, 10, 30, 14, 0));
        ReflectionTestUtils.setField(event, "id", UUID.randomUUID());
        when(academicEventRepository.findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(noteId, "midterm exam"))
                .thenReturn(Optional.of(event));

        // when
        Optional<TraceNodeStubDto> stub = walker.findEventStubByTitle(noteId, "midterm exam");

        // then
        assertThat(stub).isPresent();
        assertThat(stub.get().kind()).isEqualTo(TraceKind.event);
        assertThat(stub.get().title()).isEqualTo("Midterm Exam");
        assertThat(stub.get().isExact()).isFalse();
    }

    @Test
    void findEventStubByTitle_withNoMatch_returnsEmpty() {
        // given
        UUID noteId = UUID.randomUUID();
        when(academicEventRepository.findFirstByNoteIdAndTitleIgnoreCaseOrderByCreatedAtDesc(noteId, "missing"))
                .thenReturn(Optional.empty());

        // when
        Optional<TraceNodeStubDto> stub = walker.findEventStubByTitle(noteId, "missing");

        // then
        assertThat(stub).isEmpty();
    }
}
