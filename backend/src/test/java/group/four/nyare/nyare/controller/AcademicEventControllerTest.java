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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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

    private UUID sampleId;
    private AcademicEventResponse sampleEvent;

    @BeforeEach
    void setUp() {
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

    @Test
    @DisplayName("listEvents with session user passes userId to service")
    void listEvents_withSessionUser_passesUserIdToService() throws Exception {
        // given
        when(sessionContext.getUserId()).thenReturn(Optional.of(42L));
        when(academicEventService.listEvents(eq(42L), any(), any())).thenReturn(List.of(sampleEvent));

        // when & then
        mockMvc.perform(get("/api/academic-events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Midterm Exam"));

        verify(academicEventService).listEvents(42L, null, null);
    }
}
