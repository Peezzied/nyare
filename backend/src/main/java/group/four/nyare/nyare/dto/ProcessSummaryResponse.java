package group.four.nyare.nyare.dto;

/**
 * Summary of entities extracted and persisted during journal processing.
 */
public class ProcessSummaryResponse {

    private int tasksCreated;
    private int eventsCreated;
    private int contextsCreated;

    public ProcessSummaryResponse() {
    }

    public ProcessSummaryResponse(int tasksCreated, int eventsCreated, int contextsCreated) {
        this.tasksCreated = tasksCreated;
        this.eventsCreated = eventsCreated;
        this.contextsCreated = contextsCreated;
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
}
