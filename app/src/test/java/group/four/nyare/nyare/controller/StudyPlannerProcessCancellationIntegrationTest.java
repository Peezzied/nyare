package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
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
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;

/**
 * Integration test for cancel-on-disconnect of the SSE Process endpoint.
 * Runs a real Tomcat, mocks the AI engine, and drops the TCP connection
 * mid-run to prove the transaction rolls back. Makes no AI calls.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "nyare.study-planner.sse-heartbeat-ms=200")
class StudyPlannerProcessCancellationIntegrationTest {

    @LocalServerPort
    private int port;

    @MockitoBean
    private StudyPlannerEngine studyPlannerEngine;

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

    private CountDownLatch engineEntered;
    private CountDownLatch release;

    @BeforeEach
    void cleanDatabase() {
        academicContextRepository.deleteAll();
        academicEventRepository.deleteAll();
        taskRepository.deleteAll();
        noteRepository.deleteAll();
        scheduleRepository.deleteAll();
        courseRepository.deleteAll();
        userRepository.deleteAll();
        engineEntered = new CountDownLatch(1);
        release = new CountDownLatch(1);
    }

    @Test
    @DisplayName("process rolls back and keeps notes dirty when the client disconnects mid-run")
    void process_whenClientDisconnectsMidRun_rollsBackAndKeepsNotesDirty() throws Exception {
        // given
        User user = userRepository.save(new User("cancel_it_user"));
        Course course = courseRepository.save(new Course("CS101", "Intro", user));
        Note note = noteRepository.save(new Note(course, "some content"));
        Task preExisting = new Task(course, "PRE-EXISTING TASK");
        preExisting.setNote(note);
        preExisting.setStatus(TaskStatus.TODO);
        taskRepository.save(preExisting);

        stubEngine();

        // when
        String cookie = login("cancel_it_user");
        Socket socket = openProcess(cookie);
        BufferedReader reader = readerOf(socket);
        try {
            readUntil(reader, "event:init");
            readUntil(reader, "event:progress");
            assertThat(engineEntered.await(10, TimeUnit.SECONDS)).isTrue();

            socket.setSoLinger(true, 0);
            socket.close();
            Thread.sleep(1_500);
        } finally {
            release.countDown();
        }

        // then
        List<Note> stillDirty = noteRepository.findDirtyNotes(user.getId(), false);
        assertThat(stillDirty).extracting(Note::getId).contains(note.getId());
        assertThat(stillDirty).allMatch(n -> n.getLastProcessedAt() == null);

        List<Task> tasks = taskRepository.findAll();
        assertThat(tasks).extracting(Task::getTitle).doesNotContain("SHOULD NOT PERSIST");
        assertThat(tasks).extracting(Task::getTitle).contains("PRE-EXISTING TASK");
    }

    @Test
    @DisplayName("process commits and emits done when the client stays connected")
    void process_whenClientStaysConnected_commitsAndEmitsDone() throws Exception {
        // given
        User user = userRepository.save(new User("cancel_it_user"));
        Course course = courseRepository.save(new Course("CS101", "Intro", user));
        Note note = noteRepository.save(new Note(course, "some content"));
        Task preExisting = new Task(course, "PRE-EXISTING TASK");
        preExisting.setNote(note);
        preExisting.setStatus(TaskStatus.TODO);
        taskRepository.save(preExisting);

        stubEngine();

        // when
        String cookie = login("cancel_it_user");
        Socket socket = openProcess(cookie);
        BufferedReader reader = readerOf(socket);
        try {
            readUntil(reader, "event:init");
            assertThat(engineEntered.await(10, TimeUnit.SECONDS)).isTrue();
            release.countDown();
            readUntil(reader, "event:done");
        } finally {
            release.countDown();
            socket.close();
        }

        // then
        assertThat(noteRepository.findDirtyNotes(user.getId(), false)).isEmpty();

        List<Task> tasks = taskRepository.findAll();
        assertThat(tasks).extracting(Task::getTitle).contains("SHOULD NOT PERSIST");
        assertThat(tasks).extracting(Task::getTitle).doesNotContain("PRE-EXISTING TASK");
        assertThat(tasks.stream()
                .filter(t -> "SHOULD NOT PERSIST".equals(t.getTitle()))
                .findFirst()
                .map(t -> t.getNote() != null && note.getId().equals(t.getNote().getId()))
                .orElse(false)).isTrue();
    }

    private void stubEngine() {
        when(studyPlannerEngine.process(anyList(), anyList(), anyList(), anyList(), anyList(), anyMap()))
                .thenAnswer(inv -> {
                    List<Note> notes = inv.getArgument(0);
                    Note firstNote = notes.get(0);
                    engineEntered.countDown();
                    release.await(10, TimeUnit.SECONDS);
                    return new StudyPlannerEngine.ExtractedData(
                            List.of(new StudyPlannerEngine.ExtractedTask(
                                    null, null, firstNote.getId(), "SHOULD NOT PERSIST",
                                    null, LocalDate.now(), 30)),
                            List.of(),
                            List.of());
                });
    }

    private String login(String username) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("{\"username\":\"" + username + "\"}"))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        String cookie = response.headers().firstValue("Set-Cookie")
                .orElseThrow(() -> new IllegalStateException("No Set-Cookie header on login"));
        int semicolon = cookie.indexOf(';');
        return semicolon >= 0 ? cookie.substring(0, semicolon) : cookie;
    }

    private Socket openProcess(String cookie) throws Exception {
        Socket socket = new Socket("localhost", port);
        socket.setSoTimeout(10_000);
        String request = "POST /api/study-planner/process HTTP/1.1\r\n"
                + "Host: localhost:" + port + "\r\n"
                + "Cookie: " + cookie + "\r\n"
                + "Accept: text/event-stream\r\n"
                + "Content-Length: 0\r\n"
                + "\r\n";
        OutputStream out = socket.getOutputStream();
        out.write(request.getBytes(StandardCharsets.UTF_8));
        out.flush();
        return socket;
    }

    private BufferedReader readerOf(Socket socket) throws Exception {
        return new BufferedReader(
                new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
    }

    private void readUntil(BufferedReader reader, String marker) throws Exception {
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.contains(marker)) {
                return;
            }
        }
        fail("Reached EOF without seeing marker: " + marker);
    }
}
