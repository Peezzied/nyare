package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.ai.observability.ErrorAuditPublisher;
import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.service.NoteService;
import org.junit.jupiter.api.BeforeEach;
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
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NoteController.class)
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NoteService noteService;

    @MockitoBean
    private SessionContext sessionContext;

    @MockitoBean
    private ErrorAuditPublisher errorAuditPublisher;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private static final Long USER_ID = 1L;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID noteId;
    private NoteResponse sampleResponse;
    private NoteSummaryResponse sampleSummary;

    @BeforeEach
    void setUp() {
        when(sessionContext.requireUserId()).thenReturn(USER_ID);
        noteId = UUID.randomUUID();
        sampleResponse = new NoteResponse(noteId, 1L, "Lecture Notes", Instant.now(), Instant.now());
        sampleSummary = new NoteSummaryResponse(noteId, 1L, "Lecture Notes", false, 13, Instant.now(), Instant.now());
    }

    private MockHttpSession mockSession() {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(UserController.SESSION_USER_ID, USER_ID);
        return session;
    }

    @Test
    void createNote_withValidPayload_returns201AndLocationHeader() throws Exception {
        // given
        NoteRequest request = new NoteRequest(1L, "Lecture Notes");
        when(noteService.createNote(any(NoteRequest.class), any())).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(post("/api/notes")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/notes/" + noteId))
                .andExpect(jsonPath("$.id").value(noteId.toString()));
    }

    @Test
    void createNote_withInvalidPayload_returns400ProblemDetail() throws Exception {
        // given
        NoteRequest request = new NoteRequest(null, null);

        // when & then
        mockMvc.perform(post("/api/notes")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void createNote_withFutureEntryDate_returns400ProblemDetail() throws Exception {
        // given
        NoteRequest request = new NoteRequest(1L, "Future content", LocalDate.now().plusDays(2));

        // when & then
        mockMvc.perform(post("/api/notes")
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void listNotes_withCourseId_returns200AndList() throws Exception {
        // given
        when(noteService.listNotes(USER_ID, 1L, false, null, null, null)).thenReturn(List.of(sampleSummary));

        // when & then
        mockMvc.perform(get("/api/notes").param("courseId", "1").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId.toString()))
                .andExpect(jsonPath("$[0].preview").value("Lecture Notes"))
                .andExpect(jsonPath("$[0].truncated").value(false));

        verify(noteService).listNotes(USER_ID, 1L, false, null, null, null);
    }

    @Test
    void listNotes_withoutCourseId_returns200AndList() throws Exception {
        // given
        when(noteService.listNotes(USER_ID, null, false, null, null, null)).thenReturn(List.of(sampleSummary));

        // when & then
        mockMvc.perform(get("/api/notes").session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId.toString()))
                .andExpect(jsonPath("$[0].preview").value("Lecture Notes"));

        verify(noteService).listNotes(USER_ID, null, false, null, null, null);
    }

    @Test
    void listNotes_withSearchParams_passesParamsToService() throws Exception {
        // given
        when(noteService.listNotes(eq(USER_ID), any(), any(), any(), any(), any()))
                .thenReturn(List.of(sampleSummary));

        // when & then
        mockMvc.perform(get("/api/notes")
                        .param("q", "lecture")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        verify(noteService).listNotes(USER_ID, null, false, "lecture",
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));
    }

    @Test
    void getNote_withExistingId_returns200() throws Exception {
        // given
        when(noteService.getNote(eq(noteId), any())).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(get("/api/notes/{id}", noteId).session(mockSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(noteId.toString()));
    }

    @Test
    void getNote_withNonExistingId_returns404ProblemDetail() throws Exception {
        // given
        when(noteService.getNote(eq(noteId), any()))
                .thenThrow(new ResourceNotFoundException("Note not found with ID: " + noteId));

        // when & then
        mockMvc.perform(get("/api/notes/{id}", noteId).session(mockSession()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }

    @Test
    void updateNote_withValidPayload_returns200() throws Exception {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated text");
        when(noteService.updateNote(eq(noteId), any(NoteRequest.class), any())).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(put("/api/notes/{id}", noteId)
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(noteId.toString()));
    }

    @Test
    void updateNote_withInvalidPayload_returns400ProblemDetail() throws Exception {
        // given
        NoteRequest request = new NoteRequest(null, null);

        // when & then
        mockMvc.perform(put("/api/notes/{id}", noteId)
                        .session(mockSession())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void deleteNote_withExistingId_returns204() throws Exception {
        // given
        doNothing().when(noteService).deleteNote(eq(noteId), any());

        // when & then
        mockMvc.perform(delete("/api/notes/{id}", noteId).session(mockSession()))
                .andExpect(status().isNoContent());

        verify(noteService).deleteNote(eq(noteId), any());
    }

    @Test
    void deleteNote_withNonExistingId_returns404ProblemDetail() throws Exception {
        // given
        doThrow(new ResourceNotFoundException("Note not found with ID: " + noteId))
                .when(noteService).deleteNote(eq(noteId), any());

        // when & then
        mockMvc.perform(delete("/api/notes/{id}", noteId).session(mockSession()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }
}
