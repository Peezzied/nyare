package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;

import java.time.LocalDate;

/**
 * Service contract for processing daily course journal notes.
 */
public interface StudyPlannerService {

    /**
     * Processes dirty notes for the given date for the specified user, materializes
     * extracted entities, and returns the count summary.
     *
     * @param date   the calendar date whose dirty notes will be processed
     * @param userId the user identifier
     * @return summary count of created tasks, events, and contexts
     * @throws BadRequestException if no dirty notes exist for the given date or userId is null
     */
    ProcessSummaryResponse processNotes(LocalDate date, Long userId);
}
