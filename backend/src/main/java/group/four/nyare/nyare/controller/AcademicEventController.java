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


@RestController
@RequestMapping("/api/academic-events")
public class AcademicEventController {

    private final AcademicEventService academicEventService;

    public AcademicEventController(AcademicEventService academicEventService) {
        this.academicEventService = academicEventService;
    }


    @PostMapping
    public ResponseEntity<AcademicEventResponse> createEvent(@Valid @RequestBody AcademicEventRequest request) {
        AcademicEventResponse created = academicEventService.createEvent(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }


    @GetMapping
    public ResponseEntity<List<AcademicEventResponse>> listEvents(
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Boolean upcoming
    ) {
        return ResponseEntity.ok(academicEventService.listEvents(courseId, upcoming));
    }


    @GetMapping("/{id}")
    public ResponseEntity<AcademicEventResponse> getEvent(@PathVariable UUID id) {
        return ResponseEntity.ok(academicEventService.getEvent(id));
    }


    @PutMapping("/{id}")
    public ResponseEntity<AcademicEventResponse> updateEvent(
            @PathVariable UUID id,
            @Valid @RequestBody AcademicEventRequest request
    ) {
        return ResponseEntity.ok(academicEventService.updateEvent(id, request));
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable UUID id) {
        academicEventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
