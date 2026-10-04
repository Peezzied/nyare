package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.service.CourseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request,
                                                       HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        Long sessionUserId = session != null ? (Long) session.getAttribute(UserController.SESSION_USER_ID) : null;

        CourseResponse createdCourse = courseService.createCourse(request, sessionUserId);
        URI location = URI.create("/api/courses/" + createdCourse.getId());
        return ResponseEntity.created(location).body(createdCourse);
    }

    @GetMapping
    public ResponseEntity<List<CourseResponse>> listCourses(
            @RequestParam(required = false) Long userId,
            HttpServletRequest httpRequest) {
        HttpSession session = httpRequest.getSession(false);
        Long sessionUserId = session != null ? (Long) session.getAttribute(UserController.SESSION_USER_ID) : null;

        List<CourseResponse> courses = courseService.listCourses(sessionUserId, userId);
        return ResponseEntity.ok(courses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> getCourse(@PathVariable Long id) {
        CourseResponse course = courseService.getCourse(id);
        return ResponseEntity.ok(course);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }
}
