package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * REST controller managing journal notes.
 */
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;
    private final SessionContext sessionContext;

    public NoteController(NoteService noteService, SessionContext sessionContext) {
        this.noteService = noteService;
        this.sessionContext = sessionContext;
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(@Valid @RequestBody NoteRequest request) {
        NoteResponse createdNote = noteService.createNote(request, sessionContext.requireUserId());
        URI location = URI.create("/api/notes/" + createdNote.getId());
        return ResponseEntity.created(location).body(createdNote);
    }

    @GetMapping
    public ResponseEntity<List<NoteSummaryResponse>> listNotes(
            @RequestParam(required = false) Long courseId,
            @RequestParam(defaultValue = "false") Boolean archived,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to) {
        Long userId = sessionContext.requireUserId();
        List<NoteSummaryResponse> notes = noteService.listNotes(userId, courseId, archived, q, from, to);
        return ResponseEntity.ok(notes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getNote(@PathVariable UUID id) {
        NoteResponse note = noteService.getNote(id, sessionContext.requireUserId());
        return ResponseEntity.ok(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(@PathVariable UUID id, @Valid @RequestBody NoteRequest request) {
        NoteResponse updatedNote = noteService.updateNote(id, request, sessionContext.requireUserId());
        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID id) {
        noteService.deleteNote(id, sessionContext.requireUserId());
        return ResponseEntity.noContent().build();
    }
}
