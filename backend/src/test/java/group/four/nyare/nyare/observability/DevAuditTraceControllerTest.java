package group.four.nyare.nyare.observability;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.observability.controller.DevAuditTraceController;
import group.four.nyare.nyare.observability.dto.AiEngineInfoDto;
import group.four.nyare.nyare.observability.dto.AuditTraceEventDto;
import group.four.nyare.nyare.observability.dto.CategoryGroupDto;
import group.four.nyare.nyare.observability.dto.CourseTraceSummaryDto;
import group.four.nyare.nyare.observability.dto.DatabaseInfoDto;
import group.four.nyare.nyare.observability.dto.DevDashboardViewModel;
import group.four.nyare.nyare.observability.dto.TraceNodeDto;
import group.four.nyare.nyare.observability.dto.TraceNodeStubDto;
import group.four.nyare.nyare.observability.service.DevAuditTraceService;
import group.four.nyare.nyare.observability.stream.DevAuditTraceStream;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.model;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.view;

@WebMvcTest(DevAuditTraceController.class)
class DevAuditTraceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DevAuditTraceService service;

    @MockitoBean
    private DevAuditTraceStream auditStream;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @Test
    void dashboard_withRetainedEvents_returnsViewAndModelAttributes() throws Exception {
        // given
        DevDashboardViewModel viewModel = new DevDashboardViewModel(
                List.of(), List.of(),
                List.of(new CategoryGroupDto(
                        "AI_ENGINE", "AI engine", List.of(AuditCategory.LIFECYCLE))),
                List.of(AuditSeverity.values()), 3,
                new AiEngineInfoDto("google-genai", "gemini-3.5-flash-lite", 0.1, 0.8, 20, 4096),
                new DatabaseInfoDto("SQLite", "jdbc:sqlite:nyare.db", "D:\\data\\nyare.db"));
        when(service.getDashboardView()).thenReturn(viewModel);

        // when & then
        mockMvc.perform(get("/dev/observability"))
                .andExpect(status().isOk())
                .andExpect(view().name("observability/dashboard"))
                .andExpect(model().attribute("events", viewModel.events()))
                .andExpect(model().attribute("courses", viewModel.courses()))
                .andExpect(model().attribute("categoryGroups", viewModel.categoryGroups()))
                .andExpect(model().attribute("severities", viewModel.severities()))
                .andExpect(model().attribute("totalRetained", 3))
                .andExpect(model().attribute("aiEngine", viewModel.aiEngine()))
                .andExpect(model().attribute("database", viewModel.database()));
    }

    @Test
    void courses_withStoredCourses_returnsSummaryJsonArray() throws Exception {
        // given
        when(service.listCourses()).thenReturn(List.of(
                new CourseTraceSummaryDto(1L, "CS101", "peacock", "#039BE5"),
                new CourseTraceSummaryDto(2L, "MATH201", "basil", "#0B8043")));

        // when & then
        mockMvc.perform(get("/dev/observability/courses"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("CS101"))
                .andExpect(jsonPath("$[0].color").value("peacock"))
                .andExpect(jsonPath("$[0].colorHex").value("#039BE5"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("MATH201"))
                .andExpect(jsonPath("$[1].color").value("basil"))
                .andExpect(jsonPath("$[1].colorHex").value("#0B8043"));

        verify(service).listCourses();
    }

    @Test
    void node_withValidKind_returnsTraceNodeJson() throws Exception {
        // given
        String id = UUID.randomUUID().toString();
        TraceNodeDto node = new TraceNodeDto(
                TraceKind.note, id, "Lecture 4 Notes", "PROCESSED",
                false, null, Map.of("entryDate", "2026-10-24"), List.of());
        when(service.resolveNode("note", id)).thenReturn(node);

        // when & then
        mockMvc.perform(get("/dev/observability/node/note/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kind").value("note"))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.displayTitle").value("Lecture 4 Notes"))
                .andExpect(jsonPath("$.status").value("PROCESSED"))
                .andExpect(jsonPath("$.isDeleted").value(false));
    }

    @Test
    void node_withUnknownRecord_returnsNotFoundProblemDetail() throws Exception {
        // given
        when(service.resolveNode("note", "unknown-id"))
                .thenThrow(new ResourceNotFoundException(
                        "Record of kind 'note' with id 'unknown-id' not found"));

        // when & then
        mockMvc.perform(get("/dev/observability/node/note/unknown-id"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail")
                        .value("Record of kind 'note' with id 'unknown-id' not found"));
    }

    @Test
    void references_withRetainedEvent_returnsResolvedStubs() throws Exception {
        // given
        UUID eventId = UUID.randomUUID();
        AuditTraceEventDto event = mock(AuditTraceEventDto.class);
        List<TraceNodeStubDto> stubs = List.of(
                new TraceNodeStubDto(TraceKind.task, "t-1", "Read Chapter 3", "scheduled", true));
        when(service.getEvent(eventId)).thenReturn(Optional.of(event));
        when(service.resolveReferences(event)).thenReturn(stubs);

        // when & then
        mockMvc.perform(get("/dev/observability/refs/{eventId}", eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].kind").value("task"))
                .andExpect(jsonPath("$[0].title").value("Read Chapter 3"))
                .andExpect(jsonPath("$[0].isExact").value(true));

        verify(service).resolveReferences(event);
    }

    @Test
    void references_withUnknownEvent_returnsNotFoundProblemDetail() throws Exception {
        // given
        UUID eventId = UUID.randomUUID();
        when(service.getEvent(eventId)).thenReturn(Optional.empty());

        // when & then
        mockMvc.perform(get("/dev/observability/refs/{eventId}", eventId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void feed_withAllParams_passesThemToService() throws Exception {
        // given
        when(service.getFeed(List.of(AuditCategory.LIFECYCLE), AuditSeverity.ERROR, 25))
                .thenReturn(List.of());

        // when & then
        mockMvc.perform(get("/dev/observability/feed")
                        .param("category", "LIFECYCLE")
                        .param("severity", "ERROR")
                        .param("limit", "25"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(service).getFeed(List.of(AuditCategory.LIFECYCLE), AuditSeverity.ERROR, 25);
    }

    @Test
    void feed_withRepeatedCategoryParams_passesCategoryListToService() throws Exception {
        // given
        List<AuditCategory> categories = List.of(
                AuditCategory.LIFECYCLE, AuditCategory.TASK_PLANNING);
        when(service.getFeed(categories, null, 500)).thenReturn(List.of());

        // when & then
        mockMvc.perform(get("/dev/observability/feed")
                        .param("category", "LIFECYCLE")
                        .param("category", "TASK_PLANNING"))
                .andExpect(status().isOk());

        verify(service).getFeed(categories, null, 500);
    }

    @Test
    void feed_withNoParams_usesDefaultLimitAndNoFilters() throws Exception {
        // given
        when(service.getFeed(null, null, 500)).thenReturn(List.of());

        // when & then
        mockMvc.perform(get("/dev/observability/feed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(service).getFeed(null, null, 500);
    }

    @Test
    void feed_withLimitAboveMax_passesLimitForServiceClamping() throws Exception {
        // given
        when(service.getFeed(null, null, 999)).thenReturn(List.of());

        // when & then
        mockMvc.perform(get("/dev/observability/feed").param("limit", "999"))
                .andExpect(status().isOk());

        verify(service).getFeed(null, null, 999);
    }

    @Test
    void stream_onConnect_returnsEventStreamAndSubscribes() throws Exception {
        // given
        when(auditStream.subscribe()).thenReturn(new SseEmitter(0L));

        // when & then
        mockMvc.perform(get("/dev/observability/stream"))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andExpect(content().contentTypeCompatibleWith("text/event-stream"));

        verify(auditStream).subscribe();
    }
}
