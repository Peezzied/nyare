package group.four.nyare.nyare.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import group.four.nyare.nyare.NyareApplication;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end integration test showing image processing and note processing
 * working hand in hand: synthetic note images are described by
 * {@link ImageAiProcessor}, the descriptions flow into
 * {@link StudyPlannerEngine} via the note-images map, and the full
 * {@link StudyPlannerService#processNotes} pipeline persists everything.
 */
@ExtendWith(OutputCaptureExtension.class)
@SpringBootTest(classes = NyareApplication.class)
public class FullStudyPlannerEngineIntegrationTest {

    @Autowired
    private ImageAiProcessor imageAiProcessor;

    @Autowired
    private StudyPlannerEngine engine;

    @Autowired
    private StudyPlannerService studyPlannerService;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private ImageRepository imageRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private AcademicEventRepository academicEventRepository;

    @Autowired
    private AcademicContextRepository academicContextRepository;

    @BeforeEach
    void cleanDatabase() {
        academicContextRepository.deleteAll();
        academicEventRepository.deleteAll();
        taskRepository.deleteAll();
        noteRepository.deleteAll();
        imageRepository.deleteAll();
        scheduleRepository.deleteAll();
        courseRepository.deleteAll();
    }

    @Test
    @DisplayName("Engine: image descriptions flow into planning and image audit correlation is logged")
    void engineProcessesNotesWithImageDescriptions(CapturedOutput output, TestInfo testInfo) throws Exception {
        // given: same courses and schedules as StudyPlannerEngineIntegrationTest
        List<Course> courses = seedCourses();
        Course compArch = courses.get(0);
        Course calc2 = courses.get(3);
        Course mobComp = courses.get(5);
        Course oop = courses.get(6);
        List<Schedule> schedules = seedSchedules(courses);

        // given: dummy existing academic state
        Task completedTask = new Task(oop, "Review basic class syntax and constructors");
        completedTask.setStatus(TaskStatus.COMPLETED);
        completedTask.setScheduledDate(LocalDate.now().minusDays(4));

        Task openTask = new Task(compArch, "Review MIPS instruction encoding");
        openTask.setStatus(TaskStatus.TODO);
        openTask.setScheduledDate(LocalDate.now().plusDays(1));
        List<Task> existingTasks = List.of(completedTask, openTask);

        AcademicEvent problemSet = new AcademicEvent(calc2, null, "Calculus 2 Problem Set 1",
                "Integration by parts", LocalDateTime.now().plusDays(7));
        AcademicEvent androidQuiz = new AcademicEvent(mobComp, null, "Mobile Computing Quiz",
                "Activity lifecycle callbacks", LocalDateTime.now().plusDays(3));
        List<AcademicEvent> existingEvents = List.of(problemSet, androidQuiz);

        AcademicContext oopContext = new AcademicContext(oop,
                "Student struggles with polymorphism and method overriding");
        ReflectionTestUtils.setField(oopContext, "createdAt", Instant.now().minus(3, ChronoUnit.DAYS));
        List<AcademicContext> existingContexts = List.of(oopContext);

        // given: synthetic note images described by the real image AI process
        Image slideImage = transientImage(
                createSyntheticNoteImage("CS201 Algorithm: Binary Tree Traversal. Time Complexity: O(n)."));
        String slideDescription = imageAiProcessor.describeImage(slideImage.getData(), "image/png");
        assertThat(slideDescription).isNotBlank();
        slideImage.setDescription(slideDescription);

        Image noticeImage = transientImage(
                createSyntheticNoteImage("Important: Submit Lab Report 3 before Friday midnight."));
        String noticeDescription = imageAiProcessor.describeImage(noticeImage.getData(), "image/png");
        assertThat(noticeDescription).isNotBlank();
        noticeImage.setDescription(noticeDescription);

        // given: journal notes, two of them referencing images
        Note oopNote = transientNote(oop, "grabe sabaw ako sa lab 3 kanina puro inheritance at polymorphism... "
                + "may pa-lab report si sir due next tue ng 1:30pm bago mag-start lab. "
                + "kailangan ko tapusin yung uml class diagram asap.\n\n"
                + "![Lab Notice](/api/images/" + noticeImage.getId() + ")");
        Note mobNote = transientNote(mobComp, "intro pa lang sa android studio setup and activity lifecycle "
                + "pero shookt kami biglang announced quiz sa thursday 10:30am coverage yung lifecycle callbacks. "
                + "need ko mag-install ng android studio tsaka sdk sa laptop bago mag-next lab session.");
        Note calcNote = transientNote(calc2, "calculus discussion abt inverse trigo functions. "
                + "kasama raw yata sa midterm exam which will prolly be on oct 7.\n\n"
                + "![Lecture Slide](/api/images/" + slideImage.getId() + ")");
        List<Note> notes = List.of(oopNote, mobNote, calcNote);

        Map<UUID, List<Image>> noteImages = Map.of(
                oopNote.getId(), List.of(noticeImage),
                calcNote.getId(), List.of(slideImage));

        // when: image descriptions feed the planner together with notes
        StudyPlannerEngine.ExtractedData result = engine.process(
                notes, existingTasks, existingEvents, existingContexts, schedules, noteImages);

        reportObservation(testInfo.getDisplayName(), result, noteImages);

        // then: all entity types extracted with decoded note references
        assertThat(result.tasks()).isNotEmpty();
        assertThat(result.events()).isNotEmpty();
        assertThat(result.contexts()).isNotEmpty();
        List<UUID> noteIds = notes.stream().map(Note::getId).toList();
        assertThat(result.tasks()).allMatch(t -> t.noteId() != null && noteIds.contains(t.noteId()));

        // then: image-linked notes contributed planning entities
        assertThat(result.tasks()).anyMatch(t -> oopNote.getId().equals(t.noteId()));
        assertThat(result.events()).anyMatch(e -> oopNote.getId().equals(e.noteId())
                || mobNote.getId().equals(e.noteId()));

        // then: auditing captured planner decisions plus image correlation
        assertThat(output.getAll()).contains("[AI AUDIT - IMAGE CONTEXT]");
        assertThat(output.getAll()).contains("ImageId: " + noticeImage.getId());
        assertThat(output.getAll()).contains("NoteId: " + oopNote.getId());
        assertThat(output.getAll()).contains("Description: \"" + noticeDescription);
        assertThat(output.getAll()).contains("[AI AUDIT - TASK PLANNING]");
        assertThat(output.getAll()).contains("[AI AUDIT - EVENT PLANNING]");
    }

    @Test
    @DisplayName("Service: processNotes describes images, persists entities, and audits image context")
    void serviceProcessesNotesEndToEndWithImages(CapturedOutput output) throws Exception {
        // given: persisted courses and schedules
        List<Course> courses = courseRepository.saveAll(seedCourses());
        Course compArch = courses.get(0);
        Course mobComp = courses.get(5);
        Course oop = courses.get(6);
        scheduleRepository.saveAll(seedSchedules(courses));

        // given: dummy persisted academic state
        Task openTask = new Task(compArch, "Review MIPS instruction encoding");
        openTask.setStatus(TaskStatus.TODO);
        openTask.setScheduledDate(LocalDate.now().plusDays(1));
        taskRepository.save(openTask);
        academicEventRepository.save(new AcademicEvent(mobComp, null, "Mobile Computing Quiz",
                "Activity lifecycle callbacks", LocalDateTime.now().plusDays(3)));
        academicContextRepository.save(new AcademicContext(oop,
                "Student struggles with polymorphism and method overriding"));

        // given: persisted images without descriptions, referenced by fresh notes
        byte[] slideBytes = createSyntheticNoteImage("CS201 Algorithm: Binary Tree Traversal. Submit problem set Friday.");
        Image slideImage = imageRepository.save(new Image(slideBytes, "image/png", "slide.png", slideBytes.length));
        assertThat(slideImage.getDescription()).isNull();

        byte[] noticeBytes = createSyntheticNoteImage("Important: Submit Lab Report 3 before Friday midnight.");
        Image noticeImage = imageRepository.save(new Image(noticeBytes, "image/png", "notice.png", noticeBytes.length));

        Note oopNote = noteRepository.save(new Note(oop, "kailangan ko tapusin yung uml class diagram asap "
                + "para sa lab report due friday.\n\n![Lab Notice](/api/images/" + noticeImage.getId() + ")"));
        Note calcNote = noteRepository.save(new Note(courses.get(3),
                "review binary tree traversal for friday problem set.\n\n"
                        + "![Lecture Slide](/api/images/" + slideImage.getId() + ")"));

        // when: full pipeline runs image AI + note planning in one transaction
        ProcessSummaryResponse summary = studyPlannerService.processNotes(LocalDate.now());

        // then: image descriptions populated by the image AI process
        Image reloadedSlide = imageRepository.findById(slideImage.getId()).orElseThrow();
        assertThat(reloadedSlide.getDescription()).isNotBlank();
        Image reloadedNotice = imageRepository.findById(noticeImage.getId()).orElseThrow();
        assertThat(reloadedNotice.getDescription()).isNotBlank();

        // then: notes marked processed and planning entities materialized
        assertThat(noteRepository.findById(oopNote.getId()).orElseThrow().getLastProcessedAt()).isNotNull();
        assertThat(noteRepository.findById(calcNote.getId()).orElseThrow().getLastProcessedAt()).isNotNull();
        int totalCreated = summary.getTasksCreated() + summary.getEventsCreated() + summary.getContextsCreated();
        assertThat(totalCreated).isGreaterThan(0);

        // then: image correlation visible in the audit trail
        assertThat(output.getAll()).contains("[AI AUDIT - IMAGE CONTEXT]");
        assertThat(output.getAll()).contains("ImageId: " + slideImage.getId());
    }

    // --- Seeds (same courses and schedules as StudyPlannerEngineIntegrationTest) ---

    private static List<Course> seedCourses() {
        return List.of(
                new Course("Computer Architecture and Organization", "CS Core Course"),
                new Course("Principles of Programming Languages", "CS Core Course"),
                new Course("GE Elective 1 - Living in the IT Era", "General Education Elective"),
                new Course("Calculus 2", "Mathematics Course"),
                new Course("Readings in Philippine History", "General Education Course"),
                new Course("Mobile Computing", "CS Elective Course"),
                new Course("Object-Oriented Programming", "CS Core Course"),
                new Course("Physical Activities Toward Health & Fitness 3 (PATHFit 3)", "Physical Education"));
    }

    private static List<Schedule> seedSchedules(List<Course> courses) {
        Course compArch = courses.get(0);
        Course ppl = courses.get(1);
        Course itEra = courses.get(2);
        Course calc2 = courses.get(3);
        Course rph = courses.get(4);
        Course mobComp = courses.get(5);
        Course oop = courses.get(6);
        Course pathfit = courses.get(7);
        return List.of(
                new Schedule(compArch, DayOfWeek.MONDAY, LocalTime.of(7, 30), LocalTime.of(8, 30)),
                new Schedule(ppl, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30)),
                new Schedule(itEra, DayOfWeek.MONDAY, LocalTime.of(10, 30), LocalTime.of(12, 0)),
                new Schedule(calc2, DayOfWeek.MONDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(rph, DayOfWeek.MONDAY, LocalTime.of(15, 30), LocalTime.of(16, 30)),
                new Schedule(mobComp, DayOfWeek.TUESDAY, LocalTime.of(10, 30), LocalTime.of(13, 30)),
                new Schedule(oop, DayOfWeek.TUESDAY, LocalTime.of(13, 30), LocalTime.of(16, 30)),
                new Schedule(compArch, DayOfWeek.WEDNESDAY, LocalTime.of(7, 30), LocalTime.of(10, 30)),
                new Schedule(compArch, DayOfWeek.WEDNESDAY, LocalTime.of(11, 30), LocalTime.of(12, 30)),
                new Schedule(calc2, DayOfWeek.WEDNESDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(rph, DayOfWeek.WEDNESDAY, LocalTime.of(15, 30), LocalTime.of(16, 30)),
                new Schedule(mobComp, DayOfWeek.THURSDAY, LocalTime.of(10, 30), LocalTime.of(12, 30)),
                new Schedule(oop, DayOfWeek.THURSDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(ppl, DayOfWeek.FRIDAY, LocalTime.of(9, 0), LocalTime.of(10, 30)),
                new Schedule(itEra, DayOfWeek.FRIDAY, LocalTime.of(10, 30), LocalTime.of(12, 0)),
                new Schedule(pathfit, DayOfWeek.FRIDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(rph, DayOfWeek.FRIDAY, LocalTime.of(15, 30), LocalTime.of(16, 30)));
    }

    private static Note transientNote(Course course, String text) {
        Note note = new Note(course, text);
        ReflectionTestUtils.setField(note, "id", UUID.randomUUID());
        return note;
    }

    private static Image transientImage(byte[] data) {
        Image image = new Image(data, "image/png", "synthetic.png", data.length);
        ReflectionTestUtils.setField(image, "id", UUID.randomUUID());
        return image;
    }

    private byte[] createSyntheticNoteImage(String text) throws IOException {
        int width = 600;
        int height = 200;
        BufferedImage bufferedImage = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = bufferedImage.createGraphics();
        g2d.setColor(Color.WHITE);
        g2d.fillRect(0, 0, width, height);
        g2d.setColor(Color.BLACK);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 20));
        g2d.drawString(text, 20, 100);
        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(bufferedImage, "png", baos);
        return baos.toByteArray();
    }

    private static void reportObservation(String testName, StudyPlannerEngine.ExtractedData result,
            Map<UUID, List<Image>> noteImages) throws IOException {
        StringBuilder report = new StringBuilder();
        report.append("=======================================================\n");
        report.append("      IMAGE + NOTES PLANNER PIPELINE AI OUTPUT        \n");
        report.append("=======================================================\n\n");

        report.append("--- IMAGE DESCRIPTIONS (").append(noteImages.size()).append(" notes) ---\n");
        for (Map.Entry<UUID, List<Image>> entry : new HashMap<>(noteImages).entrySet()) {
            for (Image image : entry.getValue()) {
                report.append(String.format("• ImageId: %s | NoteId: %s%n  Description: %s%n",
                        image.getId(), entry.getKey(), image.getDescription()));
            }
        }

        report.append("\n--- EXTRACTED TASKS (").append(result.tasks().size()).append(") ---\n");
        for (StudyPlannerEngine.ExtractedTask task : result.tasks()) {
            report.append(String.format("• [%s] %s%n", task.noteRef(), task.title()));
            report.append(String.format("  Description: %s%n", task.description()));
            report.append(String.format("  Scheduled:   %s | Duration: %s min | NoteId: %s%n",
                    task.scheduledDate(), task.estimatedMinutes(), task.noteId()));
        }

        report.append("\n--- EXTRACTED EVENTS (").append(result.events().size()).append(") ---\n");
        for (StudyPlannerEngine.ExtractedEvent event : result.events()) {
            report.append(String.format("• [%s] %s%n", event.noteRef(), event.title()));
            report.append(String.format("  Description: %s%n", event.description()));
            report.append(String.format("  Deadline:    %s | NoteId: %s%n", event.deadline(), event.noteId()));
        }

        report.append("\n--- EXTRACTED CONTEXTS (").append(result.contexts().size()).append(") ---\n");
        for (StudyPlannerEngine.ExtractedContext context : result.contexts()) {
            report.append(String.format("• [%s] %s (NoteId: %s)%n",
                    context.noteRef(), context.value(), context.noteId()));
        }

        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        System.out.println(report);
        System.out.println("\n Raw json output:\n" + mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result));
    }
}
