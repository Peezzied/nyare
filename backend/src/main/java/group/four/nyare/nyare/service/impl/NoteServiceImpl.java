package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.NoteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service implementation for journal note management and AI image metadata updates.
 */
@Service
@Transactional(readOnly = true)
public class NoteServiceImpl implements NoteService {

    private final NoteRepository noteRepository;
    private final CourseRepository courseRepository;

    public NoteServiceImpl(NoteRepository noteRepository, CourseRepository courseRepository) {
        this.noteRepository = noteRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public NoteResponse createNote(NoteRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        Note note = new Note(course, request.getContent());
        Note savedNote = noteRepository.save(note);
        return toResponse(savedNote);
    }

    @Override
    public List<NoteResponse> listNotes(Long courseId) {
        if (courseId == null || !courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course not found with ID: " + courseId);
        }

        return noteRepository.findByCourseIdOrderByCreatedAtDesc(courseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public NoteResponse getNote(UUID id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        return toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse updateNote(UUID id, NoteRequest request) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        note.setCourse(course);
        note.setContent(request.getContent());
        Note savedNote = noteRepository.save(note);
        return toResponse(savedNote);
    }

    @Override
    @Transactional
    public void deleteNote(UUID id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        noteRepository.delete(note);
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getCourse() != null ? note.getCourse().getId() : null,
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
