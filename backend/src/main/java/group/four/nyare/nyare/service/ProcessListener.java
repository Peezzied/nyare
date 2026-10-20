package group.four.nyare.nyare.service;

import java.time.LocalDate;

/**
 * Callback contract for observing and cancelling a {@link StudyPlannerService#processNotes} run.
 * Cancellation is cooperative: the service checks {@link #isCancelled()} at fixed checkpoints
 * (before each dirty date, after image AI calls, and after the planner engine call) and aborts
 * the transactional run when it reports {@code true}.
 */
public interface ProcessListener {

    /** No-op listener used when cancellation and progress reporting are not needed. */
    ProcessListener NONE = new ProcessListener() {};

    /**
     * Reports whether the run should be cancelled at the next checkpoint.
     *
     * @return {@code true} to abort the run and roll back the transaction
     */
    default boolean isCancelled() {
        return false;
    }

    /**
     * Called when processing of one dirty date begins.
     *
     * @param date  the dirty date being processed
     * @param index the 1-based position of this date in the run
     * @param total the total number of dirty dates in the run
     */
    default void onDateStarted(LocalDate date, int index, int total) {}
}
