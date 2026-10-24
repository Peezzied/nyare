package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.PlannerStatusResponse;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.event.PlanningProgressEvent;
import group.four.nyare.nyare.service.StudyPlannerService;
import jakarta.servlet.AsyncEvent;
import jakarta.servlet.AsyncListener;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.mock.web.MockAsyncContext;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.asyncDispatch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(StudyPlannerController.class)
@org.springframework.test.context.TestPropertySource(properties = {
        "nyare.study-planner.sse-heartbeat-ms=60000"
})
class StudyPlannerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private StudyPlannerController studyPlannerController;

    @MockitoBean
    private StudyPlannerService studyPlannerService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private static final Long USER_ID = 1L;

    @BeforeEach
    void setUp() {
        when(sessionContext.requireUserId()).thenReturn(USER_ID);
    }

    private MockHttpSession mockSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, USER_ID);
        return session;
    }

    @Test
    void process_success_emitsInitProgressAndDoneEvents() throws Exception {
        // given
        LocalDate date = LocalDate.of(2026, 10, 1);
        PlannerStatusResponse status = new PlannerStatusResponse(
                true, 1, List.of(date), List.of("CS101"));
        ProcessSummaryResponse summary = new ProcessSummaryResponse(1, 0, 0, List.of(1L));

        when(studyPlannerService.getPlannerStatus(1L)).thenReturn(status);
        when(studyPlannerService.processNotes(eq(1L))).thenAnswer(inv -> {
            studyPlannerController.onProgress(new PlanningProgressEvent(1L, date, 1, 1));
            return summary;
        });

        // when
        MvcResult mvcResult = mockMvc.perform(post("/api/study-planner/process").session(mockSession()))
                .andExpect(request().asyncStarted())
                .andReturn();
        mvcResult.getAsyncResult(5000);

        // then
        mockMvc.perform(asyncDispatch(mvcResult))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("event:init")))
                .andExpect(content().string(containsString("event:progress")))
                .andExpect(content().string(containsString("event:done")));
    }

    @Test
    void status_duringActiveRun_servesPreFlightSnapshot() throws Exception {
        // given
        LocalDate date = LocalDate.of(2026, 10, 1);
        PlannerStatusResponse status = new PlannerStatusResponse(
                true, 1, List.of(date), List.of("CS101"));

        CountDownLatch captured = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);

        when(studyPlannerService.getPlannerStatus(1L)).thenReturn(status);
        when(studyPlannerService.processNotes(eq(1L))).thenAnswer(inv -> {
            captured.countDown();
            release.await(10, TimeUnit.SECONDS);
            return new ProcessSummaryResponse(0, 0, 0, List.of());
        });

        mockMvc.perform(post("/api/study-planner/process").session(mockSession()))
                .andExpect(request().asyncStarted())
                .andReturn();
        assertThat(captured.await(5, TimeUnit.SECONDS)).isTrue();

        try {
            // when
            mockMvc.perform(get("/api/study-planner/status").session(mockSession()))
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("\"dirtyNoteCount\":1")));

            // then: the snapshot answered; the service was not re-queried mid-run.
            verify(studyPlannerService, times(1)).getPlannerStatus(1L);
        } finally {
            release.countDown();
        }
    }

    @Test
    void process_anyRequest_disablesAsyncTimeout() throws Exception {
        // given
        PlannerStatusResponse status = new PlannerStatusResponse(
                true, 3,
                List.of(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 2), LocalDate.of(2026, 10, 3)),
                List.of("CS101"));

        when(studyPlannerService.getPlannerStatus(1L)).thenReturn(status);
        when(studyPlannerService.processNotes(eq(1L)))
                .thenReturn(new ProcessSummaryResponse(0, 0, 0, List.of()));

        // when
        MvcResult mvcResult = mockMvc.perform(post("/api/study-planner/process").session(mockSession()))
                .andExpect(request().asyncStarted())
                .andReturn();
        mvcResult.getAsyncResult(5000);

        // then
        assertThat(mvcResult.getRequest().getAsyncContext().getTimeout()).isLessThanOrEqualTo(0);
    }

    @Test
    void process_asyncError_interruptsWorkerThread() throws Exception {
        // given
        LocalDate date = LocalDate.of(2026, 10, 1);
        PlannerStatusResponse status = new PlannerStatusResponse(
                true, 1, List.of(date), List.of("CS101"));

        CountDownLatch captured = new CountDownLatch(1);
        CountDownLatch interrupted = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        AtomicReference<Thread> workerThreadRef = new AtomicReference<>();

        when(studyPlannerService.getPlannerStatus(1L)).thenReturn(status);
        when(studyPlannerService.processNotes(eq(1L))).thenAnswer(inv -> {
            workerThreadRef.set(Thread.currentThread());
            captured.countDown();
            try {
                release.await(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                interrupted.countDown();
                Thread.currentThread().interrupt();
            }
            return new ProcessSummaryResponse(0, 0, 0, List.of());
        });

        // when
        MvcResult mvcResult = mockMvc.perform(post("/api/study-planner/process").session(mockSession()))
                .andExpect(request().asyncStarted())
                .andReturn();

        assertThat(captured.await(5, TimeUnit.SECONDS)).isTrue();

        MockAsyncContext asyncContext = (MockAsyncContext) mvcResult.getRequest().getAsyncContext();
        for (AsyncListener listener : asyncContext.getListeners()) {
            listener.onError(new AsyncEvent(asyncContext, asyncContext.getRequest(),
                    asyncContext.getResponse(), new IOException("client gone")));
        }

        // then
        assertThat(interrupted.await(5, TimeUnit.SECONDS)).isTrue();
        assertThat(workerThreadRef.get()).isNotNull();
        assertThat(workerThreadRef.get().isInterrupted()).isTrue();

        release.countDown();
    }
}
