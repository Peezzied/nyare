package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.LoginRequest;
import group.four.nyare.nyare.dto.UserRequest;
import group.four.nyare.nyare.dto.UserResponse;
import group.four.nyare.nyare.service.UserService;
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

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UserResponse sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = new UserResponse(1L, "alice", Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("createUser returns 201 Created and location header for valid request")
    void createUser_withValidRequest_returnsCreated() throws Exception {
        // given
        UserRequest request = new UserRequest("alice");
        when(userService.createUser(any(UserRequest.class))).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/users/1"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    @DisplayName("createUser returns 400 Bad Request when username is blank")
    void createUser_withInvalidUsername_returnsBadRequest() throws Exception {
        // given
        UserRequest request = new UserRequest("");

        // when & then
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("listUsers returns list of users")
    void listUsers_returnsList() throws Exception {
        // given
        when(userService.listUsers()).thenReturn(List.of(sampleUser));

        // when & then
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].username").value("alice"));
    }

    @Test
    @DisplayName("getUserById returns user when ID exists")
    void getUserById_withValidId_returnsUser() throws Exception {
        // given
        when(userService.getUserById(1L)).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(get("/api/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    @DisplayName("login sets session attribute and returns user response")
    void login_withValidUsername_setsSessionAttributeAndReturnsUser() throws Exception {
        // given
        LoginRequest request = new LoginRequest("alice");
        when(userService.authenticate(any(LoginRequest.class))).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(request().sessionAttribute(UserController.SESSION_USER_ID, 1L))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    @DisplayName("logout invalidates existing session")
    void logout_withActiveSession_invalidatesSession() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);

        // when & then
        mockMvc.perform(post("/api/users/logout").session(session))
                .andExpect(status().isNoContent());

        assertThat(session.isInvalid()).isTrue();
    }

    @Test
    @DisplayName("getCurrentUser returns user when session is active")
    void getCurrentUser_withActiveSession_returnsUser() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        when(userService.getUserById(1L)).thenReturn(sampleUser);

        // when & then
        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    @DisplayName("getCurrentUser returns 401 Unauthorized when session is missing")
    void getCurrentUser_withoutActiveSession_returnsUnauthorized() throws Exception {
        // when & then
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("deleteUser invalidates session when deleted user is active session user")
    void deleteUser_withActiveSession_invalidatesSessionAndReturnsNoContent() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        doNothing().when(userService).deleteUser(1L);

        // when & then
        mockMvc.perform(delete("/api/users/1").session(session))
                .andExpect(status().isNoContent());

        verify(userService).deleteUser(1L);
        assertThat(session.isInvalid()).isTrue();
    }
}
