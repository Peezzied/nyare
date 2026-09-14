# DTO & Validation Guidelines

## 1. Class-Based POJOs

- DTOs are standard Java classes with no-argument constructors, all-argument constructors, and standard getters/setters.
- Request DTOs: named `XxxRequest` (e.g. `TaskRequest`, `AcademicEventRequest`).
- Response DTOs: named `XxxResponse` (e.g. `TaskResponse`, `AcademicEventResponse`).

## 2. Jakarta Bean Validation

Declare validation annotations directly on request DTO fields:
```java
public class AcademicEventRequest {
    @NotNull(message = "Course ID is required")
    private Long courseId;

    private UUID noteId;

    @NotBlank(message = "Event title is required")
    @Size(max = 255, message = "Event title cannot exceed 255 characters")
    private String title;

    @Size(max = 2048, message = "Event description cannot exceed 2048 characters")
    private String description;

    @NotNull(message = "Deadline is required")
    private LocalDateTime deadline;
}
```

## 3. Explicit Service Mapping

The service implementation maps explicitly between entities and DTOs using standard Java methods:
```java
private AcademicEventResponse toResponse(AcademicEvent event) {
    AcademicEventResponse res = new AcademicEventResponse();
    res.setId(event.getId());
    res.setCourseId(event.getCourse().getId());
    res.setNoteId(event.getNote() != null ? event.getNote().getId() : null);
    res.setTitle(event.getTitle());
    res.setDescription(event.getDescription());
    res.setDeadline(event.getDeadline());
    res.setCreatedAt(event.getCreatedAt());
    return res;
}
```
No reflection-based or magic mapper libraries are required.
