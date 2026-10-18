package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.ImageAiProcessor;
import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.dto.PlannerStatusResponse;
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
import group.four.nyare.nyare.service.ProcessListener;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CancellationException;
import java.util.stream.Collectors;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

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

    @Override
    public PlannerStatusResponse getPlannerStatus(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User identifier is required");
        }
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId);
        if (dirtyNotes.isEmpty()) {
            return new PlannerStatusResponse(false, 0, List.of(), List.of(), List.of());
        }
        List<LocalDate> dirtyDates = dirtyNotes.stream()
                .map(n -> n.getEntryDate() != null ? n.getEntryDate() : LocalDate.now())
                .distinct()
                .sorted()
                .toList();
        List<String> courseNames = dirtyNotes.stream()
                .filter(n -> n.getCourse() != null && n.getCourse().getName() != null)
                .map(n -> n.getCourse().getName())
                .distinct()
                .sorted()
                .toList();
        List<PlannerStatusResponse.PendingNoteSummary> pendingSummaries = dirtyNotes.stream()
                .map(n -> new PlannerStatusResponse.PendingNoteSummary(
                        n.getId(),
                        n.getTitle(),
                        n.getCourse() != null ? n.getCourse().getName() : null,
                        n.getEntryDate() != null ? n.getEntryDate() : LocalDate.now()
                ))
                .toList();
        return new PlannerStatusResponse(true, dirtyNotes.size(), dirtyDates, courseNames, pendingSummaries);
    }

    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(Long userId) {
        return processNotes(userId, ProcessListener.NONE);
    }

    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(Long userId, ProcessListener listener) {
        if (userId == null) {
            throw new BadRequestException("User identifier is required for processing");
        }

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found to process");
        }

        ProcessListener effectiveListener = listener != null ? listener : ProcessListener.NONE;
        return processDirtyNotes(dirtyNotes, userId, effectiveListener);
    }

    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(LocalDate date, Long userId) {
        if (userId == null) {
            throw new BadRequestException("User identifier is required for processing");
        }

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId, date);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found for " + date + " to process");
        }

        return processDirtyNotes(dirtyNotes, userId, ProcessListener.NONE);
    }

    private void checkCancelled(ProcessListener listener) {
        if (listener.isCancelled()) {
            throw new CancellationException("Processing cancelled");
        }
    }

    private ProcessSummaryResponse processDirtyNotes(List<Note> dirtyNotes, Long userId, ProcessListener listener) {
        SortedMap<LocalDate, List<Note>> notesByDate = new TreeMap<>();
        for (Note note : dirtyNotes) {
            LocalDate noteDate = note.getEntryDate() != null ? note.getEntryDate() : LocalDate.now();
            notesByDate.computeIfAbsent(noteDate, k -> new ArrayList<>()).add(note);
        }

        int totalTasksCreated = 0;
        int totalEventsCreated = 0;
        int totalContextsCreated = 0;
        Set<Long> affectedCourseIds = new TreeSet<>();

        int index = 0;
        int total = notesByDate.size();
        for (Map.Entry<LocalDate, List<Note>> entry : notesByDate.entrySet()) {
            index++;
            checkCancelled(listener);
            listener.onDateStarted(entry.getKey(), index, total);

            List<Note> dateNotes = entry.getValue();

            // Delete uncompleted previous items linked to notes for this date
            taskRepository.deleteByNoteInAndStatusNot(dateNotes, TaskStatus.COMPLETED);
            academicEventRepository.deleteByNoteIn(dateNotes);
            academicContextRepository.deleteByNoteIn(dateNotes);

            // Discover and update note images
            Map<UUID, List<Image>> noteImages = processAndPersistNoteImages(dateNotes);
            checkCancelled(listener);

            Set<Long> dateCourseIds = dateNotes.stream()
                    .filter(n -> n.getCourse() != null && n.getCourse().getId() != null)
                    .map(n -> n.getCourse().getId())
                    .collect(Collectors.toSet());

            List<Task> existingTasks = taskRepository.findAllFiltered(userId, null, null, null).stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .toList();
            List<AcademicEvent> existingEvents =
                    academicEventRepository.findAllFiltered(userId, null, true, LocalDateTime.now());
            List<AcademicContext> existingContexts = dateCourseIds.isEmpty()
                    ? Collections.emptyList()
                    : academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(dateCourseIds);
            List<Schedule> schedules = scheduleRepository.findAllFiltered(userId, null);

            StudyPlannerEngine.ExtractedData extracted = studyPlannerEngine.process(
                    dateNotes, existingTasks, existingEvents, existingContexts, schedules, noteImages);
            checkCancelled(listener);

            Map<UUID, Note> noteMap = dateNotes.stream()
                    .filter(n -> n.getId() != null)
                    .collect(Collectors.toMap(Note::getId, n -> n, (a, b) -> a));

            if (extracted.noteTitles() != null && !extracted.noteTitles().isEmpty()) {
                extracted.noteTitles().forEach((noteId, title) -> {
                    if (title != null && !title.isBlank()) {
                        Note note = noteMap.get(noteId);
                        if (note != null) {
                            note.setTitle(title.trim());
                        }
                    }
                });
            }

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

            long newTaskCount = tasksToSave.stream().filter(t -> t.getId() == null).count();

            taskRepository.saveAll(tasksToSave);
            academicEventRepository.saveAll(eventsToSave);
            academicContextRepository.saveAll(contextsToSave);

            Instant processedAt = Instant.now().plusSeconds(1);
            dateNotes.forEach(n -> n.setLastProcessedAt(processedAt));
            noteRepository.saveAll(dateNotes);

            totalTasksCreated += (int) newTaskCount;
            totalEventsCreated += eventsToSave.size();
            totalContextsCreated += contextsToSave.size();
            affectedCourseIds.addAll(dateCourseIds);
        }

        return new ProcessSummaryResponse(totalTasksCreated, totalEventsCreated, totalContextsCreated,
                affectedCourseIds.stream().sorted().toList());
    }

    private Map<UUID, List<Image>> processAndPersistNoteImages(List<Note> dirtyNotes) {
        Map<UUID, Set<UUID>> noteToImageIds = new HashMap<>();
        Set<UUID> allImageIds = new HashSet<>();

        for (Note note : dirtyNotes) {
            if (note.getId() == null) continue;
            Set<UUID> imageIds = ImageReferenceExtractor.extractIds(note.getContent());
            allImageIds.addAll(imageIds);
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
