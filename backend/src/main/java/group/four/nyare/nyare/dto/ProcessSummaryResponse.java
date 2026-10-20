package group.four.nyare.nyare.dto;

import java.util.List;

/**
 * Summary of entities extracted and persisted during journal processing.
 */
public class ProcessSummaryResponse {

    private int tasksCreated;
    private int eventsCreated;
    private int contextsCreated;
    private List<Long> affectedCourseIds;

    public ProcessSummaryResponse() {
    }

    public ProcessSummaryResponse(int tasksCreated, int eventsCreated, int contextsCreated) {
        this(tasksCreated, eventsCreated, contextsCreated, List.of());
    }

    public ProcessSummaryResponse(int tasksCreated, int eventsCreated, int contextsCreated,
                                  List<Long> affectedCourseIds) {
        this.tasksCreated = tasksCreated;
        this.eventsCreated = eventsCreated;
        this.contextsCreated = contextsCreated;
        this.affectedCourseIds = affectedCourseIds;
    }

    public int getTasksCreated() {
        return tasksCreated;
    }

    public void setTasksCreated(int tasksCreated) {
        this.tasksCreated = tasksCreated;
    }

    public int getEventsCreated() {
        return eventsCreated;
    }

    public void setEventsCreated(int eventsCreated) {
        this.eventsCreated = eventsCreated;
    }

    public int getContextsCreated() {
        return contextsCreated;
    }

    public void setContextsCreated(int contextsCreated) {
        this.contextsCreated = contextsCreated;
    }

    public List<Long> getAffectedCourseIds() {
        return affectedCourseIds;
    }

    public void setAffectedCourseIds(List<Long> affectedCourseIds) {
        this.affectedCourseIds = affectedCourseIds;
    }
}
