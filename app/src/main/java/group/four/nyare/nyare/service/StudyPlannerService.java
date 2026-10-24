package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.PlannerStatusResponse;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;

import java.time.LocalDate;

/**
 * Service contract for processing daily course journal notes.
 */
public interface StudyPlannerService {

    /**
     * Retrieves pre-flight status on pending dirty notes for study planning.
     *
     * @param userId the user identifier
     * @return pending status including dirty note count, distinct dates, and courses
     */
    PlannerStatusResponse getPlannerStatus(Long userId);

    /**
     * Processes all pending dirty notes for the specified user sequentially across dates,
     * materializes extracted entities, and returns the aggregate count summary.
     *
     * @param userId the user identifier
     * @return summary count of created tasks, events, and contexts
     *         with the identifiers of courses processed in this run
     * @throws BadRequestException if no dirty notes exist or userId is null
     */
    ProcessSummaryResponse processNotes(Long userId);

    /**
     * Processes all pending dirty notes for the specified user sequentially across dates,
     * materializes extracted entities, and returns the aggregate count summary. The supplied
     * listener receives per-date progress callbacks and is polled at checkpoints for
     * cooperative cancellation.
     *
     * @param userId   the user identifier
     * @param listener observer reporting per-date progress and cancellation state
     * @return summary count of created tasks, events, and contexts
     *         with the identifiers of courses processed in this run
     * @throws BadRequestException if no dirty notes exist or userId is null
     * @throws java.util.concurrent.CancellationException when the listener reports
     *         cancellation; the whole run rolls back
     */
    ProcessSummaryResponse processNotes(Long userId, ProcessListener listener);

    /**
     * Processes dirty notes for the given date for the specified user, materializes
     * extracted entities, and returns the count summary.
     *
     * @param date   the calendar date whose dirty notes will be processed
     * @param userId the user identifier
     * @return summary count of created tasks, events, and contexts
     *         with the identifiers of courses processed in this run
     * @throws BadRequestException if no dirty notes exist for the given date or userId is null
     */
    ProcessSummaryResponse processNotes(LocalDate date, Long userId);
}

