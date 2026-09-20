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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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

    public StudyPlannerServiceImpl(
            CourseRepository courseRepository,
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository) {
        this.courseRepository = courseRepository;
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
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

        // TODO(spring-ai): replace stub with ChatClient entity() extraction call
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

    // ponytail: stub returns empty extraction — replace with Spring AI call
    private ExtractionResult extractFromNotes(List<Note> notes) {
        return new ExtractionResult(List.of(), List.of(), List.of());
    }

    private record ExtractionResult(
            List<Task> tasks,
            List<AcademicEvent> events,
            List<AcademicContext> contexts) {
    }
}
