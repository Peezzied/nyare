package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.ImageAiProcessor;
import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private static final Pattern IMAGE_URL_PATTERN =
            Pattern.compile("/api/images/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})");

    /**
     * Hard cap on persisted AI image descriptions. The image system prompt already
     * asks for ~120 words; this backstop guarantees the DB invariant when the model
     * ignores prompt guidance.
     */
    static final int MAX_IMAGE_DESCRIPTION_LENGTH = 500;

    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final ScheduleRepository scheduleRepository;
    private final ImageRepository imageRepository;
    private final ImageAiProcessor imageAiProcessor;
    private final StudyPlannerEngine studyPlannerEngine;

    @Autowired
    public StudyPlannerServiceImpl(
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ScheduleRepository scheduleRepository,
            ImageRepository imageRepository,
            ImageAiProcessor imageAiProcessor,
            StudyPlannerEngine studyPlannerEngine) {
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.scheduleRepository = scheduleRepository;
        this.imageRepository = imageRepository;
        this.imageAiProcessor = imageAiProcessor;
        this.studyPlannerEngine = studyPlannerEngine;
    }

    /**
     * Processes dirty notes for the given date across all courses in one AI round-trip.
     * Extracts tasks, events, and context. Persists new entities. Updates promoted tasks.
     * Stamps lastProcessedAt on all processed notes.
     *
     * @param date the calendar date whose dirty notes will be processed
     * @return summary count of created tasks, events, and contexts
     * @throws BadRequestException when no dirty notes exist for the given date
     */
    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(LocalDate date) {
        return processNotes(date, null);
    }

    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(LocalDate date, Long userId) {
        List<Note> dirtyNotes = userId != null
                ? noteRepository.findDirtyNotes(userId, date)
                : noteRepository.findDirtyNotes(date);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found for " + date + " to process");
        }

        // Contexts are scoped to dirty-note courses. All other data is global.
        Set<Long> dirtyCourseIds = dirtyNotes.stream()
                .filter(n -> n.getCourse() != null && n.getCourse().getId() != null)
                .map(n -> n.getCourse().getId())
                .collect(Collectors.toSet());

        // Discover and update note images
        Map<UUID, List<Image>> noteImages = processAndPersistNoteImages(dirtyNotes);

        List<Task> existingTasks = userId != null
                ? taskRepository.findAllFiltered(userId, null, null, null).stream()
                        .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                        .toList()
                : taskRepository.findByStatusNotOrderByCreatedAtDesc(TaskStatus.COMPLETED);
        List<AcademicEvent> existingEvents = userId != null
                ? academicEventRepository.findAllFiltered(userId, null, true, LocalDateTime.now())
                : academicEventRepository.findAllFiltered(null, true, LocalDateTime.now());
        List<AcademicContext> existingContexts =
                academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(dirtyCourseIds);
        List<Schedule> schedules = userId != null
                ? scheduleRepository.findAllFiltered(userId, null)
                : scheduleRepository.findAll();

        StudyPlannerEngine.ExtractedData extracted = studyPlannerEngine.process(
                dirtyNotes, existingTasks, existingEvents, existingContexts, schedules, noteImages);

        Map<UUID, Note> noteMap = dirtyNotes.stream()
                .filter(n -> n.getId() != null)
                .collect(Collectors.toMap(Note::getId, n -> n, (a, b) -> a));

        Map<UUID, Task> taskMap = existingTasks.stream()
                .filter(t -> t.getId() != null)
                .collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));

        List<Task> tasksToSave = new ArrayList<>();
        for (StudyPlannerEngine.ExtractedTask item : extracted.tasks()) {
            if (item.title() == null || item.title().isBlank()) {
                continue;
            }
            if (item.isPromotion()) {
                Task existing = item.taskId() != null ? taskMap.get(item.taskId()) : null;
                if (existing != null) {
                    existing.setScheduledDate(item.scheduledDate());
                    if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                        existing.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
                    }
                    tasksToSave.add(existing);
                }
            } else {
                Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
                Course course = note != null ? note.getCourse() : null;
                if (course == null) continue;
                Task task = new Task(course, item.title());
                task.setNote(note);
                task.setDescription(item.description());
                task.setScheduledDate(item.scheduledDate());
                if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                    task.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
                }
                tasksToSave.add(task);
            }
        }

        List<AcademicEvent> eventsToSave = new ArrayList<>();
        for (StudyPlannerEngine.ExtractedEvent item : extracted.events()) {
            if (item.title() == null || item.title().isBlank() || item.deadline() == null) {
                continue;
            }
            Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
            Course course = note != null ? note.getCourse() : null;
            if (course == null) continue;
            eventsToSave.add(new AcademicEvent(course, note, item.title(), item.description(), item.deadline()));
        }

        List<AcademicContext> contextsToSave = new ArrayList<>();
        for (StudyPlannerEngine.ExtractedContext item : extracted.contexts()) {
            if (item.value() == null || item.value().isBlank()) {
                continue;
            }
            Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
            Course course = note != null ? note.getCourse() : null;
            if (course == null) continue;
            contextsToSave.add(new AcademicContext(course, note, item.value()));
        }

        // Count only new tasks; promotions update existing rows.
        long newTaskCount = tasksToSave.stream().filter(t -> t.getId() == null).count();

        taskRepository.saveAll(tasksToSave);
        academicEventRepository.saveAll(eventsToSave);
        academicContextRepository.saveAll(contextsToSave);

        Instant processedAt = Instant.now().plusSeconds(1);
        dirtyNotes.forEach(n -> n.setLastProcessedAt(processedAt));
        noteRepository.saveAll(dirtyNotes);

        return new ProcessSummaryResponse((int) newTaskCount, eventsToSave.size(), contextsToSave.size());
    }

    private Map<UUID, List<Image>> processAndPersistNoteImages(List<Note> dirtyNotes) {
        Map<UUID, Set<UUID>> noteToImageIds = new HashMap<>();
        Set<UUID> allImageIds = new HashSet<>();

        for (Note note : dirtyNotes) {
            if (note.getId() == null || note.getContent() == null) continue;
            Matcher matcher = IMAGE_URL_PATTERN.matcher(note.getContent());
            Set<UUID> imageIds = new LinkedHashSet<>();
            while (matcher.find()) {
                try {
                    UUID imageId = UUID.fromString(matcher.group(1));
                    imageIds.add(imageId);
                    allImageIds.add(imageId);
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (!imageIds.isEmpty()) {
                noteToImageIds.put(note.getId(), imageIds);
            }
        }

        if (allImageIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Image> existingImages = imageRepository.findAllById(allImageIds);
        Map<UUID, Image> imageMap = existingImages.stream()
                .filter(img -> img.getId() != null)
                .collect(Collectors.toMap(Image::getId, img -> img, (a, b) -> a));

        List<Image> imagesToUpdate = new ArrayList<>();
        for (Image image : existingImages) {
            if (image.getDescription() == null || image.getDescription().isBlank()) {
                String description = imageAiProcessor.describeImage(image.getData(), image.getContentType());
                if (description != null && !description.isBlank()) {
                    image.setDescription(truncateDescription(description.strip()));
                    imagesToUpdate.add(image);
                }
            }
        }

        if (!imagesToUpdate.isEmpty()) {
            imageRepository.saveAll(imagesToUpdate);
        }

        Map<UUID, List<Image>> result = new HashMap<>();
        for (Map.Entry<UUID, Set<UUID>> entry : noteToImageIds.entrySet()) {
            List<Image> images = entry.getValue().stream()
                    .map(imageMap::get)
                    .filter(Objects::nonNull)
                    .toList();
            if (!images.isEmpty()) {
                result.put(entry.getKey(), images);
            }
        }
        return result;
    }

    /**
     * Truncates an AI image description to {@link #MAX_IMAGE_DESCRIPTION_LENGTH},
     * preferring a word boundary and marking truncation with an ellipsis.
     */
    static String truncateDescription(String description) {
        if (description == null || description.length() <= MAX_IMAGE_DESCRIPTION_LENGTH) {
            return description;
        }
        int cut = description.lastIndexOf(' ', MAX_IMAGE_DESCRIPTION_LENGTH - 1);
        if (cut <= 0) {
            cut = MAX_IMAGE_DESCRIPTION_LENGTH - 1;
        }
        return description.substring(0, cut).stripTrailing() + "…";
    }
}
