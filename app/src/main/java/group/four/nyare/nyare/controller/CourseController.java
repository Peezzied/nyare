package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.dto.UnarchiveRequest;
import group.four.nyare.nyare.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

/**
 * REST controller managing course offerings.
 */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final SessionContext sessionContext;

    public CourseController(CourseService courseService, SessionContext sessionContext) {
        this.courseService = courseService;
        this.sessionContext = sessionContext;
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request) {
        CourseResponse createdCourse = courseService.createCourse(request, sessionContext.requireUserId());
        URI location = URI.create("/api/courses/" + createdCourse.getId());
        return ResponseEntity.created(location).body(createdCourse);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> listCourses(
            @RequestParam(defaultValue = "false") Boolean archived) {
        Long userId = sessionContext.requireUserId();
        List<CourseResponse> courses = archived
                ? courseService.listArchivedCourses(userId)
                : courseService.listCourses(userId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable Long id) {
        CourseResponse course = courseService.getCourse(id, sessionContext.requireUserId());
        return ResponseEntity.ok(course);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.updateCourse(id, request, sessionContext.requireUserId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id, sessionContext.requireUserId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<CourseResponse> archiveCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.archiveCourse(id, sessionContext.requireUserId()));
    }

    @PostMapping("/{id}/unarchive")
    public ResponseEntity<CourseResponse> unarchiveCourse(@PathVariable Long id) {
        return ResponseEntity.ok(courseService.unarchiveCourse(id, sessionContext.requireUserId()));
    }

    @PostMapping("/archive-all")
    public ResponseEntity<List<CourseResponse>> archiveAllCourses() {
        return ResponseEntity.ok(courseService.archiveAllCourses(sessionContext.requireUserId()));
    }

    @PostMapping("/unarchive")
    public ResponseEntity<List<CourseResponse>> unarchiveCourses(
            @Valid @RequestBody UnarchiveRequest request) {
        return ResponseEntity.ok(
                courseService.unarchiveCourses(request.getCourseIds(), sessionContext.requireUserId()));
    }
}
