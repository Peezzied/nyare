package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.AcademicEventRequest;
import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.service.AcademicEventService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for academic event management.
 * All endpoints delegate to {@link AcademicEventService}.
 */
@RestController
@RequestMapping("/api/academic-events")
public class AcademicEventController {

    private final AcademicEventService academicEventService;

    public AcademicEventController(AcademicEventService academicEventService) {
        this.academicEventService = academicEventService;
    }

    /**
     * Creates a new academic event and returns 201 Created with Location header.
     *
     * @param request the validated academic event creation payload
     * @return the created academic event with location header
     */
    @PostMapping
    public ResponseEntity<AcademicEventResponse> createEvent(@Valid @RequestBody AcademicEventRequest request) {
        AcademicEventResponse created = academicEventService.createEvent(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Retrieves academic events matching optional course and upcoming filters.
     *
     * @param courseId optional course identifier
     * @param upcoming optional boolean flag for upcoming events
     * @return list of matching academic events
     */
    @GetMapping
    public ResponseEntity<List<AcademicEventResponse>> listEvents(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Boolean upcoming
    ) {
        return ResponseEntity.ok(academicEventService.listEvents(courseId, upcoming));
    }

    /**
     * Retrieves an academic event by its identifier.
     *
     * @param id the unique identifier of the academic event
     * @return the academic event response
     */
    @GetMapping("/{id}")
    public ResponseEntity<AcademicEventResponse> getEvent(@PathVariable UUID id) {
        return ResponseEntity.ok(academicEventService.getEvent(id));
    }

    /**
     * Updates an academic event by its identifier.
     *
     * @param id      the unique identifier of the academic event
     * @param request the validated replacement payload
     * @return the updated academic event response
     */
    @PutMapping("/{id}")
    public ResponseEntity<AcademicEventResponse> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody AcademicEventRequest request
    ) {
        return ResponseEntity.ok(academicEventService.updateEvent(id, request));
    }

    /**
     * Deletes an academic event by its identifier.
     *
     * @param id the unique identifier of the academic event
     * @return 204 No Content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        academicEventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
