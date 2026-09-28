package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final ScheduleRepository scheduleRepository;
    private final StudyPlannerEngine studyPlannerEngine;

    @Autowired
    public StudyPlannerServiceImpl(
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ScheduleRepository scheduleRepository,
            StudyPlannerEngine studyPlannerEngine) {
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.scheduleRepository = scheduleRepository;
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
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(date);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found for " + date + " to process");
        }

        // Contexts are scoped to dirty-note courses. All other data is global.
        Set<Long> dirtyCourseIds = dirtyNotes.stream()
                .filter(n -> n.getCourse() != null && n.getCourse().getId() != null)
                .map(n -> n.getCourse().getId())
                .collect(Collectors.toSet());

        List<Task> existingTasks = taskRepository.findByStatusNotOrderByCreatedAtDesc(TaskStatus.COMPLETED);
        List<AcademicEvent> existingEvents = academicEventRepository.findAllFiltered(null, true, LocalDateTime.now());
        List<AcademicContext> existingContexts =
                academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(dirtyCourseIds);
        List<Schedule> schedules = scheduleRepository.findAll();

        StudyPlannerEngine.ExtractedData extracted = studyPlannerEngine.process(
                dirtyNotes, existingTasks, existingEvents, existingContexts, schedules);

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

        Instant processedAt = Instant.now();
        dirtyNotes.forEach(n -> n.setLastProcessedAt(processedAt));
        noteRepository.saveAll(dirtyNotes);

        return new ProcessSummaryResponse((int) newTaskCount, eventsToSave.size(), contextsToSave.size());
    }
}
