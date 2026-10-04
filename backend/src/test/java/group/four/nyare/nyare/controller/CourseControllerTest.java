package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.service.CourseService;
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

import java.util.List;

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

@WebMvcTest(CourseController.class)
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CourseService courseService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private CourseResponse sampleCourse;

    @BeforeEach
    void setUp() {
        sampleCourse = new CourseResponse(10L, "CS101", "Intro to CS", 1L);
    }

    @Test
    @DisplayName("createCourse with session user returns 201 Created and location header")
    void createCourse_withSessionUser_returnsCreated() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        when(courseService.createCourse(any(CourseRequest.class), eq(1L))).thenReturn(sampleCourse);

        // when & then
        mockMvc.perform(post("/api/courses")
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/courses/10"))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS101"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    @DisplayName("listCourses with session user returns user courses")
    void listCourses_withSession_returnsUserCourses() throws Exception {
        // given
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, 1L);
        when(courseService.listCourses(eq(1L), any())).thenReturn(List.of(sampleCourse));

        // when & then
        mockMvc.perform(get("/api/courses").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("CS101"));
    }

    @Test
    @DisplayName("getCourse with valid ID returns course response")
    void getCourse_withValidId_returnsCourse() throws Exception {
        // given
        when(courseService.getCourse(10L)).thenReturn(sampleCourse);

        // when & then
        mockMvc.perform(get("/api/courses/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS101"));
    }

    @Test
    @DisplayName("deleteCourse with valid ID returns 204 No Content")
    void deleteCourse_withValidId_returnsNoContent() throws Exception {
        // given
        doNothing().when(courseService).deleteCourse(10L);

        // when & then
        mockMvc.perform(delete("/api/courses/10"))
                .andExpect(status().isNoContent());

        verify(courseService).deleteCourse(10L);
    }
}
