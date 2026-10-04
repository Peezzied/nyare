package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.CourseRequest;
import group.four.nyare.nyare.dto.CourseResponse;
import group.four.nyare.nyare.exception.BadRequestException;
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
    public CourseResponse createCourse(CourseRequest request, Long sessionUserId) {
        Long targetUserId = sessionUserId != null ? sessionUserId : request.getUserId();
        if (targetUserId == null) {
            throw new BadRequestException("User identifier is required to create a course");
        }

        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + targetUserId));

        Course course = new Course(request.getName(), request.getDescription(), user);
        Course savedCourse = courseRepository.save(course);
        return toResponse(savedCourse);
    }

    @Override
    public List<CourseResponse> listCourses(Long sessionUserId, Long queryUserId) {
        Long targetUserId = sessionUserId != null ? sessionUserId : queryUserId;
        if (targetUserId != null) {
            return courseRepository.findByUserId(targetUserId).stream()
                    .map(this::toResponse)
                    .toList();
        }

        return courseRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public CourseResponse getCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        return toResponse(course);
    }

    @Override
    @Transactional
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + id));
        courseRepository.delete(course);
    }

    private CourseResponse toResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getName(),
                course.getDescription(),
                course.getUser() != null ? course.getUser().getId() : null
        );
    }
}
