package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.NoteProcessor;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.CourseRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private final CourseRepository courseRepository;
    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final NoteProcessor noteProcessor;
    private final TransactionTemplate transactionTemplate;

    @Autowired
    public StudyPlannerServiceImpl(
            CourseRepository courseRepository,
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            NoteProcessor noteProcessor,
            TransactionTemplate transactionTemplate) {
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.noteProcessor = noteProcessor;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public ProcessSummaryResponse processTodayNotes() {
        LocalDate today = LocalDate.now();
        List<Note> todayNotes = new ArrayList<>();

        for (Course course : courseRepository.findAll()) {
            todayNotes.addAll(noteRepository.findTodayNotesByCourseId(course.getId(), today));
        }

        if (todayNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found for today to process");
        }

        ExtractionResult extracted = extractFromNotes(todayNotes);

        return transactionTemplate.execute(status -> {
            List<Task> savedTasks = taskRepository.saveAll(extracted.tasks());
            List<AcademicEvent> savedEvents = academicEventRepository.saveAll(extracted.events());
            List<AcademicContext> savedContexts = academicContextRepository.saveAll(extracted.contexts());

            return new ProcessSummaryResponse(
                    savedTasks.size(),
                    savedEvents.size(),
                    savedContexts.size()
            );
        });
    }

    private ExtractionResult extractFromNotes(List<Note> notes) {
        List<Task> tasks = new ArrayList<>();
        List<AcademicEvent> events = new ArrayList<>();
        List<AcademicContext> contexts = new ArrayList<>();

        NoteProcessor.ExtractedData extracted = this.noteProcessor.process(notes);
        if (extracted == null) {
            return new ExtractionResult(tasks, events, contexts);
        }

        Map<UUID, Note> noteMap = notes.stream()
                .filter(n -> n.getId() != null)
                .collect(Collectors.toMap(Note::getId, Function.identity(), (a, b) -> a));

        Note defaultNote = !notes.isEmpty() ? notes.get(0) : null;

        if (extracted.tasks() != null) {
            for (NoteProcessor.ExtractedTask item : extracted.tasks()) {
                if (item.title() != null && !item.title().isBlank()) {
                    Note note = item.noteId() != null ? noteMap.getOrDefault(item.noteId(), defaultNote) : defaultNote;
                    Course course = note != null ? note.getCourse() : null;
                    Task task = new Task(course, item.title());
                    task.setNote(note);
                    task.setDescription(item.description());
                    task.setScheduledDate(item.scheduledDate());
                    if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                        task.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
                    }
                    tasks.add(task);
                }
            }
        }

        if (extracted.events() != null) {
            for (NoteProcessor.ExtractedEvent item : extracted.events()) {
                if (item.title() != null && !item.title().isBlank() && item.deadline() != null) {
                    Note note = item.noteId() != null ? noteMap.getOrDefault(item.noteId(), defaultNote) : defaultNote;
                    Course course = note != null ? note.getCourse() : null;
                    AcademicEvent event = new AcademicEvent(
                            course,
                            note,
                            item.title(),
                            item.description(),
                            item.deadline()
                    );
                    events.add(event);
                }
            }
        }

        if (extracted.contexts() != null) {
            for (NoteProcessor.ExtractedContext item : extracted.contexts()) {
                if (item.value() != null && !item.value().isBlank()) {
                    Note note = item.noteId() != null ? noteMap.getOrDefault(item.noteId(), defaultNote) : defaultNote;
                    Course course = note != null ? note.getCourse() : null;
                    AcademicContext context = new AcademicContext(
                            course,
                            note,
                            item.value()
                    );
                    contexts.add(context);
                }
            }
        }

        return new ExtractionResult(tasks, events, contexts);
    }

    private record ExtractionResult(
            List<Task> tasks,
            List<AcademicEvent> events,
            List<AcademicContext> contexts) {
    }
}
