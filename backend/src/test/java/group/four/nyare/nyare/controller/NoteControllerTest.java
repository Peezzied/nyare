package group.four.nyare.nyare.controller;

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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NoteController.class)
class NoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NoteService noteService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID noteId;
    private NoteResponse sampleResponse;
    private NoteSummaryResponse sampleSummary;

    @BeforeEach
    void setUp() {
        noteId = UUID.randomUUID();
        sampleResponse = new NoteResponse(noteId, 1L, "Lecture Notes", Instant.now(), Instant.now());
        sampleSummary = new NoteSummaryResponse(noteId, 1L, "Lecture Notes", false, 13, Instant.now(), Instant.now());
    }

    @Test
    void createNote_withValidPayload_returns201AndLocationHeader() throws Exception {
        // given
        NoteRequest request = new NoteRequest(1L, "Lecture Notes");
        when(noteService.createNote(any(NoteRequest.class))).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(post("/api/notes")
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void listNotes_withCourseId_returns200AndList() throws Exception {
        // given
        when(noteService.listNotes(1L)).thenReturn(List.of(sampleSummary));

        // when & then
        mockMvc.perform(get("/api/notes").param("courseId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId.toString()))
                .andExpect(jsonPath("$[0].preview").value("Lecture Notes"))
                .andExpect(jsonPath("$[0].truncated").value(false));
    }

    @Test
    void listNotes_withoutCourseId_returns200AndList() throws Exception {
        // given
        when(noteService.listNotes(null)).thenReturn(List.of(sampleSummary));

        // when & then
        mockMvc.perform(get("/api/notes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(noteId.toString()))
                .andExpect(jsonPath("$[0].preview").value("Lecture Notes"));
    }

    @Test
    void getNote_withExistingId_returns200() throws Exception {
        // given
        when(noteService.getNote(noteId)).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(get("/api/notes/{id}", noteId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(noteId.toString()));
    }

    @Test
    void getNote_withNonExistingId_returns404ProblemDetail() throws Exception {
        // given
        when(noteService.getNote(noteId))
                .thenThrow(new ResourceNotFoundException("Note not found with ID: " + noteId));

        // when & then
        mockMvc.perform(get("/api/notes/{id}", noteId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }

    @Test
    void updateNote_withValidPayload_returns200() throws Exception {
        // given
        NoteRequest request = new NoteRequest(1L, "Updated text");
        when(noteService.updateNote(eq(noteId), any(NoteRequest.class))).thenReturn(sampleResponse);

        // when & then
        mockMvc.perform(put("/api/notes/{id}", noteId)
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"));
    }

    @Test
    void deleteNote_withExistingId_returns204() throws Exception {
        // given
        doNothing().when(noteService).deleteNote(noteId);

        // when & then
        mockMvc.perform(delete("/api/notes/{id}", noteId))
                .andExpect(status().isNoContent());

        verify(noteService).deleteNote(noteId);
    }

    @Test
    void deleteNote_withNonExistingId_returns404ProblemDetail() throws Exception {
        // given
        doThrow(new ResourceNotFoundException("Note not found with ID: " + noteId))
                .when(noteService).deleteNote(noteId);

        // when & then
        mockMvc.perform(delete("/api/notes/{id}", noteId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Resource Not Found"));
    }
}
