package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.TaskRequest;
import group.four.nyare.nyare.dto.TaskResponse;
import group.four.nyare.nyare.model.enums.PlanCategory;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private static final Long USER_ID = 1L;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID sampleId;
    private TaskResponse sampleTask;

    @BeforeEach
    void setUp() {
        when(sessionContext.requireUserId()).thenReturn(USER_ID);
        sampleId = UUID.randomUUID();
        sampleTask = new TaskResponse(
                sampleId,
                1L,
                null,
                "Study Chapter 1",
                "Description",
                LocalDate.now().plusDays(1),
                Duration.ofMinutes(45),
                TaskStatus.TODO,
                PlanCategory.SCHEDULED,
                Instant.now(),
                Instant.now()
        );
    }

    private MockHttpSession mockSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, USER_ID);
        return session;
    }

    @Test
    @DisplayName("listTasks with session user passes userId to service")
    void listTasks_withSessionUser_passesUserIdToService() throws Exception {
        // given
        when(taskService.listTasks(eq(USER_ID), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(sampleTask));

        // when & then
        mockMvc.perform(get("/api/tasks").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Study Chapter 1"));

        verify(taskService).listTasks(USER_ID, null, null, null, false, null, null, null);
    }

    @Test
    @DisplayName("listTasks binds q, from, and to request params")
    void listTasks_withSearchParams_passesParamsToService() throws Exception {
        // given
        when(taskService.listTasks(eq(USER_ID), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(sampleTask));

        // when & then
        mockMvc.perform(get("/api/tasks")
                        .param("q", "exam")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(taskService).listTasks(USER_ID, null, null, null, false, "exam",
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));
    }

    @Test
    @DisplayName("createTask with valid request returns 201 Created")
    void createTask_withValidRequest_returnsCreated() throws Exception {
        // given
        TaskRequest request = new TaskRequest(1L, "Study Chapter 1", "Description", null, null, TaskStatus.TODO);
        when(taskService.createTask(any(TaskRequest.class), any())).thenReturn(sampleTask);

        // when & then
        mockMvc.perform(post("/api/tasks")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/tasks/" + sampleId))
                .andExpect(jsonPath("$.id").value(sampleId.toString()));
    }

    @Test
    @DisplayName("getTask with valid ID returns task")
    void getTask_withValidId_returnsTask() throws Exception {
        // given
        when(taskService.getTask(eq(sampleId), any())).thenReturn(sampleTask);

        // when & then
        mockMvc.perform(get("/api/tasks/" + sampleId).session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Study Chapter 1"));
    }

    @Test
    @DisplayName("deleteTask with valid ID returns 204 No Content")
    void deleteTask_withValidId_returnsNoContent() throws Exception {
        // given
        doNothing().when(taskService).deleteTask(eq(sampleId), any());

        // when & then
        mockMvc.perform(delete("/api/tasks/" + sampleId).session(mockSession()))
                .andExpect(status().isNoContent());

        verify(taskService).deleteTask(eq(sampleId), any());
    }
}
