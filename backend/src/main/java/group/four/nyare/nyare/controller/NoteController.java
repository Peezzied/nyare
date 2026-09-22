package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.ImageMetadataUpdateRequest;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * REST controller managing journal notes.
 */
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public ResponseEntity<NoteResponse> createNote(@Valid @RequestBody NoteRequest request) {
        NoteResponse createdNote = noteService.createNote(request);
        URI location = URI.create("/api/notes/" + createdNote.getId());
        return ResponseEntity.created(location).body(createdNote);
    }

    @GetMapping
    public ResponseEntity<List<NoteResponse>> listNotes(@RequestParam Long courseId) {
        List<NoteResponse> notes = noteService.listNotes(courseId);
        return ResponseEntity.ok(notes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteResponse> getNote(@PathVariable UUID id) {
        NoteResponse note = noteService.getNote(id);
        return ResponseEntity.ok(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteResponse> updateNote(@PathVariable UUID id, @Valid @RequestBody NoteRequest request) {
        NoteResponse updatedNote = noteService.updateNote(id, request);
        return ResponseEntity.ok(updatedNote);
    }

    @PatchMapping("/{id}/image-metadata")
    public ResponseEntity<NoteResponse> updateImageMetadata(@PathVariable UUID id,
                                                           @Valid @RequestBody ImageMetadataUpdateRequest request) {
        NoteResponse updatedNote = noteService.updateImageMetadata(id, request);
        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID id) {
        noteService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }
}
