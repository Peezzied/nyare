package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.UserSettingsRequest;
import group.four.nyare.nyare.dto.UserSettingsResponse;
import group.four.nyare.nyare.service.UserSettingsService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SettingsController.class)
class SettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserSettingsService userSettingsService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private static final Long USER_ID = 1L;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UserSettingsResponse sampleSettings;

    @BeforeEach
    void setUp() {
        when(sessionContext.requireUserId()).thenReturn(USER_ID);
        sampleSettings = new UserSettingsResponse(21, 30);
    }

    private MockHttpSession mockSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, USER_ID);
        return session;
    }

    @Test
    @DisplayName("getSettings returns 200 with the session user's horizons")
    void getSettings_authenticatedSession_returnsSettings() throws Exception {
        // given
        when(userSettingsService.getSettings(USER_ID)).thenReturn(sampleSettings);

        // when & then
        mockMvc.perform(get("/api/settings").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planningHorizonDays").value(21))
                .andExpect(jsonPath("$.backdatingHorizonDays").value(30));

        verify(userSettingsService).getSettings(USER_ID);
    }

    @Test
    @DisplayName("updateSettings returns 200 with the persisted horizons for a valid payload")
    void updateSettings_validRequest_returnsUpdatedSettings() throws Exception {
        // given
        UserSettingsRequest request = new UserSettingsRequest(21, 30);
        when(userSettingsService.updateSettings(eq(USER_ID), any(UserSettingsRequest.class)))
                .thenReturn(sampleSettings);

        // when & then
        mockMvc.perform(put("/api/settings")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planningHorizonDays").value(21))
                .andExpect(jsonPath("$.backdatingHorizonDays").value(30));

        verify(userSettingsService).updateSettings(eq(USER_ID), any(UserSettingsRequest.class));
    }

    @Test
    @DisplayName("updateSettings returns 400 when a horizon is below the minimum bound")
    void updateSettings_belowMinimum_returnsBadRequest() throws Exception {
        // given
        UserSettingsRequest request = new UserSettingsRequest(0, 30);

        // when & then
        mockMvc.perform(put("/api/settings")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("updateSettings returns 400 when a horizon exceeds the maximum bound")
    void updateSettings_aboveMaximum_returnsBadRequest() throws Exception {
        // given
        UserSettingsRequest request = new UserSettingsRequest(21, 61);

        // when & then
        mockMvc.perform(put("/api/settings")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("updateSettings returns 400 when a horizon is missing")
    void updateSettings_missingField_returnsBadRequest() throws Exception {
        // given
        String payload = "{\"planningHorizonDays\":21}";

        // when & then
        mockMvc.perform(put("/api/settings")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
