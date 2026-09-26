package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.AcademicEventRequest;
import group.four.nyare.nyare.dto.AcademicEventResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.AcademicEventService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;


@Service
@Transactional(readOnly = true)
public class AcademicEventServiceImpl implements AcademicEventService {

    private final AcademicEventRepository academicEventRepository;
    private final CourseRepository courseRepository;
    private final NoteRepository noteRepository;

    public AcademicEventServiceImpl(AcademicEventRepository academicEventRepository,
                                   CourseRepository courseRepository,
                                   NoteRepository noteRepository) {
        this.academicEventRepository = academicEventRepository;
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
    }

    @Override
    @Transactional
    public AcademicEventResponse createEvent(AcademicEventRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        Note note = null;
        if (request.getNoteId() != null) {
            note = noteRepository.findById(request.getNoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + request.getNoteId()));
            if (!note.getCourse().getId().equals(course.getId())) {
                throw new BadRequestException("Note does not belong to course with ID: " + course.getId());
            }
        }

        AcademicEvent event = new AcademicEvent(course, note, request.getTitle(), request.getDescription(), request.getDeadline());
        AcademicEvent savedEvent = academicEventRepository.save(event);
        return toResponse(savedEvent);
    }

    @Override
    public List<AcademicEventResponse> listEvents(Long courseId, Boolean upcoming) {
        LocalDateTime now = LocalDateTime.now();
        return academicEventRepository.findAllFiltered(courseId, upcoming, now)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AcademicEventResponse getEvent(UUID id) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with ID: " + id));
        return toResponse(event);
    }

    @Override
    @Transactional
    public AcademicEventResponse updateEvent(UUID id, AcademicEventRequest request) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with ID: " + id));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        Note note = null;
        if (request.getNoteId() != null) {
            note = noteRepository.findById(request.getNoteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + request.getNoteId()));
            if (!note.getCourse().getId().equals(course.getId())) {
                throw new BadRequestException("Note does not belong to course with ID: " + course.getId());
            }
        }

        event.setCourse(course);
        event.setNote(note);
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setDeadline(request.getDeadline());

        return toResponse(event);
    }

    @Override
    @Transactional
    public void deleteEvent(UUID id) {
        AcademicEvent event = academicEventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Academic event not found with ID: " + id));
        academicEventRepository.delete(event);
    }

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
}
