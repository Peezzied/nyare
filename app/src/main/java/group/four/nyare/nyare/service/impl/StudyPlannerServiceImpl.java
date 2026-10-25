package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.ImageAiProcessor;
import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.ai.observability.event.ErrorDiagnostic;
import group.four.nyare.nyare.ai.observability.event.LifecycleState;
import group.four.nyare.nyare.ai.observability.event.TraceKind;
import group.four.nyare.nyare.ai.observability.event.TriggerSource;
import group.four.nyare.nyare.ai.parser.TitleSimilarityMatcher;
import group.four.nyare.nyare.dto.PlannerStatusResponse;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.event.PlanningProgressEvent;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.User;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.repository.UserRepository;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CancellationException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.stream.Collectors;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private static final Logger log = LoggerFactory.getLogger(StudyPlannerServiceImpl.class);

    /**
     * Hard cap on persisted AI image descriptions. The image system prompt already
     * asks for ~120 words; this backstop guarantees the DB invariant when the model
     * ignores prompt guidance.
     */
    static final int MAX_IMAGE_DESCRIPTION_LENGTH = 500;
    private static final ExecutorService VIRTUAL_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();

    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final ScheduleRepository scheduleRepository;
    private final ImageRepository imageRepository;
    private final ImageAiProcessor imageAiProcessor;
    private final StudyPlannerEngine studyPlannerEngine;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    @Autowired
    public StudyPlannerServiceImpl(
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ScheduleRepository scheduleRepository,
            ImageRepository imageRepository,
            ImageAiProcessor imageAiProcessor,
            StudyPlannerEngine studyPlannerEngine,
            ApplicationEventPublisher eventPublisher,
            UserRepository userRepository) {
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.scheduleRepository = scheduleRepository;
        this.imageRepository = imageRepository;
        this.imageAiProcessor = imageAiProcessor;
        this.studyPlannerEngine = studyPlannerEngine;
        this.eventPublisher = eventPublisher;
        this.userRepository = userRepository;
    }

    @Override
    public PlannerStatusResponse getPlannerStatus(Long userId) {
        if (userId == null) {
            throw new BadRequestException("User identifier is required");
        }
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId, false);
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
        if (userId == null) {
            throw new BadRequestException("User identifier is required for processing");
        }

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId, false);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found to process");
        }

        return processDirtyNotes(dirtyNotes, userId);
    }

    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(LocalDate date, Long userId) {
        if (userId == null) {
            throw new BadRequestException("User identifier is required for processing");
        }

        List<Note> dirtyNotes = noteRepository.findDirtyNotes(userId, date, false);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found for " + date + " to process");
        }

        return processDirtyNotes(dirtyNotes, userId);
    }

    private void checkCancelled(UUID runId, Long userId,
                                String originUsername, long startedAtNanos) {
        if (Thread.currentThread().isInterrupted()) {
            publishLifecycle(LifecycleState.CANCELLED, AuditSeverity.WARN, runId, userId, originUsername,
                    "Planning run cancelled", null,
                    (System.nanoTime() - startedAtNanos) / 1_000_000, null);
            throw new CancellationException("Processing cancelled");
        }
    }

    private ProcessSummaryResponse processDirtyNotes(List<Note> dirtyNotes, Long userId) {
        long startedAt = System.nanoTime();
        UUID runId = UUID.randomUUID();
        String originUsername = resolveOriginUsername(dirtyNotes);

        SortedMap<LocalDate, List<Note>> notesByDate = new TreeMap<>();
        for (Note note : dirtyNotes) {
            LocalDate noteDate = note.getEntryDate() != null ? note.getEntryDate() : LocalDate.now();
            notesByDate.computeIfAbsent(noteDate, k -> new ArrayList<>()).add(note);
        }

        log.info("[AI AUDIT - PROCESS TRIGGERED] UserId: {} | Notes: {} | Dates: {} | Courses: {}",
                userId, dirtyNotes.size(), formatDateRange(notesByDate), formatCourseNames(dirtyNotes));

        String targetNoteIds = dirtyNotes.stream()
                .map(Note::getId)
                .filter(Objects::nonNull)
                .map(UUID::toString)
                .collect(Collectors.joining(", "));
        publishLifecycle(LifecycleState.STARTED, AuditSeverity.INFO, runId, userId, originUsername,
                "Planning run started for " + dirtyNotes.size() + " notes",
                targetNoteIds.isEmpty() ? null : "Target notes: " + targetNoteIds,
                null, null);

        try {
            return runPlanningPass(notesByDate, userId, runId, originUsername, startedAt);
        } catch (CancellationException e) {
            // CANCELLED was already emitted at the checkpoint; keep the exception flow unchanged.
            throw e;
        } catch (RuntimeException e) {
            log.error("[AI AUDIT - PROCESS FAILED] UserId: {} | RunId: {} | {}", userId, runId, e.getMessage(), e);
            publishLifecycle(LifecycleState.FAILED, AuditSeverity.ERROR, runId, userId,
                    originUsername, "Planning run failed: " + e.getMessage(), null,
                    (System.nanoTime() - startedAt) / 1_000_000, null, ErrorDiagnostic.from(e));
            throw e;
        }
    }

    private int resolvePlanningScopeDays(Long userId) {
        return userRepository.findById(userId)
                .map(User::getPlanningHorizonDays)
                .filter(Objects::nonNull)
                .orElse(StudyPlannerEngine.DEFAULT_PLANNING_SCOPE_DAYS);
    }

    /**
     * Executes the multi-day extraction and persistence body of a planning run.
     * Runs inside the boundary in {@link #processDirtyNotes} so an unhandled
     * failure can emit a {@code FAILED} lifecycle event before propagating.
     */
    private ProcessSummaryResponse runPlanningPass(SortedMap<LocalDate, List<Note>> notesByDate,
                                                   Long userId, UUID runId,
                                                   String originUsername, long startedAt) {
        int totalTasksCreated = 0;
        int totalTasksPromoted = 0;
        int totalEventsCreated = 0;
        int totalContextsCreated = 0;
        Set<Long> affectedCourseIds = new TreeSet<>();

        int planningScopeDays = resolvePlanningScopeDays(userId);

        int index = 0;
        int total = notesByDate.size();
        for (Map.Entry<LocalDate, List<Note>> entry : notesByDate.entrySet()) {
            index++;
            checkCancelled(runId, userId, originUsername, startedAt);
            eventPublisher.publishEvent(new PlanningProgressEvent(userId, entry.getKey(), index, total));

            List<Note> dateNotes = entry.getValue();

            // Discover and update note images
            Map<UUID, List<Image>> noteImages = processAndPersistNoteImages(dateNotes);
            checkCancelled(runId, userId, originUsername, startedAt);

            Set<Long> dateCourseIds = dateNotes.stream()
                    .filter(n -> n.getCourse() != null && n.getCourse().getId() != null)
                    .map(n -> n.getCourse().getId())
                    .collect(Collectors.toSet());

            List<Task> existingTasks = taskRepository.findAllFiltered(userId, null, null, null, false,
                    null, null, null).stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                    .toList();
            List<AcademicEvent> existingEvents =
                    academicEventRepository.findAllFiltered(userId, null, true, LocalDateTime.now(), false,
                            null, null, null);
            List<AcademicContext> existingContexts = dateCourseIds.isEmpty()
                    ? Collections.emptyList()
                    : academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(dateCourseIds);
            List<Schedule> schedules = scheduleRepository.findAllFiltered(userId, null, false);

            StudyPlannerEngine.ExtractedData extracted = studyPlannerEngine.process(
                    dateNotes, existingTasks, existingEvents, existingContexts, schedules, noteImages,
                    planningScopeDays);
            checkCancelled(runId, userId, originUsername, startedAt);

            Map<UUID, Note> noteMap = dateNotes.stream()
                    .filter(n -> n.getId() != null)
                    .collect(Collectors.toMap(Note::getId, n -> n, (a, b) -> a));

            if (extracted.noteTitles() != null && !extracted.noteTitles().isEmpty()) {
                extracted.noteTitles().forEach((noteId, title) -> {
                    if (title != null && !title.isBlank()) {
                        Note note = noteMap.get(noteId);
                        if (note != null && note.requiresGeneratedTitle()) {
                            note.setTitle(title.trim());
                        }
                    }
                });
            }

            Map<UUID, Task> taskMap = existingTasks.stream()
                    .filter(t -> t.getId() != null)
                    .collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));

            List<Task> tasksToSave = new ArrayList<>();
            Set<String> seenTaskKeys = new HashSet<>();

            for (StudyPlannerEngine.ExtractedTask item : extracted.tasks()) {
                if (item.title() == null || item.title().isBlank()) {
                    continue;
                }

                Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
                Task existing = null;

                if (item.taskId() != null) {
                    existing = taskMap.get(item.taskId());
                } else {
                    // Match against existing open tasks by course and title semantics (exact or token overlap)
                    Long courseId = note != null && note.getCourse() != null ? note.getCourse().getId() : null;
                    if (courseId != null) {
                        for (Task t : existingTasks) {
                            if (t.getCourse() != null && courseId.equals(t.getCourse().getId())
                                    && TitleSimilarityMatcher.isSimilar(t.getTitle(), item.title())) {
                                existing = t;
                                break;
                            }
                        }
                    }
                }

                if (existing != null) {
                    String taskKey = existing.getId().toString();
                    if (!seenTaskKeys.add(taskKey)) {
                        continue;
                    }
                    boolean modified = false;
                    if (item.scheduledDate() != null && !item.scheduledDate().equals(existing.getScheduledDate())) {
                        existing.setScheduledDate(item.scheduledDate());
                        modified = true;
                    }
                    if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                        Duration newDuration = Duration.ofMinutes(item.estimatedMinutes());
                        if (!newDuration.equals(existing.getDuration())) {
                            existing.setDuration(newDuration);
                            modified = true;
                        }
                    }
                    if (modified) {
                        tasksToSave.add(existing);
                    }
                } else if (item.isNewTask()) {
                    Course course = note != null ? note.getCourse() : null;
                    if (course == null) continue;

                    String taskKey = course.getId() + ":" + item.title().trim().toLowerCase();
                    if (!seenTaskKeys.add(taskKey)) {
                        continue;
                    }

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
            Set<String> seenEventKeys = new HashSet<>();

            for (StudyPlannerEngine.ExtractedEvent item : extracted.events()) {
                if (item.title() == null || item.title().isBlank() || item.deadline() == null) {
                    continue;
                }
                Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
                Course course = note != null ? note.getCourse() : null;
                if (course == null) continue;

                String eventKey = course.getId() + ":" + item.title().trim().toLowerCase();
                if (!seenEventKeys.add(eventKey)) {
                    continue;
                }

                // Check against existing events for the course
                AcademicEvent existing = null;
                for (AcademicEvent e : existingEvents) {
                    if (e.getCourse() != null && course.getId().equals(e.getCourse().getId())
                            && TitleSimilarityMatcher.isSimilar(e.getTitle(), item.title())) {
                        existing = e;
                        break;
                    }
                }

                if (existing != null) {
                    // If deadline is different, update existing event (FR-010)
                    if (!item.deadline().equals(existing.getDeadline())) {
                        existing.setDeadline(item.deadline());
                        eventsToSave.add(existing);
                    }
                } else {
                    eventsToSave.add(new AcademicEvent(course, note, item.title(), item.description(), item.deadline()));
                }
            }

            List<AcademicContext> contextsToSave = new ArrayList<>();
            Set<String> seenContextKeys = new HashSet<>();

            for (StudyPlannerEngine.ExtractedContext item : extracted.contexts()) {
                if (item.value() == null || item.value().isBlank()) {
                    continue;
                }
                Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
                Course course = note != null ? note.getCourse() : null;
                if (course == null) continue;

                String contextKey = course.getId() + ":" + item.value().trim().toLowerCase();
                if (!seenContextKeys.add(contextKey)) {
                    continue;
                }

                // Check against existing contexts for the course
                boolean alreadyExists = existingContexts.stream().anyMatch(c ->
                        c.getCourse() != null && course.getId().equals(c.getCourse().getId())
                                && c.getValue() != null
                                && c.getValue().trim().equalsIgnoreCase(item.value().trim()));

                if (!alreadyExists) {
                    contextsToSave.add(new AcademicContext(course, note, item.value()));
                }
            }

            long newTaskCount = tasksToSave.stream().filter(t -> t.getId() == null).count();
            long promotedCount = tasksToSave.stream().filter(t -> t.getId() != null).count();
            long newEventCount = eventsToSave.stream().filter(e -> e.getId() == null).count();

            taskRepository.saveAll(tasksToSave);
            academicEventRepository.saveAll(eventsToSave);
            academicContextRepository.saveAll(contextsToSave);

            Instant processedAt = Instant.now().plusSeconds(1);
            dateNotes.forEach(n -> n.setLastProcessedAt(processedAt));
            noteRepository.saveAll(dateNotes);

            totalTasksCreated += (int) newTaskCount;
            totalTasksPromoted += (int) promotedCount;
            totalEventsCreated += (int) newEventCount;
            totalContextsCreated += contextsToSave.size();
            affectedCourseIds.addAll(dateCourseIds);
        }

        ProcessSummaryResponse summary = new ProcessSummaryResponse(totalTasksCreated, totalTasksPromoted,
                totalEventsCreated, totalContextsCreated, affectedCourseIds.stream().sorted().toList());
        long durationMs = (System.nanoTime() - startedAt) / 1_000_000;
        log.info("[AI AUDIT - PROCESS COMPLETED] UserId: {} | Tasks: {} | Promoted: {} | Events: {} | Contexts: {} | Courses: {} | DurationMs: {}",
                userId, totalTasksCreated, totalTasksPromoted, totalEventsCreated, totalContextsCreated,
                summary.getAffectedCourseIds(), durationMs);
        String completedMessage = "Planning run completed in " + durationMs + " ms";
        Map<String, Integer> extractedCounts = Map.of(
                "tasksCreated", totalTasksCreated, "tasksPromoted", totalTasksPromoted,
                "eventsCreated", totalEventsCreated, "contextsCreated", totalContextsCreated);
        // COMPLETED means committed: defer until afterCommit so a commit failure
        // cannot leave a false completion event in the dev trace feed.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publishLifecycle(LifecycleState.COMPLETED, AuditSeverity.INFO, runId, userId,
                            originUsername, completedMessage, null, durationMs, extractedCounts);
                }
            });
        } else {
            publishLifecycle(LifecycleState.COMPLETED, AuditSeverity.INFO, runId, userId,
                    originUsername, completedMessage, null, durationMs, extractedCounts);
        }
        return summary;
    }

    /**
     * Publishes a {@link AuditCategory#LIFECYCLE} trace event for the planning run.
     * The lifecycle node identity is {@code entityKind=lifecycle} + {@code entityId=runId}.
     * Listener failures are swallowed: dev tooling must never break a planning run.
     */
    private void publishLifecycle(LifecycleState state, AuditSeverity severity, UUID runId,
                                  Long userId, String originUsername, String message,
                                  String changeSummary, Long durationMs,
                                  Map<String, Integer> extractedCounts) {
        publishLifecycle(state, severity, runId, userId, originUsername, message,
                changeSummary, durationMs, extractedCounts, null);
    }

    private void publishLifecycle(LifecycleState state, AuditSeverity severity, UUID runId,
                                  Long userId, String originUsername, String message,
                                  String changeSummary, Long durationMs,
                                  Map<String, Integer> extractedCounts,
                                  ErrorDiagnostic errorDiagnostic) {
        try {
            eventPublisher.publishEvent(new AuditTraceEvent(
                    UUID.randomUUID(), Instant.now(), AuditCategory.LIFECYCLE, severity, message,
                    userId, originUsername, TriggerSource.WEB_SESSION, null,
                    TraceKind.lifecycle, runId.toString(), changeSummary, runId,
                    null, null, null, null, null, null, null,
                    durationMs, state, extractedCounts, errorDiagnostic));
        } catch (Exception e) {
            log.warn("Audit trace listener failed for {} event: {}", state, e.getMessage());
        }
    }

    private static String resolveOriginUsername(List<Note> notes) {
        return notes.stream()
                .map(Note::getCourse)
                .filter(Objects::nonNull)
                .map(Course::getUser)
                .filter(Objects::nonNull)
                .map(User::getUsername)
                .findFirst()
                .orElse(null);
    }

    private static String formatDateRange(SortedMap<LocalDate, List<Note>> notesByDate) {
        if (notesByDate.isEmpty()) {
            return "none";
        }
        return notesByDate.size() == 1
                ? notesByDate.firstKey().toString()
                : notesByDate.firstKey() + ".." + notesByDate.lastKey() + " (" + notesByDate.size() + ")";
    }

    private static String formatCourseNames(List<Note> notes) {
        String names = notes.stream()
                .filter(n -> n.getCourse() != null && n.getCourse().getName() != null)
                .map(n -> n.getCourse().getName())
                .distinct()
                .sorted()
                .collect(Collectors.joining(", "));
        return names.isEmpty() ? "none" : names;
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

        List<Image> unanalyzedImages = existingImages.stream()
                .filter(img -> img.getDescription() == null || img.getDescription().isBlank())
                .toList();

        List<Image> imagesToUpdate = new ArrayList<>();
        if (unanalyzedImages.size() == 1) {
            Image image = unanalyzedImages.getFirst();
            String description = imageAiProcessor.describeImage(image.getData(), image.getContentType());
            if (description != null && !description.isBlank()) {
                image.setDescription(truncateDescription(description.strip()));
                imagesToUpdate.add(image);
            }
        } else if (unanalyzedImages.size() > 1) {
            Semaphore semaphore = new Semaphore(3);
            List<CompletableFuture<Void>> futures = new ArrayList<>();
            List<Image> synchronizedUpdates = Collections.synchronizedList(new ArrayList<>());

            for (Image image : unanalyzedImages) {
                futures.add(CompletableFuture.runAsync(() -> {
                    try {
                        semaphore.acquire();
                        try {
                            String description = imageAiProcessor.describeImage(image.getData(), image.getContentType());
                            if (description != null && !description.isBlank()) {
                                image.setDescription(truncateDescription(description.strip()));
                                synchronizedUpdates.add(image);
                            }
                        } finally {
                            semaphore.release();
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }, VIRTUAL_EXECUTOR));
            }

            try {
                CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
            } catch (CompletionException ex) {
                Throwable cause = ex.getCause();
                if (cause instanceof RuntimeException runtime) {
                    throw runtime;
                }
                throw new BadRequestException("Image processing failed: " + (cause != null ? cause.getMessage() : ex.getMessage()), cause);
            }
            imagesToUpdate.addAll(synchronizedUpdates);
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
     * Determines if two titles in the same course describe the same academic item.
     * Delegates to {@link TitleSimilarityMatcher#isSimilar(String, String)}.
     */
    static boolean isSimilarTitle(String a, String b) {
        return TitleSimilarityMatcher.isSimilar(a, b);
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
