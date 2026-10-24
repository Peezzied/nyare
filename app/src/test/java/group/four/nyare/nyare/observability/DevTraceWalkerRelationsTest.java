package group.four.nyare.nyare.observability;

import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.dto.TraceNodeStubDto;
import group.four.nyare.nyare.observability.dto.TraceRelationGroupDto;
import group.four.nyare.nyare.observability.service.impl.DevTraceWalker;
import group.four.nyare.nyare.observability.sink.DevAuditTraceSink;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevTraceWalkerRelationsTest {

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
    void resolve_withOverFiftyCourseTasks_capsItemsAtFiftyAndReportsTotalCount() {
        // given
        List<Task> tasks = new ArrayList<>();
        for (int i = 0; i < 60; i++) {
            Task task = new Task(course, "Task " + i);
            ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
            tasks.add(task);
        }
        course.setTasks(tasks);
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.course, "10");

        // then
        TraceRelationGroupDto tasksGroup = groupNamed(node, "Tasks");
        assertThat(tasksGroup.totalCount()).isEqualTo(60);
        assertThat(tasksGroup.items()).hasSize(50);
        assertThat(tasksGroup.items()).allMatch(TraceNodeStubDto::isExact);
    }

    @Test
    void resolve_withImageId_neverExposesBinaryAndListsReferencingNotes() {
        // given
        UUID imageId = UUID.randomUUID();
        ImageMetadataView image = mock(ImageMetadataView.class);
        when(image.getId()).thenReturn(imageId);
        when(image.getContentType()).thenReturn("image/png");
        when(image.getFilename()).thenReturn("diagram.png");
        when(image.getSize()).thenReturn(3L);
        when(image.getDescription()).thenReturn("class diagram");
        when(imageRepository.findMetadataById(imageId)).thenReturn(Optional.of(image));

        UUID noteId = UUID.randomUUID();
        Note note = new Note(
                course, "Lecture 4 Notes",
                "see ![diagram](/api/images/" + imageId + ")",
                LocalDate.of(2026, 10, 24));
        ReflectionTestUtils.setField(note, "id", noteId);
        when(noteRepository.findByContentContaining(imageId.toString()))
                .thenReturn(List.of(note));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.image, imageId.toString());

        // then
        assertThat(node.attributes())
                .containsEntry("contentType", "image/png")
                .containsEntry("filename", "diagram.png")
                .containsEntry("size", 3L)
                .doesNotContainKey("data");
        assertThat(node.attributes().values()).noneMatch(byte[].class::isInstance);

        TraceRelationGroupDto referencing = groupNamed(node, "Referencing Notes");
        assertThat(referencing.targetKind()).isEqualTo(TraceKind.note);
        assertThat(referencing.totalCount()).isEqualTo(1);
        assertThat(referencing.items())
                .singleElement()
                .satisfies(stub -> {
                    assertThat(stub.id()).isEqualTo(noteId.toString());
                    assertThat(stub.isExact()).isTrue();
                });
        verify(noteRepository).findByContentContaining(imageId.toString());
        // The entity path would select the binary column; only the projection may run.
        verify(imageRepository, never()).findById(any());
    }

    @Test
    void resolve_withNoteId_returnsCourseTaskEventContextAndImageGroups() {
        // given
        UUID noteId = UUID.randomUUID();
        UUID imageId = UUID.randomUUID();
        Note note = new Note(
                course, "Lecture 4 Notes",
                "review ![slide](/api/images/" + imageId + ") today",
                LocalDate.of(2026, 10, 24));
        ReflectionTestUtils.setField(note, "id", noteId);
        when(noteRepository.findById(noteId)).thenReturn(Optional.of(note));

        Task task = new Task(course, "Read Chapter 3", LocalDate.of(2026, 10, 25), Duration.ofMinutes(45));
        task.setNote(note);
        ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
        when(taskRepository.findByNoteIdOrderByCreatedAtDesc(noteId)).thenReturn(List.of(task));

        AcademicEvent event = new AcademicEvent(course, note, "Midterm Exam", null,
                LocalDateTime.of(2026, 10, 30, 14, 0));
        ReflectionTestUtils.setField(event, "id", UUID.randomUUID());
        when(academicEventRepository.findByNoteIdOrderByDeadlineAsc(noteId))
                .thenReturn(List.of(event));

        AcademicContext context = new AcademicContext(course, note, "Quiz moved to Monday");
        ReflectionTestUtils.setField(context, "id", UUID.randomUUID());
        when(academicContextRepository.findByNoteIdOrderByCreatedAtDesc(noteId))
                .thenReturn(List.of(context));

        ImageMetadataView image = mock(ImageMetadataView.class);
        when(image.getId()).thenReturn(imageId);
        when(image.getFilename()).thenReturn("slide.png");
        when(image.getContentType()).thenReturn("image/png");
        when(imageRepository.findAllMetadataByIdIn(Set.copyOf(List.of(imageId))))
                .thenReturn(List.of(image));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.note, noteId.toString());

        // then
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly(
                        "Owning Course", "Child Tasks", "Child Events",
                        "Context Facts", "Referenced Images");
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::targetKind)
                .containsExactly(
                        TraceKind.course, TraceKind.task, TraceKind.event,
                        TraceKind.context, TraceKind.image);

        TraceRelationGroupDto owning = groupNamed(node, "Owning Course");
        assertThat(owning.totalCount()).isEqualTo(1);
        assertThat(owning.items().get(0).id()).isEqualTo("10");

        assertThat(groupNamed(node, "Child Tasks").items().get(0).id())
                .isEqualTo(task.getId().toString());
        assertThat(groupNamed(node, "Child Events").items().get(0).id())
                .isEqualTo(event.getId().toString());
        assertThat(groupNamed(node, "Context Facts").items().get(0).id())
                .isEqualTo(context.getId().toString());
        assertThat(groupNamed(node, "Referenced Images").items().get(0).id())
                .isEqualTo(imageId.toString());
        // The entity path would select the binary column; only the projection may run.
        verify(imageRepository, never()).findAllById(any());
    }

    @Test
    void resolve_withTaskId_returnsOwningCourseAndSourceNoteGroups() {
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
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Owning Course", "Source Note");
        assertThat(groupNamed(node, "Owning Course").items().get(0).id()).isEqualTo("10");
        assertThat(groupNamed(node, "Source Note").items().get(0).id())
                .isEqualTo(noteId.toString());
    }

    @Test
    void resolve_withCourseId_returnsAllChildRelationGroups() {
        // given
        Schedule schedule = new Schedule(
                course, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30));
        ReflectionTestUtils.setField(schedule, "id", 5L);
        Note note = new Note(course, "Lecture 4 Notes", "content", LocalDate.of(2026, 10, 24));
        ReflectionTestUtils.setField(note, "id", UUID.randomUUID());
        Task task = new Task(course, "Read Chapter 3");
        ReflectionTestUtils.setField(task, "id", UUID.randomUUID());
        AcademicEvent event = new AcademicEvent(
                course, "Midterm Exam", LocalDateTime.of(2026, 10, 30, 14, 0));
        ReflectionTestUtils.setField(event, "id", UUID.randomUUID());
        AcademicContext context = new AcademicContext(course, "Quiz moved to Monday");
        ReflectionTestUtils.setField(context, "id", UUID.randomUUID());
        course.setSchedules(List.of(schedule));
        course.setNotes(List.of(note));
        course.setTasks(List.of(task));
        course.setAcademicEvents(List.of(event));
        course.setAcademicContexts(List.of(context));
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.course, "10");

        // then
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Schedules", "Notes", "Tasks", "Events", "Context Facts");
        assertThat(node.relations())
                .allMatch(group -> group.totalCount() == 1 && group.items().size() == 1);
    }

    @Test
    void resolve_withContextId_returnsOwningCourseAndSourceNoteGroups() {
        // given
        UUID contextId = UUID.randomUUID();
        UUID noteId = UUID.randomUUID();
        Note note = new Note(course, "Lecture 4 Notes", "content", LocalDate.of(2026, 10, 24));
        ReflectionTestUtils.setField(note, "id", noteId);
        AcademicContext context = new AcademicContext(course, note, "Quiz moved to Monday");
        ReflectionTestUtils.setField(context, "id", contextId);
        when(academicContextRepository.findById(contextId)).thenReturn(Optional.of(context));

        // when
        TraceNodeDto node = walker.resolve(TraceKind.context, contextId.toString());

        // then
        assertThat(node.kind()).isEqualTo(TraceKind.context);
        assertThat(node.displayTitle()).isEqualTo("Quiz moved to Monday");
        assertThat(node.relations())
                .extracting(TraceRelationGroupDto::groupName)
                .containsExactly("Owning Course", "Source Note");
        assertThat(groupNamed(node, "Source Note").items().get(0).id())
                .isEqualTo(noteId.toString());
    }

    private TraceRelationGroupDto groupNamed(TraceNodeDto node, String groupName) {
        return node.relations().stream()
                .filter(group -> group.groupName().equals(groupName))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Missing relation group '" + groupName + "'"));
    }
}
