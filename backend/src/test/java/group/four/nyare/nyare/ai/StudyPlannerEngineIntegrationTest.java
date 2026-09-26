package group.four.nyare.nyare.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInfo;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.annotation.Import;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(OutputCaptureExtension.class)
@SpringBootTest(classes = StudyPlannerEngineIntegrationTest.TestConfig.class)
public class StudyPlannerEngineIntegrationTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration
    @Import({StudyPlannerEngine.class, group.four.nyare.nyare.ai.advisor.NoteAuditAdvisor.class})
    static class TestConfig {}

    @Autowired
    private StudyPlannerEngine engine;

    @Test
    @DisplayName("Main Integration: processes notes with full academic context and extracts planning entities")
    void mainIntegrationTest_processesNotesAndExtractsEntities(TestInfo testInfo) throws Exception {
        // given: Student Courses from University Class Schedule
        Course compArch = new Course("Computer Architecture and Organization", "CS Core Course");
        Course ppl = new Course("Principles of Programming Languages", "CS Core Course");
        Course itEra = new Course("GE Elective 1 - Living in the IT Era", "General Education Elective");
        Course calc2 = new Course("Calculus 2", "Mathematics Course");
        Course rph = new Course("Readings in Philippine History", "General Education Course");
        Course mobComp = new Course("Mobile Computing", "CS Elective Course");
        Course oop = new Course("Object-Oriented Programming", "CS Core Course");
        Course pathfit = new Course("Physical Activities Toward Health & Fitness 3 (PATHFit 3)", "Physical Education");

        // given: Weekly Recurring Schedules
        List<Schedule> schedules = List.of(
                // Monday
                new Schedule(compArch, DayOfWeek.MONDAY, LocalTime.of(7, 30), LocalTime.of(8, 30)),
                new Schedule(ppl, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30)),
                new Schedule(itEra, DayOfWeek.MONDAY, LocalTime.of(10, 30), LocalTime.of(12, 0)),
                new Schedule(calc2, DayOfWeek.MONDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(rph, DayOfWeek.MONDAY, LocalTime.of(15, 30), LocalTime.of(16, 30)),

                // Tuesday
                new Schedule(mobComp, DayOfWeek.TUESDAY, LocalTime.of(10, 30), LocalTime.of(13, 30)),
                new Schedule(oop, DayOfWeek.TUESDAY, LocalTime.of(13, 30), LocalTime.of(16, 30)),

                // Wednesday
                new Schedule(compArch, DayOfWeek.WEDNESDAY, LocalTime.of(7, 30), LocalTime.of(10, 30)),
                new Schedule(compArch, DayOfWeek.WEDNESDAY, LocalTime.of(11, 30), LocalTime.of(12, 30)),
                new Schedule(calc2, DayOfWeek.WEDNESDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(rph, DayOfWeek.WEDNESDAY, LocalTime.of(15, 30), LocalTime.of(16, 30)),

                // Thursday
                new Schedule(mobComp, DayOfWeek.THURSDAY, LocalTime.of(10, 30), LocalTime.of(12, 30)),
                new Schedule(oop, DayOfWeek.THURSDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),

                // Friday
                new Schedule(ppl, DayOfWeek.FRIDAY, LocalTime.of(9, 0), LocalTime.of(10, 30)),
                new Schedule(itEra, DayOfWeek.FRIDAY, LocalTime.of(10, 30), LocalTime.of(12, 0)),
                new Schedule(pathfit, DayOfWeek.FRIDAY, LocalTime.of(13, 30), LocalTime.of(15, 30)),
                new Schedule(rph, DayOfWeek.FRIDAY, LocalTime.of(15, 30), LocalTime.of(16, 30))
        );

        // given: Existing Academic State
        Task completedTask = new Task(oop, "Review basic class syntax and constructors");
        completedTask.setStatus(TaskStatus.COMPLETED);
        completedTask.setScheduledDate(LocalDate.now().minusDays(4));

        Task openTask = new Task(compArch, "Review MIPS instruction encoding");
        openTask.setStatus(TaskStatus.TODO);
        openTask.setScheduledDate(LocalDate.now().plusDays(1));
        List<Task> existingTasks = List.of(completedTask, openTask);

        AcademicEvent labEvent = new AcademicEvent(calc2, null, "Calculus 2 Problem Set 1", "Integration by parts",
                LocalDateTime.now().plusDays(7));
        List<AcademicEvent> existingEvents = List.of(labEvent);

        AcademicContext oopContext = new AcademicContext(oop, "Student struggles with polymorphism and method overriding");
        ReflectionTestUtils.setField(oopContext, "createdAt", Instant.now().minus(3, ChronoUnit.DAYS));
        AcademicContext compArchContext = new AcademicContext(compArch, "Covered logic gates and boolean algebra");
        ReflectionTestUtils.setField(compArchContext, "createdAt", Instant.now().minus(6, ChronoUnit.DAYS));
        List<AcademicContext> existingContexts = List.of(oopContext, compArchContext);

        // given: Incoming Rushed Student Journal Notes with UUIDs
        Note note1 = createNote(oop, "grabe sabaw ako sa lab 3 kanina sa a-205 puro inheritance at polymorphism... " +
                "may pa-lab report si sir due next tue oct 6 ng 1:30pm bago mag-start lab. " +
                "kailangan ko tapusin yung uml class diagram asap. " +
                "sabi rin ni prof mag-practice daw kami ng java abstract classes at interfaces before thursday lecture");

        Note note2 = createNote(mobComp, "intro pa lang sa android studio setup and activity lifecycle sa a-211 pero shookt kami biglang announced quiz sa thursday 10:30am coverage yung lifecycle callbacks. " +
                "need ko mag-install ng android studio tsaka sdk sa laptop bago mag-next lab session para di nganga");

        List<Note> notes = List.of(note1, note2);

        // when
        StudyPlannerEngine.ExtractedData result = engine.process(
                notes, existingTasks, existingEvents, existingContexts, schedules);

        // observe & export: Build structured summary report and write to files
        reportObservation(testInfo.getDisplayName(), result);

        // then: Entity lists present
        assertThat(result).isNotNull();
        assertThat(result.tasks()).isNotEmpty();
        assertThat(result.events()).isNotEmpty();
        assertThat(result.contexts()).isNotEmpty();

        // then: Decoded UUID references match source notes
        assertThat(result.tasks())
                .allMatch(t -> t.noteId() != null && (t.noteId().equals(note1.getId()) || t.noteId().equals(note2.getId())));
        assertThat(result.events())
                .allMatch(e -> e.noteId() != null && (e.noteId().equals(note1.getId()) || e.noteId().equals(note2.getId())));
        assertThat(result.contexts())
                .allMatch(c -> c.noteId() != null && (c.noteId().equals(note1.getId()) || c.noteId().equals(note2.getId())));

        // then: Implied tasks detected
        assertThat(result.tasks())
                .anyMatch(t -> t.title().toLowerCase().contains("interface") ||
                               t.title().toLowerCase().contains("abstract") ||
                               t.title().toLowerCase().contains("practice") ||
                               t.title().toLowerCase().contains("lifecycle"));

        // then: Academic events extracted with valid deadlines
        assertThat(result.events())
                .anyMatch(e -> e.title().toLowerCase().contains("quiz") ||
                               e.title().toLowerCase().contains("report") ||
                               e.title().toLowerCase().contains("deadline") ||
                               e.title().toLowerCase().contains("lab"));
    }

    @Test
    @DisplayName("process with course-irrelevant outlier note ignores note and logs audit warning")
    void process_withOutlierNote_ignoresNoteAndLogsAudit(CapturedOutput output, TestInfo testInfo) throws Exception {
        // given: Outlier non-academic note assigned to OOP course
        Course oop = new Course("Object-Oriented Programming", "CS Core Course");
        UUID noteId = UUID.randomUUID();
        String noteText = "bumili ako ng shampoo, sabon, tsaka kape sa grocery kanina tapos nanood ako ng anime buong gabi";
        Note outlierNote = new Note(oop, new NoteContent(noteText, null));
        ReflectionTestUtils.setField(outlierNote, "id", noteId);

        // when
        StudyPlannerEngine.ExtractedData result = engine.process(
                List.of(outlierNote),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList());

        reportObservation(testInfo.getDisplayName(), result);

        // then: Outlier note produces no tasks, events, or contexts
        assertThat(result.tasks()).noneMatch(t -> noteId.equals(t.noteId()));
        assertThat(result.events()).noneMatch(e -> noteId.equals(e.noteId()));
        assertThat(result.contexts()).noneMatch(c -> noteId.equals(c.noteId()));

        // then: NoteAuditAdvisor intercepted and logged the audit warning
        assertThat(output.getAll()).contains("[AI AUDIT - IGNORED NOTE]");
        assertThat(output.getAll()).contains("n1");
    }

    private static Note createNote(Course course, String text) {
        UUID note1Id = UUID.randomUUID();
        Note note = new Note(course, new NoteContent(text, null));
        ReflectionTestUtils.setField(note, "id", note1Id);

        return note;
    }

    private static void reportObservation(String testName, StudyPlannerEngine.ExtractedData result) throws IOException {
        StringBuilder report = new StringBuilder();
        report.append("=======================================================\n");
        report.append("            STUDY PLANNER ENGINE AI OUTPUT             \n");
        report.append("=======================================================\n\n");

        report.append("--- EXTRACTED TASKS (").append(result.tasks().size()).append(") ---\n");
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
            report.append(String.format("• [%s] %s (NoteId: %s)%n", context.noteRef(), context.value(), context.noteId()));
        }

        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());
        String jsonOutput = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(result);

        System.out.println(report);

        Path reportFile = Path.of("build", "reports", testName, "ai-engine-output.txt");
        Path jsonFile = Path.of("build", "reports", testName, "ai-engine-output.json");
        if (reportFile.getParent() != null) {
            Files.createDirectories(reportFile.getParent());
        }
        Files.writeString(reportFile, report.toString(), StandardCharsets.UTF_8);
        Files.writeString(jsonFile, jsonOutput, StandardCharsets.UTF_8);
        System.out.println("Exported test report to: " + reportFile.toAbsolutePath());
        System.out.println("Exported JSON output to: " + jsonFile.toAbsolutePath());
    }
}
