package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.CourseService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service implementation for course management.
 */
@Service
@Transactional(readOnly = true)
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public CourseServiceImpl(CourseRepository courseRepository, UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public CourseResponse createCourse(CourseRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        Course course = new Course(request.getName(), request.getDescription(), user);
        course.setColor(request.getColor());
        Course savedCourse = courseRepository.save(course);
        return toResponse(savedCourse);
    }

    @Override
    public List<CourseResponse> listCourses(Long userId) {
        return courseRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CourseResponse getCourse(Long id, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        return toResponse(course);
    }

    @Override
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setColor(request.getColor());
        return toResponse(course);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id, Long userId) {
        Course course = courseRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        courseRepository.delete(course);
    }

    private CourseResponse toResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getUser() != null ? course.getUser().getId() : null,
                course.getColor()
        );
    }
}
