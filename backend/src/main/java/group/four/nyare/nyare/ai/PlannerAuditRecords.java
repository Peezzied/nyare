package group.four.nyare.nyare.ai;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Audit proxy records collected from {@link StudyPlannerEngine}.
 *
 * <p>Holds the raw LLM audit payload and its decoded internal form.
 * No repository access. No behavior; types only.
 */
public final class PlannerAuditRecords {

    private PlannerAuditRecords() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LlmPayload(
            @JsonProperty(value = "tasks", required = true)
            @JsonPropertyDescription("Extracted actionable tasks")
            List<RawTask> tasks,

            @JsonProperty(value = "events", required = true)
            @JsonPropertyDescription("Extracted rigid academic events and deadlines")
            List<RawEvent> events,

            @JsonProperty(value = "contexts", required = true)
            @JsonPropertyDescription("Extracted academic context facts")
            List<StudyPlannerEngine.ExtractedContext> contexts,

            @JsonProperty(value = "ignoredNotes", required = true)
            @JsonPropertyDescription("Internal list of omitted unrelated statements or ignored outlier notes for system auditing")
            List<RawIgnoredNote> ignoredNotes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawTask(
            @JsonProperty("noteRef")
            @JsonAlias({"note_ref", "noteRef", "source_note", "note"})
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1) for new tasks")
            String noteRef,

            @JsonProperty("taskId")
            @JsonAlias({"task_id", "taskId", "id"})
            @JsonPropertyDescription("Existing task ID (UUID) for updated existing tasks")
            UUID taskId,

            @JsonProperty(value = "title", required = true)
            @JsonAlias({"task_title", "title", "name", "task"})
            @JsonPropertyDescription("Actionable title of the task")
            @Size(max = 255)
            String title,

            @JsonProperty(value = "description", required = true)
            @JsonAlias({"task_description", "description", "desc", "details"})
            @JsonPropertyDescription("Details or instructions for the task")
            @Size(max = 2048)
            String description,

            @JsonProperty("scheduledDate")
            @JsonAlias({"scheduled_date", "scheduledDate", "date", "target_date"})
            @JsonPropertyDescription("Target study date in YYYY-MM-DD format, or null if uncertain")
            LocalDate scheduledDate,

            @JsonProperty("estimatedMinutes")
            @JsonAlias({"estimated_minutes", "estimatedMinutes", "duration", "duration_minutes", "minutes"})
            @JsonPropertyDescription("Estimated duration in minutes, or null if uncertain")
            Integer estimatedMinutes,

            @JsonProperty(value = "rationale", required = true)
            @JsonAlias({"reason", "rationale", "explanation"})
            @JsonPropertyDescription("Explanation of the planning decision for task timing, duration, or backlog placement")
            String rationale) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawEvent(
            @JsonProperty(value = "noteRef", required = true)
            @JsonAlias({"note_ref", "noteRef", "source_note", "note"})
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1)")
            String noteRef,

            @JsonProperty(value = "title", required = true)
            @JsonAlias({"event_title", "title", "name", "event"})
            @JsonPropertyDescription("Name of the academic event or deadline")
            @Size(max = 255)
            String title,

            @JsonProperty(value = "description", required = true)
            @JsonAlias({"event_description", "description", "desc", "details"})
            @JsonPropertyDescription("Event details, coverage or instructions")
            @Size(max = 2048)
            String description,

            @JsonProperty(value = "deadline", required = true)
            @JsonAlias({"due_date", "deadline", "due", "datetime", "timestamp"})
            @JsonPropertyDescription("Rigid deadline timestamp in ISO-8601 format (YYYY-MM-DDTHH:mm:ss)")
            LocalDateTime deadline,

            @JsonProperty(value = "rationale", required = true)
            @JsonAlias({"reason", "rationale", "explanation"})
            @JsonPropertyDescription("Explanation of how the deadline timestamp was derived from context and schedule")
            String rationale) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawIgnoredNote(
            @JsonProperty(value = "noteRef", required = true)
            @JsonPropertyDescription("Reference identifier of the source note (e.g. n1)")
            String noteRef,

            @JsonProperty(value = "part", required = true)
            @JsonPropertyDescription("The exact statement, text, or entire note that induced the audit")
            String part,

            @JsonProperty(value = "reason", required = true)
            @JsonPropertyDescription("Explanation of why this part is unrelated or why the entire note was ignored")
            String reason) {
    }

    public record InternalIgnoredNote(
            UUID noteId,
            String part,
            String reason) {
    }
}
