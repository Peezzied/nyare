package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.ai.observability.ErrorAuditPublisher;
import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.dto.UnarchiveRequest;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CourseController.class)
class CourseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CourseService courseService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private ErrorAuditPublisher errorAuditPublisher;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private static final Long USER_ID = 1L;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private CourseResponse sampleCourse;

    @BeforeEach
    void setUp() {
        sampleCourse = new CourseResponse(10L, "CS101", "Intro to CS", 1L);
        when(sessionContext.requireUserId()).thenReturn(USER_ID);
    }

    private MockHttpSession mockSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, USER_ID);
        return session;
    }

    @Test
    @DisplayName("createCourse with session user returns 201 Created and location header")
    void createCourse_withSessionUser_returnsCreated() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS");
        when(courseService.createCourse(any(CourseRequest.class), eq(USER_ID))).thenReturn(sampleCourse);

        // when & then
        mockMvc.perform(post("/api/courses")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/courses/10"))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS101"))
                .andExpect(jsonPath("$.userId").value(1));
    }

    @Test
    @DisplayName("createCourse with color echoes the color in the response")
    void createCourse_withColor_returnsColor() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS", "flamingo");
        CourseResponse coloredCourse = new CourseResponse(10L, "CS101", "Intro to CS", 1L, "flamingo");
        when(courseService.createCourse(any(CourseRequest.class), eq(USER_ID))).thenReturn(coloredCourse);

        // when & then
        mockMvc.perform(post("/api/courses")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.color").value("flamingo"));
    }

    @Test
    @DisplayName("createCourse with color over 64 characters returns 400 Bad Request")
    void createCourse_withOversizedColor_returnsBadRequest() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS101", "Intro to CS", "x".repeat(65));

        // when & then
        mockMvc.perform(post("/api/courses")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    @DisplayName("listCourses with session user returns user courses")
    void listCourses_withSession_returnsUserCourses() throws Exception {
        // given
        when(courseService.listCourses(eq(USER_ID))).thenReturn(List.of(sampleCourse));

        // when & then
        mockMvc.perform(get("/api/courses").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("CS101"));
    }

    @Test
    @DisplayName("getCourse with valid ID returns course response")
    void getCourse_withValidId_returnsCourse() throws Exception {
        // given
        when(courseService.getCourse(10L, USER_ID)).thenReturn(sampleCourse);

        // when & then
        mockMvc.perform(get("/api/courses/10").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS101"));
    }

    @Test
    @DisplayName("updateCourse with valid request returns 200 and updated course")
    void updateCourse_withValidRequest_returnsUpdatedCourse() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        CourseResponse updatedCourse = new CourseResponse(10L, "CS201", "Data Structures", 1L);
        when(courseService.updateCourse(eq(10L), any(CourseRequest.class), eq(USER_ID)))
                .thenReturn(updatedCourse);

        // when & then
        mockMvc.perform(put("/api/courses/10")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("CS201"))
                .andExpect(jsonPath("$.description").value("Data Structures"))
                .andExpect(jsonPath("$.userId").value(1));

        verify(courseService).updateCourse(eq(10L), any(CourseRequest.class), eq(USER_ID));
    }

    @Test
    @DisplayName("updateCourse with blank name returns 400 Bad Request")
    void updateCourse_withBlankName_returnsBadRequest() throws Exception {
        // given
        CourseRequest request = new CourseRequest(" ", "Data Structures");

        // when & then
        mockMvc.perform(put("/api/courses/10")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    @DisplayName("updateCourse with unknown ID returns 404 Not Found")
    void updateCourse_withUnknownId_returnsNotFound() throws Exception {
        // given
        CourseRequest request = new CourseRequest("CS201", "Data Structures");
        when(courseService.updateCourse(eq(99L), any(CourseRequest.class), eq(USER_ID)))
                .thenThrow(new ResourceNotFoundException("Course not found with ID: 99"));

        // when & then
        mockMvc.perform(put("/api/courses/99")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }

    @Test
    @DisplayName("deleteCourse with valid ID returns 204 No Content")
    void deleteCourse_withValidId_returnsNoContent() throws Exception {
        // given
        doNothing().when(courseService).deleteCourse(10L, USER_ID);

        // when & then
        mockMvc.perform(delete("/api/courses/10").session(mockSession()))
                .andExpect(status().isNoContent());

        verify(courseService).deleteCourse(10L, USER_ID);
    }

    @Test
    @DisplayName("archiveCourse with valid ID returns 200 and the archive timestamp")
    void archiveCourse_withValidId_returnsArchivedCourse() throws Exception {
        // given
        LocalDateTime archivedAt = LocalDateTime.of(2026, 1, 15, 10, 30);
        CourseResponse archivedCourse =
                new CourseResponse(10L, "CS101", "Intro to CS", 1L, null, archivedAt);
        when(courseService.archiveCourse(10L, USER_ID)).thenReturn(archivedCourse);

        // when & then
        mockMvc.perform(post("/api/courses/10/archive").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.archivedAt").value("2026-01-15T10:30:00"));

        verify(courseService).archiveCourse(10L, USER_ID);
    }

    @Test
    @DisplayName("archiveCourse with unknown ID returns 404 Not Found")
    void archiveCourse_withUnknownId_returnsNotFound() throws Exception {
        // given
        when(courseService.archiveCourse(99L, USER_ID))
                .thenThrow(new ResourceNotFoundException("Course not found with ID: 99"));

        // when & then
        mockMvc.perform(post("/api/courses/99/archive").session(mockSession()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }

    @Test
    @DisplayName("unarchiveCourse with valid ID returns 200 and a cleared archive timestamp")
    void unarchiveCourse_withValidId_returnsRestoredCourse() throws Exception {
        // given
        CourseResponse restoredCourse = new CourseResponse(10L, "CS101", "Intro to CS", 1L);
        when(courseService.unarchiveCourse(10L, USER_ID)).thenReturn(restoredCourse);

        // when & then
        mockMvc.perform(post("/api/courses/10/unarchive").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.archivedAt").doesNotExist());

        verify(courseService).unarchiveCourse(10L, USER_ID);
    }

    @Test
    @DisplayName("unarchiveCourses with valid IDs returns 200 and the restored courses")
    void unarchiveCourses_withValidIds_returnsRestoredCourses() throws Exception {
        // given
        UnarchiveRequest request = new UnarchiveRequest(List.of(10L, 11L));
        CourseResponse restoredCourse = new CourseResponse(11L, "CS102", "Data Structures", 1L);
        when(courseService.unarchiveCourses(List.of(10L, 11L), USER_ID))
                .thenReturn(List.of(sampleCourse, restoredCourse));

        // when & then
        mockMvc.perform(post("/api/courses/unarchive")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[1].id").value(11));
    }

    @Test
    @DisplayName("unarchiveCourses with an unknown ID returns 404 Not Found")
    void unarchiveCourses_withUnknownId_returnsNotFound() throws Exception {
        // given
        UnarchiveRequest request = new UnarchiveRequest(List.of(99L));
        when(courseService.unarchiveCourses(List.of(99L), USER_ID))
                .thenThrow(new ResourceNotFoundException("Course not found with ID: 99"));

        // when & then
        mockMvc.perform(post("/api/courses/unarchive")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }

    @Test
    @DisplayName("unarchiveCourses with an empty course ID list returns 400 Bad Request")
    void unarchiveCourses_withEmptyIds_returnsBadRequest() throws Exception {
        // given
        UnarchiveRequest request = new UnarchiveRequest(List.of());

        // when & then
        mockMvc.perform(post("/api/courses/unarchive")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    @DisplayName("archiveAllCourses returns 200 and the archived courses with one shared timestamp")
    void archiveAllCourses_withActiveCourses_returnsArchivedCourses() throws Exception {
        // given
        LocalDateTime archivedAt = LocalDateTime.of(2026, 1, 15, 10, 30);
        CourseResponse otherCourse =
                new CourseResponse(11L, "CS102", "Data Structures", 1L, null, archivedAt);
        CourseResponse archivedCourse =
                new CourseResponse(10L, "CS101", "Intro to CS", 1L, null, archivedAt);
        when(courseService.archiveAllCourses(USER_ID))
                .thenReturn(List.of(archivedCourse, otherCourse));

        // when & then
        mockMvc.perform(post("/api/courses/archive-all").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].archivedAt").value("2026-01-15T10:30:00"))
                .andExpect(jsonPath("$[1].id").value(11))
                .andExpect(jsonPath("$[1].archivedAt").value("2026-01-15T10:30:00"));

        verify(courseService).archiveAllCourses(USER_ID);
    }

    @Test
    @DisplayName("archiveAllCourses returns 200 and an empty list when no active courses exist")
    void archiveAllCourses_withNoActiveCourses_returnsEmptyList() throws Exception {
        // given
        when(courseService.archiveAllCourses(USER_ID)).thenReturn(List.of());

        // when & then
        mockMvc.perform(post("/api/courses/archive-all").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        verify(courseService).archiveAllCourses(USER_ID);
    }
}
