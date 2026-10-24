package group.four.nyare.nyare.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PlannerStatusResponse {

    private boolean hasPendingNotes;
    private int dirtyNoteCount;
    private List<LocalDate> dirtyDates;
    private List<String> courseNames;
    private List<PendingNoteSummary> pendingNotes = new ArrayList<>();

    public PlannerStatusResponse() {
    }

    public PlannerStatusResponse(boolean hasPendingNotes, int dirtyNoteCount, List<LocalDate> dirtyDates, List<String> courseNames) {
        this(hasPendingNotes, dirtyNoteCount, dirtyDates, courseNames, new ArrayList<>());
    }

    public PlannerStatusResponse(boolean hasPendingNotes, int dirtyNoteCount, List<LocalDate> dirtyDates, List<String> courseNames, List<PendingNoteSummary> pendingNotes) {
        this.hasPendingNotes = hasPendingNotes;
        this.dirtyNoteCount = dirtyNoteCount;
        this.dirtyDates = dirtyDates;
        this.courseNames = courseNames;
        this.pendingNotes = pendingNotes != null ? pendingNotes : new ArrayList<>();
    }

    public boolean isHasPendingNotes() {
        return hasPendingNotes;
    }

    public void setHasPendingNotes(boolean hasPendingNotes) {
        this.hasPendingNotes = hasPendingNotes;
    }

    public int getDirtyNoteCount() {
        return dirtyNoteCount;
    }

    public void setDirtyNoteCount(int dirtyNoteCount) {
        this.dirtyNoteCount = dirtyNoteCount;
    }

    public List<LocalDate> getDirtyDates() {
        return dirtyDates;
    }

    public void setDirtyDates(List<LocalDate> dirtyDates) {
        this.dirtyDates = dirtyDates;
    }

    public List<String> getCourseNames() {
        return courseNames;
    }

    public void setCourseNames(List<String> courseNames) {
        this.courseNames = courseNames;
    }

    public List<PendingNoteSummary> getPendingNotes() {
        return pendingNotes;
    }

    public void setPendingNotes(List<PendingNoteSummary> pendingNotes) {
        this.pendingNotes = pendingNotes;
    }

    public static class PendingNoteSummary {
        private UUID id;
        private String title;
        private String courseName;
        private LocalDate entryDate;

        public PendingNoteSummary() {
        }

        public PendingNoteSummary(UUID id, String title, String courseName, LocalDate entryDate) {
            this.id = id;
            this.title = title;
            this.courseName = courseName;
            this.entryDate = entryDate;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getCourseName() {
            return courseName;
        }

        public void setCourseName(String courseName) {
            this.courseName = courseName;
        }

        public LocalDate getEntryDate() {
            return entryDate;
        }

        public void setEntryDate(LocalDate entryDate) {
            this.entryDate = entryDate;
        }
    }
}
