package group.four.nyare.nyare.event;

import java.time.LocalDate;

/**
 * Domain event published when the study planner begins processing a specific dirty date.
 *
 * @param userId the user identifier owning the planning run
 * @param date   the dirty date being processed
 * @param index  1-based index of this date in the run
 * @param total  total number of dirty dates in the run
 */
public record PlanningProgressEvent(Long userId, LocalDate date, int index, int total) {
}
