package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.ImageMetadataUpdateRequest;
import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.ImageMetadata;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.NoteContent;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.NoteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service implementation for journal note management and AI image metadata updates.
 */
@Service
@Transactional(readOnly = true)
public class NoteServiceImpl implements NoteService {

    private static final Pattern IMAGE_REF_PATTERN = Pattern.compile("!\\[[^\\]]*\\]\\[([^\\]]+)\\]");

    private final NoteRepository noteRepository;
    private final CourseRepository courseRepository;

    public NoteServiceImpl(NoteRepository noteRepository, CourseRepository courseRepository) {
        this.noteRepository = noteRepository;
        this.courseRepository = courseRepository;
    }

    @Override
    @Transactional
    public NoteResponse createNote(NoteRequest request) {
        if (request.getCourseId() == null) {
            throw new BadRequestException("Course ID is required");
        }
        if (request.getContent() == null) {
            throw new BadRequestException("Note content is required");
        }

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

        if (request.getCourseId() == null) {
            throw new BadRequestException("Course ID is required");
        }
        if (request.getContent() == null) {
            throw new BadRequestException("Note content is required");
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        note.setCourse(course);
        note.setContent(request.getContent());
        Note savedNote = noteRepository.save(note);
        return toResponse(savedNote);
    }

    @Override
    @Transactional
    public NoteResponse updateImageMetadata(UUID id, ImageMetadataUpdateRequest request) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));

        if (request == null || request.getImageMetadata() == null) {
            throw new BadRequestException("Image metadata map is required");
        }

        NoteContent content = note.getContent();
        if (content == null) {
            throw new BadRequestException("Note content is missing");
        }

        Set<String> markdownRefs = extractMarkdownImageReferences(content.getMarkdown());
        Set<String> metadataKeys = request.getImageMetadata().keySet();

        if (!markdownRefs.equals(metadataKeys)) {
            throw new BadRequestException("Image metadata keys do not match markdown image references");
        }

        note.updateImageMetadata(request.getImageMetadata());
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

    private Set<String> extractMarkdownImageReferences(String markdown) {
        Set<String> refs = new HashSet<>();
        if (markdown == null) {
            return refs;
        }

        Matcher matcher = IMAGE_REF_PATTERN.matcher(markdown);
        while (matcher.find()) {
            refs.add(matcher.group(1).trim());
        }
        return refs;
    }
}
