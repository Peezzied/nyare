package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.NoteRequest;
import group.four.nyare.nyare.dto.NoteResponse;
import group.four.nyare.nyare.dto.NoteSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.service.NoteService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service implementation for journal note management.
 */
@Service
@Transactional(readOnly = true)
public class NoteServiceImpl implements NoteService {

    public static final int DEFAULT_MAX_BACKDATE_DAYS = 14;

    private static final int PREVIEW_MAX_LENGTH = 200;
    private static final int TITLE_MAX_LENGTH = 60;
    private static final String DEFAULT_TITLE = "Untitled Note";

    @Value("${nyare.notes.max-backdate-days:14}")
    private int maxBackdateDays = DEFAULT_MAX_BACKDATE_DAYS;

    private final NoteRepository noteRepository;
    private final CourseRepository courseRepository;
    private final ImageRepository imageRepository;

    public NoteServiceImpl(NoteRepository noteRepository, CourseRepository courseRepository,
            ImageRepository imageRepository) {
        this.noteRepository = noteRepository;
        this.courseRepository = courseRepository;
        this.imageRepository = imageRepository;
    }

    @Override
    @Transactional
    public NoteResponse createNote(NoteRequest request, Long userId) {
        validateEntryDate(request.getEntryDate());

        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        validateImageReferences(request.getContent());

        String title;
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            title = request.getTitle().trim();
        } else {
            title = computeFallbackTitle(request.getContent());
        }

        LocalDate entryDate = request.getEntryDate() != null ? request.getEntryDate() : LocalDate.now();
        Note note = new Note(course, title, request.getContent(), entryDate);
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
    public NoteResponse getNote(UUID id, Long userId) {
        Note note = noteRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        return toResponse(note);
    }

    @Override
    @Transactional
    public NoteResponse updateNote(UUID id, NoteRequest request, Long userId) {
        if (request.getEntryDate() != null) {
            validateEntryDate(request.getEntryDate());
        }

        Note note = noteRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));

        Course course = courseRepository.findByIdAndUserId(request.getCourseId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found with ID: " + request.getCourseId()));

        validateImageReferences(request.getContent());

        note.setCourse(course);
        note.setContent(request.getContent());

        if (request.getEntryDate() != null) {
            note.setEntryDate(request.getEntryDate());
        }

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
    public void deleteNote(UUID id, Long userId) {
        Note note = noteRepository.findByIdAndCourseUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with ID: " + id));
        noteRepository.delete(note);
    }

    private void validateEntryDate(LocalDate entryDate) {
        if (entryDate == null) {
            return;
        }
        LocalDate today = LocalDate.now();
        if (entryDate.isAfter(today)) {
            throw new BadRequestException("Entry date cannot be in the future");
        }
        LocalDate oldestAllowed = today.minusDays(maxBackdateDays);
        if (entryDate.isBefore(oldestAllowed)) {
            throw new BadRequestException("Entry date cannot be older than " + maxBackdateDays + " days");
        }
    }

    private void validateImageReferences(String content) {
        Set<UUID> referenced = ImageReferenceExtractor.extractIds(content);
        if (referenced.isEmpty()) {
            return;
        }
        Set<UUID> existing = imageRepository.findAllById(referenced).stream()
                .map(Image::getId)
                .collect(Collectors.toSet());
        Set<UUID> missing = new LinkedHashSet<>(referenced);
        missing.removeAll(existing);
        if (!missing.isEmpty()) {
            throw new BadRequestException("Note references unknown image(s): " + missing);
        }
    }

    private NoteResponse toResponse(Note note) {
        return new NoteResponse(
                note.getId(),
                note.getCourse() != null ? note.getCourse().getId() : null,
                note.getTitle(),
                note.getContent(),
                note.getEntryDate(),
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
                note.getEntryDate(),
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
