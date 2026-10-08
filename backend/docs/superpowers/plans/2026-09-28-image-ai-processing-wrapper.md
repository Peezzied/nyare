# Image AI Processing Wrapper & Metadata Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated Spring AI wrapper (`ImageAiProcessor`) for multimodal image extraction, update and persist image descriptions in `StudyPlannerServiceImpl`, and inject image context into `StudyPlannerEngine` planning prompts.

**Architecture:** A dedicated component `ImageAiProcessor` wraps Spring AI `ChatClient` to analyze note image attachments. `StudyPlannerServiceImpl` extracts image references from dirty notes, queries `ImageRepository`, triggers `ImageAiProcessor` for unindexed images, and persists `image.description`. `StudyPlannerEngine` encodes images into the `{image}` CSV table for the single-pass study planning prompt.

**Tech Stack:** Java 25, Spring Boot 4.1.1, Spring AI 2.0.0 (`spring-ai-starter-model-google-genai`), Spring Data JPA, SQLite, JUnit 5, Mockito, AssertJ.

**Spec:** `docs/temp/planner-ai-orchestration.md`, `docs/api/notes-api/notes-api.md`.

## Global Constraints

- Never mutate student-authored markdown text in `Note.content`.
- Only update and persist `Image.description` in `ImageRepository`.
- Keep `StudyPlannerEngine` pure: no repository access in `StudyPlannerEngine`.
- Enforce class-level `@Transactional(readOnly = true)` and method-level `@Transactional` on mutations in services.
- Follow ASD-STE100 rules for all error messages and prompt specifications.
- Use canonical exceptions only (`ResourceNotFoundException`, `BadRequestException`).

---

### Task 1: Create `ImageAiProcessor` Component and Unit Tests

**Files:**
- Create: `src/main/java/group/four/nyare/nyare/ai/ImageAiProcessor.java`
- Test: `src/test/java/group/four/nyare/nyare/ai/ImageAiProcessorTest.java`

**Interfaces:**
- Consumes: `byte[] data`, `String contentType` (from `Image` entity)
- Produces: `String describeImage(byte[] data, String contentType)` returning a concise English description or OCR summary

- [ ] **Step 1: Write the failing unit test for `ImageAiProcessor`**

```java
package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeType;

import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ImageAiProcessorTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private ChatClient chatClient;

    private ImageAiProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new ImageAiProcessor(chatClient, 5000);
    }

    @Test
    @DisplayName("describeImage returns empty string when data is null or empty")
    void returnsEmptyWhenDataNullOrEmpty() {
        assertThat(processor.describeImage(null, "image/png")).isEmpty();
        assertThat(processor.describeImage(new byte[0], "image/png")).isEmpty();
        verifyNoInteractions(chatClient);
    }

    @Test
    @DisplayName("describeImage calls ChatClient with media and returns trimmed description")
    void callsChatClientWithMedia() {
        byte[] sampleBytes = new byte[]{1, 2, 3, 4};
        when(chatClient.prompt().user(any(Consumer.class)).call().content())
                .thenReturn("  Diagram showing binary search tree traversal.  ");

        String result = processor.describeImage(sampleBytes, "image/png");

        assertThat(result).isEqualTo("Diagram showing binary search tree traversal.");
    }

    @Test
    @DisplayName("describeImage defaults to image/png when contentType is null or blank")
    void defaultsContentTypeWhenBlank() {
        byte[] sampleBytes = new byte[]{1, 2, 3, 4};
        when(chatClient.prompt().user(any(Consumer.class)).call().content())
                .thenReturn("Lecture slide formulas.");

        String result = processor.describeImage(sampleBytes, "  ");

        assertThat(result).isEqualTo("Lecture slide formulas.");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `gradlew test --tests group.four.nyare.nyare.ai.ImageAiProcessorTest`
Expected: Compilation failure because `ImageAiProcessor` does not exist yet.

- [ ] **Step 3: Implement `ImageAiProcessor`**

```java
package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.exception.BadRequestException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;

import java.util.concurrent.CancellationException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Dedicated Spring AI wrapper for multimodal image description and OCR analysis.
 */
@Component
public class ImageAiProcessor {

    private static final String DEFAULT_IMAGE_PROMPT =
            "Analyze this academic note image. Provide a concise English description including diagrams, charts, handwritten notes, exercises, formulas, or OCR text. Do not include conversational text.";

