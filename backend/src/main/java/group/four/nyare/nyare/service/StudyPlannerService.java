package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;

import java.time.LocalDate;

/**
 * Service contract for processing daily course journal notes.
 */
public interface StudyPlannerService {

    /**
     * Processes dirty notes for the given date matching optional user filter, materializes
     * extracted entities, and returns the count summary.
     *
     * @param date   the calendar date whose dirty notes will be processed
     * @param userId optional user identifier to restrict processing scope
     * @return summary count of created tasks, events, and contexts
     * @throws BadRequestException if no dirty notes exist for the given date
     */
    ProcessSummaryResponse processNotes(LocalDate date, Long userId);

    /**
     * Processes dirty notes for the given date across all courses, materializes
     * extracted entities, and returns the count summary.
     *
     * @param date the calendar date whose dirty notes will be processed
     * @return summary count of created tasks, events, and contexts
     * @throws BadRequestException if no dirty notes exist for the given date
     */
    default ProcessSummaryResponse processNotes(LocalDate date) {
        return processNotes(date, null);
    }
}
