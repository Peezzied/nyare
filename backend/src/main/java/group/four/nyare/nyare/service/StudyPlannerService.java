package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;

/**
 * Service contract for processing daily course journal notes.
 */
public interface StudyPlannerService {

    /**
     * Processes today's notes across all courses, materializes extracted entities,
     * and returns the count summary.
     *
     * @return summary count of created tasks, events, and contexts
     * @throws BadRequestException if no notes exist for today
     */
    ProcessSummaryResponse processTodayNotes();
}
