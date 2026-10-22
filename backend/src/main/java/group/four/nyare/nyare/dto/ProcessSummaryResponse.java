package group.four.nyare.nyare.dto;

import java.util.List;

/**
 * Summary of entities extracted and persisted during journal processing.
 */
public class ProcessSummaryResponse {

    private int tasksCreated;
    private int tasksPromoted;
    private int eventsCreated;
    private int contextsCreated;
    private List<Long> affectedCourseIds;

    public ProcessSummaryResponse() {
    }

    public ProcessSummaryResponse(int tasksCreated, int eventsCreated, int contextsCreated) {
        this(tasksCreated, 0, eventsCreated, contextsCreated, List.of());
    }

    public ProcessSummaryResponse(int tasksCreated, int eventsCreated, int contextsCreated,
                                  List<Long> affectedCourseIds) {
        this(tasksCreated, 0, eventsCreated, contextsCreated, affectedCourseIds);
    }

    public ProcessSummaryResponse(int tasksCreated, int tasksPromoted, int eventsCreated, int contextsCreated) {
        this(tasksCreated, tasksPromoted, eventsCreated, contextsCreated, List.of());
    }

    public ProcessSummaryResponse(int tasksCreated, int tasksPromoted, int eventsCreated, int contextsCreated,
                                  List<Long> affectedCourseIds) {
        this.tasksCreated = tasksCreated;
        this.tasksPromoted = tasksPromoted;
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

    public int getTasksPromoted() {
        return tasksPromoted;
    }

    public void setTasksPromoted(int tasksPromoted) {
        this.tasksPromoted = tasksPromoted;
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
