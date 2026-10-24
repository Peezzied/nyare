package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.service.AcademicEventService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AcademicEventController.class)
class AcademicEventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AcademicEventService academicEventService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private static final Long USER_ID = 1L;

    private UUID sampleId;
    private AcademicEventResponse sampleEvent;

    @BeforeEach
    void setUp() {
        when(sessionContext.requireUserId()).thenReturn(USER_ID);
        sampleId = UUID.randomUUID();
        sampleEvent = new AcademicEventResponse(
                sampleId,
                10L,
                null,
                "Midterm Exam",
                "Exam in Hall A",
                LocalDateTime.now().plusDays(5),
                Instant.now()
        );
    }

    private MockHttpSession mockSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, USER_ID);
        return session;
    }

    @Test
    @DisplayName("listEvents with session user passes userId to service")
    void listEvents_withSessionUser_passesUserIdToService() throws Exception {
        // given
        when(academicEventService.listEvents(eq(USER_ID), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(sampleEvent));

        // when & then
        mockMvc.perform(get("/api/academic-events").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Midterm Exam"));

        verify(academicEventService).listEvents(USER_ID, null, null, false, null, null, null);
    }

    @Test
    @DisplayName("listEvents binds q, from, and to request params")
    void listEvents_withSearchParams_passesParamsToService() throws Exception {
        // given
        when(academicEventService.listEvents(eq(USER_ID), any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(sampleEvent));

        // when & then
        mockMvc.perform(get("/api/academic-events")
                        .param("q", "midterm")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(academicEventService).listEvents(USER_ID, null, null, false, "midterm",
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));
    }
}
