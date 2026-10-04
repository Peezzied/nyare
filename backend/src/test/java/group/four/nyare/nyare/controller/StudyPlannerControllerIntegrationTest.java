package group.four.nyare.nyare.controller;

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
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StudyPlannerControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private AcademicEventRepository academicEventRepository;

    @Autowired
    private AcademicContextRepository academicContextRepository;

    @Autowired
    private NoteRepository noteRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void cleanDatabase() {
        academicContextRepository.deleteAll();
        academicEventRepository.deleteAll();
        taskRepository.deleteAll();
        noteRepository.deleteAll();
        scheduleRepository.deleteAll();
        courseRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("process with real academic dataset extracts entities, updates database, and emits SSE done event")
    void process_withRealAcademicDataset_extractsPersistsAndEmitsDoneEvent() throws Exception {
        User testUser = userRepository.save(new User("planner_test_user"));

        // Given: Seed realistic courses from university schedule
        Course compArch = courseRepository.save(new Course("Computer Architecture and Organization", "CS Core Course", testUser));
        Course ppl = courseRepository.save(new Course("Principles of Programming Languages", "CS Core Course", testUser));
        Course itEra = courseRepository.save(new Course("GE Elective 1 - Living in the IT Era", "General Education Elective", testUser));
        Course calc2 = courseRepository.save(new Course("Calculus 2", "Mathematics Course", testUser));
        Course rph = courseRepository.save(new Course("Readings in Philippine History", "General Education Course", testUser));
        Course mobComp = courseRepository.save(new Course("Mobile Computing", "CS Elective Course", testUser));
        Course oop = courseRepository.save(new Course("Object-Oriented Programming", "CS Core Course", testUser));
        Course pathfit = courseRepository.save(new Course("Physical Activities Toward Health & Fitness 3 (PATHFit 3)", "Physical Education", testUser));

        // Given: Seed weekly recurring class schedules
        scheduleRepository.saveAll(List.of(
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
        ));

        // Given: Seed existing baseline academic state
        Task completedTask = new Task(oop, "Review basic class syntax and constructors");
        completedTask.setStatus(TaskStatus.COMPLETED);
        completedTask.setScheduledDate(LocalDate.now().minusDays(4));
        taskRepository.save(completedTask);

        Task openTask = new Task(compArch, "Review MIPS instruction encoding");
        openTask.setStatus(TaskStatus.TODO);
        openTask.setScheduledDate(LocalDate.now().plusDays(1));
        taskRepository.save(openTask);

        AcademicEvent labEvent = new AcademicEvent(calc2, null, "Calculus 2 Problem Set 1", "Integration by parts",
                LocalDateTime.now().plusDays(7));
        academicEventRepository.save(labEvent);

        AcademicContext oopContext = new AcademicContext(oop, "Student struggles with polymorphism and method overriding");
        academicContextRepository.save(oopContext);

        AcademicContext compArchContext = new AcademicContext(compArch, "Covered logic gates and boolean algebra");
        academicContextRepository.save(compArchContext);

        // Given: Historical processed note (clean, will not be processed)
        Note pastNote = new Note(oop, "Old lesson summary");
        pastNote.setLastProcessedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        noteRepository.save(pastNote);

        // Given: Seed 5 incoming rushed student journal notes for today
        Note note1 = noteRepository.save(new Note(oop,
                "grabe sabaw ako sa lab 3 kanina sa a-205 puro inheritance at polymorphism... " +
                        "may pa-lab report si sir due next tue oct 6 ng 1:30pm bago mag-start lab. " +
                        "kailangan ko tapusin yung uml class diagram asap. " +
                        "sabi rin ni prof mag-practice daw kami ng java abstract classes at interfaces before thursday lecture"));

        Note note2 = noteRepository.save(new Note(mobComp,
                "intro pa lang sa android studio setup and activity lifecycle sa a-211 pero shookt kami biglang announced quiz sa thursday 10:30am coverage yung lifecycle callbacks. " +
                        "need ko mag-install ng android studio tsaka sdk sa laptop bago mag-next lab session para di nganga"));

        Note note3 = noteRepository.save(new Note(ppl,
                "hirap na hirap ako sa lambda calculus at syntax grammar ambiguity... " +
                        "kailangan ko mag-basa ng lecture slides tsaka mag-practice mag-solve ng derivation exercises para maintindihan ko yung topic"));

        Note note4 = noteRepository.save(new Note(calc2,
                "calculus discussion abt inverse trigo functions. " +
                        "used synthetic division dq magets tas kasama raw yata sa midterm exam which will prolly be on oct 7 since asynch kami sa next meeting niya"));

        Note note5 = noteRepository.save(new Note(oop,
                "java discussion about file handling and exception handling. " +
                        "prof showed examples on how to read and write files, and how try-catch works. " +
                        "talked about multithreading din, like how multiple tasks can run at the same time. " +
                        "baka included in the next assessment kasi may activities about these topics."));

        // When: Trigger study planner processing endpoint
        MvcResult mvcResult = mockMvc.perform(post("/api/study-planner/process")
                        .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(request().asyncStarted())
                .andReturn();

        // Wait up to 60 seconds for virtual thread and AI engine completion
        mvcResult.getAsyncResult(60_000);

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));

        // Then: Validate SSE stream format
        String responseBody = mvcResult.getResponse().getContentAsString();
        assertThat(responseBody).contains("event:done");
        assertThat(responseBody).contains("data:");
        assertThat(responseBody).contains("\"tasksCreated\":");
        assertThat(responseBody).contains("\"eventsCreated\":");
        assertThat(responseBody).contains("\"contextsCreated\":");

        // Then: Validate database persistence
        List<Note> dirtyNotesAfterProcessing = noteRepository.findDirtyNotes(LocalDate.now());
        assertThat(dirtyNotesAfterProcessing).isEmpty();

        List<Note> processedNotes = noteRepository.findAllById(List.of(
                note1.getId(), note2.getId(), note3.getId(), note4.getId(), note5.getId()
        ));
        assertThat(processedNotes).allMatch(n -> n.getLastProcessedAt() != null);

        List<Task> currentTasks = taskRepository.findAll();
        assertThat(currentTasks.size()).isGreaterThan(2);

        List<AcademicEvent> currentEvents = academicEventRepository.findAll();
        assertThat(currentEvents.size()).isGreaterThan(1);

        List<AcademicContext> currentContexts = academicContextRepository.findAll();
        assertThat(currentContexts.size()).isGreaterThan(2);
    }

    @Test
    @DisplayName("process with no dirty notes emits SSE error event with 400 Bad Request")
    void process_withNoDirtyNotes_emitsSseErrorEvent400() throws Exception {
        // Given: Course and no notes for today
        User testUser = userRepository.save(new User("test_user_empty"));
        courseRepository.save(new Course("CS101", "Introduction to Computing", testUser));

        // When: Trigger study planner processing endpoint
        MvcResult mvcResult = mockMvc.perform(post("/api/study-planner/process")
                        .accept(MediaType.TEXT_EVENT_STREAM_VALUE))
                .andExpect(request().asyncStarted())
                .andReturn();

        mvcResult.getAsyncResult(10_000);

        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_EVENT_STREAM));

        // Then: Validate SSE error payload
        String responseBody = mvcResult.getResponse().getContentAsString();
        assertThat(responseBody).contains("event:error");
        assertThat(responseBody).contains("\"status\":400");
        assertThat(responseBody).contains("\"title\":\"Bad Request\"");
        assertThat(responseBody).contains("No journal notes found");
    }
}
