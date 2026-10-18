package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.service.AcademicEventService;
import group.four.nyare.nyare.service.CourseService;
import group.four.nyare.nyare.service.ImageService;
import group.four.nyare.nyare.service.NoteService;
import group.four.nyare.nyare.service.ScheduleService;
import group.four.nyare.nyare.service.StudyPlannerService;
import group.four.nyare.nyare.service.TaskService;
import group.four.nyare.nyare.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.List;
import java.util.stream.Stream;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest
class SessionEnforcementControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private CourseService courseService;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private NoteService noteService;

    @MockitoBean
    private ScheduleService scheduleService;

    @MockitoBean
    private AcademicEventService academicEventService;

    @MockitoBean
    private StudyPlannerService studyPlannerService;

    @MockitoBean
    private ImageService imageService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/courses",
            "/api/tasks",
            "/api/notes",
            "/api/schedules",
            "/api/academic-events",
            "/api/study-planner/status"
    })
    void protectedGet_withoutSession_returnsUnauthorized(String path) throws Exception {
        // given
        // no session is attached to the request

        // when & then
        mockMvc.perform(get(path))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    void login_withoutSession_returnsValidationError() throws Exception {
        // given
        // no session is attached to the request

        // when & then
        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listUsers_withoutSession_returnsOk() throws Exception {
        // given
        when(userService.listUsers()).thenReturn(List.of());

        // when & then
        mockMvc.perform(get("/api/users"))
                .andExpect(status().isOk());
    }

    private enum ServiceSelector {
        COURSE, TASK, NOTE, PLANNER
    }

    private record WriteCase(String method, String path, ServiceSelector service) {
    }

    private static Stream<WriteCase> writeCases() {
        return Stream.of(
                new WriteCase("POST", "/api/courses", ServiceSelector.COURSE),
                new WriteCase("POST", "/api/tasks", ServiceSelector.TASK),
                new WriteCase("POST", "/api/notes", ServiceSelector.NOTE),
                new WriteCase("PUT", "/api/notes/00000000-0000-0000-0000-000000000001", ServiceSelector.NOTE),
                new WriteCase("DELETE", "/api/courses/1", ServiceSelector.COURSE),
                new WriteCase("PATCH", "/api/tasks/00000000-0000-0000-0000-000000000001/status", ServiceSelector.TASK),
                new WriteCase("POST", "/api/study-planner/process", ServiceSelector.PLANNER)
        );
    }

    private Object serviceFor(ServiceSelector selector) {
        return switch (selector) {
            case COURSE -> courseService;
            case TASK -> taskService;
            case NOTE -> noteService;
            case PLANNER -> studyPlannerService;
        };
    }

    @ParameterizedTest
    @MethodSource("writeCases")
    void protectedWrite_withoutSession_returnsUnauthorizedAndNoServiceCall(WriteCase writeCase) throws Exception {
        // given
        // no session is attached to the request
        Object service = serviceFor(writeCase.service());
        MockHttpServletRequestBuilder builder = request(HttpMethod.valueOf(writeCase.method()), writeCase.path())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}");

        // when
        mockMvc.perform(builder).andExpect(status().isUnauthorized());

        // then
        verifyNoInteractions(service);
    }

    @Test
    void uploadImage_withoutSession_returnsUnauthorizedAndNoServiceCall() throws Exception {
        // given
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.png", MediaType.IMAGE_PNG_VALUE, new byte[]{1});

        // when
        mockMvc.perform(multipart("/api/images").file(file)).andExpect(status().isUnauthorized());

        // then
        verifyNoInteractions(imageService);
    }
}
