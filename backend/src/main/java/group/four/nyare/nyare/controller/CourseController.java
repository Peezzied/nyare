package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.config.SessionContext;
import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.service.CourseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<List<CourseResponse>> listCourses() {
        List<CourseResponse> courses = courseService.listCourses(sessionContext.requireUserId());
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
}
