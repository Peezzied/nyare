package group.four.nyare.nyare.service.impl;

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
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private final CourseRepository courseRepository;
    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final ChatClient chatClient;

    @Autowired
    public StudyPlannerServiceImpl(
            CourseRepository courseRepository,
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ChatClient.Builder chatClientBuilder) {
        this(
                courseRepository,
                noteRepository,
                taskRepository,
                academicEventRepository,
                academicContextRepository,
                chatClientBuilder
                        .defaultSystem("""
                                You are an academic planning assistant for Nyare.
                                Extract actionable tasks, rigid academic events or deadlines, and temporal academic context facts from student journal notes.
                                Preserve uncertainty. Never hallucinate deadlines or durations.
                                """)
                        .build()
        );
    }

    public StudyPlannerServiceImpl(
            CourseRepository courseRepository,
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ChatClient chatClient) {
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.chatClient = chatClient;
    }

    @Override
    @Transactional
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

        List<Task> savedTasks = taskRepository.saveAll(extracted.tasks());
        List<AcademicEvent> savedEvents = academicEventRepository.saveAll(extracted.events());
        List<AcademicContext> savedContexts = academicContextRepository.saveAll(extracted.contexts());

        return new ProcessSummaryResponse(
                savedTasks.size(),
                savedEvents.size(),
                savedContexts.size()
        );
    }

    private ExtractionResult extractFromNotes(List<Note> notes) {
        List<Task> tasks = new ArrayList<>();
        List<AcademicEvent> events = new ArrayList<>();
        List<AcademicContext> contexts = new ArrayList<>();

        for (Note note : notes) {
            if (note.getContent() == null || note.getContent().getMarkdown() == null || note.getContent().getMarkdown().isBlank()) {
                continue;
            }

            String courseName = note.getCourse() != null ? note.getCourse().getName() : "General";
            String prompt = "Course: " + courseName + "\n\nJournal Note:\n" + note.getContent().getMarkdown();

            ExtractedData extracted = this.chatClient.prompt()
                    .user(prompt)
                    .call()
                    .entity(ExtractedData.class);

            if (extracted == null) {
                continue;
            }

            if (extracted.tasks() != null) {
                for (ExtractedTask item : extracted.tasks()) {
                    if (item.title() != null && !item.title().isBlank()) {
                        Task task = new Task(note.getCourse(), item.title());
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
                for (ExtractedEvent item : extracted.events()) {
                    if (item.title() != null && !item.title().isBlank() && item.deadline() != null) {
                        AcademicEvent event = new AcademicEvent(
                                note.getCourse(),
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
                for (ExtractedContext item : extracted.contexts()) {
                    if (item.value() != null && !item.value().isBlank()) {
                        AcademicContext context = new AcademicContext(
                                note.getCourse(),
                                note,
                                item.value()
                        );
                        contexts.add(context);
                    }
                }
            }
        }

        return new ExtractionResult(tasks, events, contexts);
    }

    public record ExtractedTask(
            String title,
            String description,
            LocalDate scheduledDate,
            Integer estimatedMinutes) {
    }

    public record ExtractedEvent(
            String title,
            String description,
            LocalDateTime deadline) {
    }

    public record ExtractedContext(
            String value) {
    }

    public record ExtractedData(
            List<ExtractedTask> tasks,
            List<ExtractedEvent> events,
            List<ExtractedContext> contexts) {
    }

    private record ExtractionResult(
            List<Task> tasks,
            List<AcademicEvent> events,
            List<AcademicContext> contexts) {
    }
}