    private final ChatClient chatClient;
    private final long aiTimeoutMs;

    @Autowired
    public ImageAiProcessor(
            ChatClient.Builder chatClientBuilder,
            @Value("${nyare.image-processor.ai-timeout-ms:30000}") long aiTimeoutMs) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are an academic note image analyzer. You extract visual diagrams, equations, and text into concise, normalized English descriptions.")
                .build();
        this.aiTimeoutMs = aiTimeoutMs;
    }

    ImageAiProcessor(ChatClient chatClient, long aiTimeoutMs) {
        this.chatClient = chatClient;
        this.aiTimeoutMs = aiTimeoutMs;
    }

    /**
     * Analyzes an image binary and generates an English description.
     *
     * @param data        binary bytes of the image
     * @param contentType MIME type of the image (e.g. image/png, image/jpeg)
     * @return trimmed descriptive summary or empty string if data is null/empty
     */
    public String describeImage(byte[] data, String contentType) {
        if (data == null || data.length == 0) {
            return "";
        }

        String mimeTypeStr = (contentType != null && !contentType.isBlank())
                ? contentType.trim()
                : MimeTypeUtils.IMAGE_PNG_VALUE;
        MimeType mimeType = MimeTypeUtils.parseMimeType(mimeTypeStr);
        ByteArrayResource resource = new ByteArrayResource(data);

        return callWithTimeout(resource, mimeType);
    }

    private String callWithTimeout(ByteArrayResource resource, MimeType mimeType) {
        if (aiTimeoutMs <= 0) {
            String content = chatClient.prompt()
                    .user(u -> u.text(DEFAULT_IMAGE_PROMPT).media(mimeType, resource))
                    .call()
                    .content();
            return content != null ? content.trim() : "";
        }

        CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                chatClient.prompt()
                        .user(u -> u.text(DEFAULT_IMAGE_PROMPT).media(mimeType, resource))
                        .call()
                        .content()
        );

        try {
            String result = future.orTimeout(aiTimeoutMs, TimeUnit.MILLISECONDS).join();
            return result != null ? result.trim() : "";
        } catch (CompletionException ex) {
            future.cancel(true);
            Throwable cause = ex.getCause();
            if (cause instanceof TimeoutException) {
                throw new BadRequestException("Image AI processing timed out after " + aiTimeoutMs + " ms", cause);
            }
            if (cause instanceof RuntimeException runtime) {
                throw runtime;
            }
            if (cause instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new BadRequestException(cause != null ? cause.getMessage() : "Image AI processing failed", cause);
        } catch (CancellationException ex) {
            future.cancel(true);
            Thread.currentThread().interrupt();
            throw new BadRequestException("Image AI processing timed out after " + aiTimeoutMs + " ms", ex);
        }
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `gradlew test --tests group.four.nyare.nyare.ai.ImageAiProcessorTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/ai/ImageAiProcessor.java src/test/java/group/four/nyare/nyare/ai/ImageAiProcessorTest.java
git commit -m "feat(ai): add dedicated ImageAiProcessor wrapper"
```

---

### Task 2: Extend `StudyPlannerEngine` with Note Image CSV Encoding

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java`
- Test: `src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`

**Interfaces:**
- Consumes: `Map<UUID, List<Image>> noteImages` (or `process` overload accepting note images)
- Produces: Formatted `{image}` CSV table (`image_ref`, `note_ref`, `description`) within the `<images>` tag in `TaggedPromptBuilder`.

- [ ] **Step 1: Write tests in `StudyPlannerEngineTest` for image CSV generation**

```java
    @Test
    @DisplayName("process formats images CSV when note images are present")
    void processIncludesImagesCsvWhenPresent() {
        Course course = new Course("CS101", "Computer Science");
        Note note = new Note(course, "Check diagram");
        UUID noteId = UUID.randomUUID();
        ReflectionTestUtils.setField(note, "id", noteId);

        Image image = new Image(new byte[]{1, 2}, "image/png", "diagram.png", 2L);
        image.setDescription("Binary tree architecture diagram");
        UUID imageId = UUID.randomUUID();
        ReflectionTestUtils.setField(image, "id", imageId);

        when(chatClient.prompt(any(Prompt.class))
                .advisors(any(Consumer.class))
                .call()
                .entity(PlannerAuditRecords.LlmPayload.class))
                .thenReturn(new PlannerAuditRecords.LlmPayload(List.of(), List.of(), List.of(), List.of()));

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);

        engine.process(List.of(note), List.of(), List.of(), List.of(), List.of(), Map.of(noteId, List.of(image)));

        verify(chatClient).prompt(promptCaptor.capture());
        String promptContent = promptCaptor.getValue().getContents();
        assertThat(promptContent).contains("<images>");
        assertThat(promptContent).contains("i1,n1,Binary tree architecture diagram");
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineTest`
Expected: Compilation failure on `engine.process(..., Map.of(noteId, List.of(image)))`.

- [ ] **Step 3: Update `StudyPlannerEngine.java`**

1. Add overloaded `process` method accepting `Map<UUID, List<Image>> noteImages`.
2. Keep the 5-parameter `process` delegating with `Collections.emptyMap()`.
3. Implement `buildImagesCsv(List<Note> validNotes, Map<UUID, List<Image>> noteImages, StubReferenceCodec<Note> noteCodec, StubReferenceCodec<Image> imageCodec)`.
4. Include `.tagIfPresent(Tags.IMAGE, imagesCsv)` in `builder`.

```java
    public ExtractedData process(
            List<Note> notes,
            List<Task> existingTasks,
            List<AcademicEvent> existingEvents,
            List<AcademicContext> existingContexts,
            List<Schedule> schedules) {
        return process(notes, existingTasks, existingEvents, existingContexts, schedules, Collections.emptyMap());
    }

    public ExtractedData process(
            List<Note> notes,
            List<Task> existingTasks,
            List<AcademicEvent> existingEvents,
            List<AcademicContext> existingContexts,
            List<Schedule> schedules,
            Map<UUID, List<Image>> noteImages) {

        if (notes == null || notes.isEmpty()) {
            return emptyExtractedData();
        }

        List<Note> validNotes = notes.stream()
                .filter(n -> n != null
                        && n.getContent() != null
                        && !n.getContent().isBlank())
                .toList();

        if (validNotes.isEmpty()) {
            return emptyExtractedData();
        }

        StubReferenceCodec<Note> noteCodec = new StubReferenceCodec<>("n");
        StubReferenceCodec<Image> imageCodec = new StubReferenceCodec<>("i");

        String notesCsv = CsvParser.toCsv(
                CsvHeaders.NOTE,
                validNotes,
                note -> new Object[]{
                        noteCodec.encode(note),
                        note.getCourse() != null ? note.getCourse().getName() : "",
                        note.getContent()
                }
        );

        String imagesCsv = buildImagesCsv(validNotes, noteImages, noteCodec, imageCodec);

        LocalDate today = LocalDate.now();
        String timeContext = String.format("Current Reference Date: %s (%s)", today, today.getDayOfWeek());

        TaggedPromptBuilder builder = TaggedPromptBuilder.builder()
                .tag(Tags.TIME, timeContext)
                .tag(Tags.JOURNAL, notesCsv)
                .tagIfPresent(Tags.IMAGE, imagesCsv)
                .tagIfPresent(Tags.TASKS, buildTasksCsv(existingTasks))
                .tagIfPresent(Tags.EVENTS, buildEventsCsv(existingEvents))
                .tagIfPresent(Tags.CONTEXTS, buildContextsCsv(existingContexts, today))
                .tagIfPresent(Tags.SCHEDULES, buildSchedulesCsv(schedules));

        Map<String, UUID> noteIdMap = new HashMap<>();
        for (Note note : validNotes) {
            noteIdMap.put(noteCodec.encode(note), note.getId());
        }

        Prompt prompt = builder.buildPrompt();

        PlannerAuditRecords.LlmPayload raw = callWithTimeout(noteIdMap, prompt);

        return raw != null ? decodeReferences(raw, noteCodec, existingTasks) : emptyExtractedData();
    }

    private String buildImagesCsv(
            List<Note> validNotes,
            Map<UUID, List<Image>> noteImages,
            StubReferenceCodec<Note> noteCodec,
            StubReferenceCodec<Image> imageCodec) {
        if (noteImages == null || noteImages.isEmpty()) {
            return "";
        }
        List<Object[]> rows = new ArrayList<>();
        for (Note note : validNotes) {
            if (note.getId() == null) continue;
            List<Image> images = noteImages.get(note.getId());
            if (images == null || images.isEmpty()) continue;
            for (Image image : images) {
                if (image == null || image.getDescription() == null || image.getDescription().isBlank()) continue;
                rows.add(new Object[]{
                        imageCodec.encode(image),
                        noteCodec.encode(note),
                        image.getDescription()
                });
            }
        }
        if (rows.isEmpty()) return "";
        return CsvParser.toCsvFromRows(CsvHeaders.IMAGE, rows);
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `gradlew test --tests group.four.nyare.nyare.ai.StudyPlannerEngineTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/ai/StudyPlannerEngine.java src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java
git commit -m "feat(ai): integrate note image CSV formatting in StudyPlannerEngine"
```

---

### Task 3: Integrate Image Discovery, AI Processing, and DB Updates in `StudyPlannerServiceImpl`

**Files:**
- Modify: `src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java`
- Test: `src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

**Interfaces:**
- Consumes: `ImageRepository`, `ImageAiProcessor`
- Produces: Updated `Image.description` rows in DB, image mapping passed to `StudyPlannerEngine.process(...)`

- [ ] **Step 1: Write unit tests in `StudyPlannerServiceImplTest` for image extraction and metadata update**

```java
    @Mock
    ImageRepository imageRepository;
    @Mock
    ImageAiProcessor imageAiProcessor;

    // In setUp: inject ImageRepository and ImageAiProcessor

    @Test
    @DisplayName("processNotes extracts image IDs from notes, updates missing descriptions, and saves to repository")
    void processNotes_extractsAndUpdatesMissingImageDescriptions() {
        UUID imageId = UUID.randomUUID();
        Course course = courseWithId(1L, "CS101");
        Note note = noteWithCourse(course);
        note.setContent("Check lecture slide ![slide](/api/images/" + imageId + ")");
        ReflectionTestUtils.setField(note, "id", UUID.randomUUID());

        Image image = new Image(new byte[]{1, 2}, "image/png", "slide.png", 2L);
        ReflectionTestUtils.setField(image, "id", imageId);
        // description is null initially

        when(noteRepository.findDirtyNotes(DATE)).thenReturn(List.of(note));
        when(imageRepository.findAllById(anySet())).thenReturn(List.of(image));
        when(imageAiProcessor.describeImage(any(), any())).thenReturn("Binary tree diagram");
        when(taskRepository.findByStatusNotOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(academicEventRepository.findAllFiltered(any(), any(), any())).thenReturn(List.of());
        when(academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(scheduleRepository.findAll()).thenReturn(List.of());
        when(studyPlannerEngine.process(any(), any(), any(), any(), any(), any()))
                .thenReturn(new StudyPlannerEngine.ExtractedData(List.of(), List.of(), List.of()));
        when(noteRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        service.processNotes(DATE);

        verify(imageAiProcessor).describeImage(image.getData(), image.getContentType());
        verify(imageRepository).saveAll(argThat(list -> {
            List<Image> images = (List<Image>) list;
            return images.size() == 1 && "Binary tree diagram".equals(images.get(0).getDescription());
        }));
    }
```

- [ ] **Step 2: Run test to verify it fails**

Run: `gradlew test --tests group.four.nyare.nyare.service.StudyPlannerServiceImplTest`
Expected: Compilation failure due to missing constructor arguments and implementation.

- [ ] **Step 3: Implement image discovery and metadata updates in `StudyPlannerServiceImpl.java`**

```java
package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.ai.ImageAiProcessor;
import group.four.nyare.nyare.ai.StudyPlannerEngine;
import group.four.nyare.nyare.dto.ProcessSummaryResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.model.AcademicContext;
import group.four.nyare.nyare.model.AcademicEvent;
import group.four.nyare.nyare.model.Course;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.model.Note;
import group.four.nyare.nyare.model.Schedule;
import group.four.nyare.nyare.model.Task;
import group.four.nyare.nyare.model.enums.TaskStatus;
import group.four.nyare.nyare.repository.AcademicContextRepository;
import group.four.nyare.nyare.repository.AcademicEventRepository;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.repository.NoteRepository;
import group.four.nyare.nyare.repository.ScheduleRepository;
import group.four.nyare.nyare.repository.TaskRepository;
import group.four.nyare.nyare.service.StudyPlannerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Implementation of {@link StudyPlannerService} for processing daily notes into academic entities.
 */
@Service
@Transactional(readOnly = true)
public class StudyPlannerServiceImpl implements StudyPlannerService {

    private static final Pattern IMAGE_URL_PATTERN =
            Pattern.compile("/api/images/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})");

    private final NoteRepository noteRepository;
    private final TaskRepository taskRepository;
    private final AcademicEventRepository academicEventRepository;
    private final AcademicContextRepository academicContextRepository;
    private final ScheduleRepository scheduleRepository;
    private final ImageRepository imageRepository;
    private final ImageAiProcessor imageAiProcessor;
    private final StudyPlannerEngine studyPlannerEngine;

    @Autowired
    public StudyPlannerServiceImpl(
            NoteRepository noteRepository,
            TaskRepository taskRepository,
            AcademicEventRepository academicEventRepository,
            AcademicContextRepository academicContextRepository,
            ScheduleRepository scheduleRepository,
            ImageRepository imageRepository,
            ImageAiProcessor imageAiProcessor,
            StudyPlannerEngine studyPlannerEngine) {
        this.noteRepository = noteRepository;
        this.taskRepository = taskRepository;
        this.academicEventRepository = academicEventRepository;
        this.academicContextRepository = academicContextRepository;
        this.scheduleRepository = scheduleRepository;
        this.imageRepository = imageRepository;
        this.imageAiProcessor = imageAiProcessor;
        this.studyPlannerEngine = studyPlannerEngine;
    }

    @Override
    @Transactional
    public ProcessSummaryResponse processNotes(LocalDate date) {
        List<Note> dirtyNotes = noteRepository.findDirtyNotes(date);

        if (dirtyNotes.isEmpty()) {
            throw new BadRequestException("No journal notes found for " + date + " to process");
        }

        // Contexts are scoped to dirty-note courses. All other data is global.
        Set<Long> dirtyCourseIds = dirtyNotes.stream()
                .filter(n -> n.getCourse() != null && n.getCourse().getId() != null)
                .map(n -> n.getCourse().getId())
                .collect(Collectors.toSet());

        // Discover and update note images
        Map<UUID, List<Image>> noteImages = processAndPersistNoteImages(dirtyNotes);

        List<Task> existingTasks = taskRepository.findByStatusNotOrderByCreatedAtDesc(TaskStatus.COMPLETED);
        List<AcademicEvent> existingEvents = academicEventRepository.findAllFiltered(null, true, LocalDateTime.now());
        List<AcademicContext> existingContexts =
                academicContextRepository.findByCourseIdInOrderByCreatedAtDesc(dirtyCourseIds);
        List<Schedule> schedules = scheduleRepository.findAll();

        StudyPlannerEngine.ExtractedData extracted = studyPlannerEngine.process(
                dirtyNotes, existingTasks, existingEvents, existingContexts, schedules, noteImages);

        Map<UUID, Note> noteMap = dirtyNotes.stream()
                .filter(n -> n.getId() != null)
                .collect(Collectors.toMap(Note::getId, n -> n, (a, b) -> a));

        Map<UUID, Task> taskMap = existingTasks.stream()
                .filter(t -> t.getId() != null)
                .collect(Collectors.toMap(Task::getId, t -> t, (a, b) -> a));

        List<Task> tasksToSave = new ArrayList<>();
        for (StudyPlannerEngine.ExtractedTask item : extracted.tasks()) {
            if (item.title() == null || item.title().isBlank()) {
                continue;
            }
            if (item.isPromotion()) {
                Task existing = item.taskId() != null ? taskMap.get(item.taskId()) : null;
                if (existing != null) {
                    existing.setScheduledDate(item.scheduledDate());
                    if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                        existing.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
                    }
                    tasksToSave.add(existing);
                }
            } else {
                Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
                Course course = note != null ? note.getCourse() : null;
                if (course == null) continue;
                Task task = new Task(course, item.title());
                task.setNote(note);
                task.setDescription(item.description());
                task.setScheduledDate(item.scheduledDate());
                if (item.estimatedMinutes() != null && item.estimatedMinutes() > 0) {
                    task.setDuration(Duration.ofMinutes(item.estimatedMinutes()));
                }
                tasksToSave.add(task);
            }
        }

        List<AcademicEvent> eventsToSave = new ArrayList<>();
        for (StudyPlannerEngine.ExtractedEvent item : extracted.events()) {
            if (item.title() == null || item.title().isBlank() || item.deadline() == null) {
                continue;
            }
            Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
            Course course = note != null ? note.getCourse() : null;
            if (course == null) continue;
            eventsToSave.add(new AcademicEvent(course, note, item.title(), item.description(), item.deadline()));
        }

        List<AcademicContext> contextsToSave = new ArrayList<>();
        for (StudyPlannerEngine.ExtractedContext item : extracted.contexts()) {
            if (item.value() == null || item.value().isBlank()) {
                continue;
            }
            Note note = item.noteId() != null ? noteMap.get(item.noteId()) : null;
            Course course = note != null ? note.getCourse() : null;
            if (course == null) continue;
            contextsToSave.add(new AcademicContext(course, note, item.value()));
        }

        long newTaskCount = tasksToSave.stream().filter(t -> t.getId() == null).count();

        taskRepository.saveAll(tasksToSave);
        academicEventRepository.saveAll(eventsToSave);
        academicContextRepository.saveAll(contextsToSave);

        Instant processedAt = Instant.now().plusSeconds(1);
        dirtyNotes.forEach(n -> n.setLastProcessedAt(processedAt));
        noteRepository.saveAll(dirtyNotes);

        return new ProcessSummaryResponse((int) newTaskCount, eventsToSave.size(), contextsToSave.size());
    }

    private Map<UUID, List<Image>> processAndPersistNoteImages(List<Note> dirtyNotes) {
        Map<UUID, Set<UUID>> noteToImageIds = new HashMap<>();
        Set<UUID> allImageIds = new HashSet<>();

        for (Note note : dirtyNotes) {
            if (note.getId() == null || note.getContent() == null) continue;
            Matcher matcher = IMAGE_URL_PATTERN.matcher(note.getContent());
            Set<UUID> imageIds = new LinkedHashSet<>();
            while (matcher.find()) {
                try {
                    UUID imageId = UUID.fromString(matcher.group(1));
                    imageIds.add(imageId);
                    allImageIds.add(imageId);
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (!imageIds.isEmpty()) {
                noteToImageIds.put(note.getId(), imageIds);
            }
        }

        if (allImageIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Image> existingImages = imageRepository.findAllById(allImageIds);
        Map<UUID, Image> imageMap = existingImages.stream()
                .filter(img -> img.getId() != null)
                .collect(Collectors.toMap(Image::getId, img -> img, (a, b) -> a));

        List<Image> imagesToUpdate = new ArrayList<>();
        for (Image image : existingImages) {
            if (image.getDescription() == null || image.getDescription().isBlank()) {
                String description = imageAiProcessor.describeImage(image.getData(), image.getContentType());
                if (description != null && !description.isBlank()) {
                    image.setDescription(description);
                    imagesToUpdate.add(image);
                }
            }
        }

        if (!imagesToUpdate.isEmpty()) {
            imageRepository.saveAll(imagesToUpdate);
        }

        Map<UUID, List<Image>> result = new HashMap<>();
        for (Map.Entry<UUID, Set<UUID>> entry : noteToImageIds.entrySet()) {
            List<Image> images = entry.getValue().stream()
                    .map(imageMap::get)
                    .filter(Objects::nonNull)
                    .toList();
            if (!images.isEmpty()) {
                result.put(entry.getKey(), images);
            }
        }
        return result;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `gradlew test --tests group.four.nyare.nyare.service.StudyPlannerServiceImplTest`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/java/group/four/nyare/nyare/service/impl/StudyPlannerServiceImpl.java src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java
git commit -m "feat(service): process and persist note image metadata in StudyPlannerService"
```

---

### Task 4: Integration Verification and Tier 3 Test Suite Run

**Files:**
- Test: `src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`

- [ ] **Step 1: Run focused tests for AI and planner domain**

Run: `gradlew test --tests "group.four.nyare.nyare.ai.*" --tests "group.four.nyare.nyare.service.StudyPlannerServiceImplTest"`
Expected: All tests PASS.

- [ ] **Step 2: Run full build verification (Tier 3)**

Run: `gradlew test`
Expected: All backend test suites pass with 0 failures.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "chore(ai): verify image processing wrapper and metadata update integration"
```
