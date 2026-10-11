package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.NoteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service implementation for journal note management.
 */
@Service
@Transactional(readOnly = true)
public class NoteServiceImpl implements NoteService {

    private static final int PREVIEW_MAX_LENGTH = 200;
    private static final int TITLE_MAX_LENGTH = 60;
    private static final String DEFAULT_TITLE = "Untitled Note";

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

        String title;
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            title = request.getTitle().trim();
        } else {
            title = computeFallbackTitle(request.getContent());
        }

        Note note = new Note(course, title, request.getContent());
        Note savedNote = noteRepository.save(note);
        return toResponse(savedNote);
    }

    @Override
    public List<NoteSummaryResponse> listNotes(Long userId, Long courseId) {
        if (courseId != null) {
            if (!courseRepository.existsById(courseId)) {
                throw new ResourceNotFoundException("Course not found with ID: " + courseId);
            }
        }

        return noteRepository.findAllFiltered(userId, courseId)
                .stream()
                .map(this::toSummary)
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

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            note.setTitle(request.getTitle().trim());
        } else if (note.getTitle() == null || note.getTitle().isBlank() || DEFAULT_TITLE.equalsIgnoreCase(note.getTitle().trim())) {
            note.setTitle(computeFallbackTitle(request.getContent()));
        }

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
                note.getTitle(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt(),
                note.getLastProcessedAt()
        );
    }

    private NoteSummaryResponse toSummary(Note note) {
        String content = note.getContent() != null ? note.getContent() : "";
        boolean truncated = content.length() > PREVIEW_MAX_LENGTH;
        String preview = truncated ? content.substring(0, PREVIEW_MAX_LENGTH) : content;
        return new NoteSummaryResponse(
                note.getId(),
                note.getCourse() != null ? note.getCourse().getId() : null,
                note.getTitle(),
                preview,
                truncated,
                content.length(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }

    private String computeFallbackTitle(String content) {
        if (content == null || content.isBlank()) {
            return DEFAULT_TITLE;
        }

        for (String rawLine : content.lines().toList()) {
            String line = rawLine.trim();
            if (line.isEmpty()) {
                continue;
            }

            String stripped = line.replaceFirst("^[#\\-*\\s>]+", "").trim();
            if (!stripped.isEmpty()) {
                return stripped.length() > TITLE_MAX_LENGTH
                        ? stripped.substring(0, TITLE_MAX_LENGTH)
                        : stripped;
            }
        }

        return DEFAULT_TITLE;
    }
}
