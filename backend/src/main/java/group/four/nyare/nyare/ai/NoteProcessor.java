package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.ai.parser.CsvParser;
import group.four.nyare.nyare.ai.parser.StubReferenceCodec;
import group.four.nyare.nyare.ai.prompt.TaggedPromptBuilder;
import group.four.nyare.nyare.model.Note;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Spring AI wrapper for bulk processing of student journal notes and extracting academic entities.
 */
@Component
public class NoteProcessor {

    public static final String DEFAULT_SYSTEM_PROMPT = """
            You are an academic planning assistant for Nyare.
            Extract actionable tasks, rigid academic events or deadlines, and temporal academic context facts from student journal notes.
            Link each extracted item to its source note using the note_ref identifier.
            Use the temporal_anchor tag to resolve relative dates and deadlines (such as 'tomorrow', 'next Friday', or day names).
            Preserve uncertainty. Never hallucinate deadlines or durations.
            """;

    private static final String[] NOTE_CSV_HEADERS = {"note_ref", "course", "content"};
    private static final String[] IMAGE_CSV_HEADERS = {"image_ref", "note_ref", "description"};

    private final ChatClient chatClient;

    @Autowired
    public NoteProcessor(ChatClient.Builder chatClientBuilder) {
        this(chatClientBuilder.defaultSystem(DEFAULT_SYSTEM_PROMPT).build());
    }

    public NoteProcessor(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Processes notes in bulk and extracts structured entities.
     * Uses stub reference codecs to reduce prompt token size.
     *
     * @param notes list of notes to process
     * @return extracted tasks, events, and contexts with resolved note references
     */
    public ExtractedData process(List<Note> notes) {
        if (notes == null || notes.isEmpty()) {
            return emptyExtractedData();
        }

        List<Note> validNotes = notes.stream()
                .filter(note -> note != null && note.getContent() != null
                        && note.getContent().getMarkdown() != null
                        && !note.getContent().getMarkdown().isBlank())
                .toList();

        if (validNotes.isEmpty()) {
            return emptyExtractedData();
        }

        StubReferenceCodec<Note> noteCodec = new StubReferenceCodec<>("n");

        String notesCsv = CsvParser.toCsv(
                NOTE_CSV_HEADERS,
                validNotes,
                note -> new Object[]{
                        noteCodec.encode(note),
                        note.getCourse() != null ? note.getCourse().getName() : "",
                        note.getContent().getMarkdown()
                }
        );

        LocalDate today = LocalDate.now();
        String timeContext = String.format("Current Reference Date: %s (%s)", today, today.getDayOfWeek());

        TaggedPromptBuilder promptBuilder = TaggedPromptBuilder.builder()
                .tag("temporal_anchor", timeContext)
                .tag("journal_notes", notesCsv);

        // Minimum scaffold for image processing with compact references
        String imagesCsv = processImagesToCsv(validNotes, noteCodec);
        promptBuilder.tagIfPresent("images", imagesCsv);

        Prompt prompt = promptBuilder.buildPrompt();

        ExtractedData rawResult = this.chatClient.prompt(prompt)
                .call()
                .entity(ExtractedData.class);

        return rawResult != null ? decodeReferences(rawResult, noteCodec) : emptyExtractedData();
    }

    /**
     * Scaffolding for image processing: converts note images into CSV format using stub references.
     *
     * @param notes list of notes containing potential image metadata
     * @param noteCodec codec managing note stub references
     * @return CSV formatted image string
     */
    private String processImagesToCsv(List<Note> notes, StubReferenceCodec<Note> noteCodec) {
        // TODO: call multimodal vision model on raw image base64 data
        // TODO: generate rich semantic description for each image
        // TODO: update note ImageMetadata with descriptions before CSV serialization
        StubReferenceCodec<String> imageCodec = new StubReferenceCodec<>("i");
        List<ImageRow> imageRows = new ArrayList<>();

        for (Note note : notes) {
            if (note.getContent() != null && note.getContent().getImageMetadata() != null) {
                String noteRef = noteCodec.encode(note);
                note.getContent().getImageMetadata().forEach((imageId, metadata) -> {
                    if (metadata != null) {
                        String imageRef = imageCodec.encode(imageId);
                        String description = metadata.getDescription() != null ? metadata.getDescription() : "";
                        imageRows.add(new ImageRow(imageRef, noteRef, description));
                    }
                });
            }
        }

        if (imageRows.isEmpty()) {
            return "";
        }

        return CsvParser.toCsv(
                IMAGE_CSV_HEADERS,
                imageRows,
                row -> new Object[]{row.imageRef(), row.noteRef(), row.description()}
        );
    }

    /**
     * Decodes compact note_ref strings in extracted items back to original Note UUIDs.
     */
    private ExtractedData decodeReferences(ExtractedData raw, StubReferenceCodec<Note> noteCodec) {
        List<ExtractedTask> tasks = raw.tasks() != null
                ? raw.tasks().stream()
                        .map(t -> {
                            Note note = noteCodec.decode(t.noteRef());
                            UUID noteId = note != null ? note.getId() : null;
                            return new ExtractedTask(
                                    t.noteRef(),
                                    noteId,
                                    t.title(),
                                    t.description(),
                                    t.scheduledDate(),
                                    t.estimatedMinutes());
                        })
                        .toList()
                : Collections.emptyList();

        List<ExtractedEvent> events = raw.events() != null
                ? raw.events().stream()
                        .map(e -> {
                            Note note = noteCodec.decode(e.noteRef());
                            UUID noteId = note != null ? note.getId() : null;
                            return new ExtractedEvent(
                                    e.noteRef(),
                                    noteId,
                                    e.title(),
                                    e.description(),
                                    e.deadline());
                        })
                        .toList()
                : Collections.emptyList();

        List<ExtractedContext> contexts = raw.contexts() != null
                ? raw.contexts().stream()
                        .map(c -> {
                            Note note = noteCodec.decode(c.noteRef());
                            UUID noteId = note != null ? note.getId() : null;
                            return new ExtractedContext(
                                    c.noteRef(),
                                    noteId,
                                    c.value());
                        })
                        .toList()
                : Collections.emptyList();

        return new ExtractedData(tasks, events, contexts);
    }

    private static ExtractedData emptyExtractedData() {
        return new ExtractedData(Collections.emptyList(), Collections.emptyList(), Collections.emptyList());
    }

    private record ImageRow(String imageRef, String noteRef, String description) {
    }

    public record ExtractedTask(
            String noteRef,
            UUID noteId,
            String title,
            String description,
            LocalDate scheduledDate,
            Integer estimatedMinutes) {
    }

    public record ExtractedEvent(
            String noteRef,
            UUID noteId,
            String title,
            String description,
            LocalDateTime deadline) {
    }

    public record ExtractedContext(
            String noteRef,
            UUID noteId,
            String value) {
    }

    public record ExtractedData(
            List<ExtractedTask> tasks,
            List<ExtractedEvent> events,
            List<ExtractedContext> contexts) {
    }
}
