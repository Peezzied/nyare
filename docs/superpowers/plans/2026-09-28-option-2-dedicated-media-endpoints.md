# Dedicated Image Endpoints & Decoupled Note Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decouple media upload from note content by introducing dedicated image endpoints (`/api/images`) and simplifying the `Note` entity to store plain markdown.

**Architecture:** A dedicated `ImageController` and `ImageService` will handle binary image uploads (`multipart/form-data`) and streaming downloads with HTTP caching headers. The `Note` entity and its DTOs will replace the complex `NoteContent` / `imageMetadata` map with a direct `String content` (markdown) field.

**Tech Stack:** Spring Boot 4.1.1, Spring Data JPA, SQLite, JUnit 5, MockMvc, AssertJ, Tiptap (Frontend).

**Spec:** [Conceptual Model & Domain Dictionary](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/docs/conceptual-model.md) and [REST API Guidelines](file:///D:/General%20Project%20Bins/Academics/CCS201/nyare/backend/docs/conventions/controllers-and-rest.md).

---

## Global Constraints

- Use Java 25 and Spring Boot 4.1.1 idioms.
- Follow ASD-STE100 rules: active voice, simple tenses, max 20 words per instruction, no semicolons.
- Use canonical exceptions only (`ResourceNotFoundException` for 404, `BadRequestException` for 400).
- Keep service methods `@Transactional(readOnly = true)` at class level and explicit `@Transactional` on mutations.
- Persist media data in SQLite database with appropriate column types (`@Lob byte[] data`).
- Enforce strict 3-tier validation (IntelliJ MCP diagnostics -> targeted test -> full build).

---

## Component Breakdown

```
[ Frontend: Tiptap Editor ]
      │
      ├── (1) Drop/Paste Image ──► POST /api/images (multipart) ──► ImageController / ImageService ──► SQLite (images table)
      │                                       │
      │   ◄── Returns { id, url } ────────────┘
      │
      └── (2) Save Note ────────► POST /api/notes (JSON)       ──► NoteController / NoteService   ──► SQLite (notes table)
                                    { courseId, content: "# Markdown\n![alt](/api/images/{id})" }
```

---

## File Structure

### Backend Additions
- `group.four.nyare.nyare.model.Image`: JPA entity storing image bytes, MIME type, size, and timestamp.
- `group.four.nyare.nyare.repository.ImageRepository`: Spring Data repository for `Image`.
- `group.four.nyare.nyare.dto.ImageUploadResponse`: DTO returned after image upload.
- `group.four.nyare.nyare.service.ImageService`: Interface for uploading and fetching images.
- `group.four.nyare.nyare.service.impl.ImageServiceImpl`: Service implementation.
- `group.four.nyare.nyare.controller.ImageController`: REST controller for `POST /api/images` and `GET /api/images/{id}`.

### Backend Deletions
- `group.four.nyare.nyare.model.NoteContent`
- `group.four.nyare.nyare.model.ImageMetadata`
- `group.four.nyare.nyare.dto.ImageMetadataUpdateRequest`
- `group.four.nyare.nyare.model.converter.NoteContentConverter`
- `group.four.nyare.nyare.model.validation.ValidImageReferences`
- `group.four.nyare.nyare.model.validation.ImageReferencesValidator`

### Backend Modifications
- `group.four.nyare.nyare.model.Note`: Stores `String content` directly as `TEXT`.
- `group.four.nyare.nyare.dto.NoteRequest`: Accepts `String content` (or markdown).
- `group.four.nyare.nyare.dto.NoteResponse`: Returns `String content`.
- `group.four.nyare.nyare.service.impl.NoteServiceImpl`: Maps note entity to and from plain string.
- `group.four.nyare.nyare.ai.StudyPlannerEngine`: Reads `note.getContent()` directly.
- Test suites: Update note-related tests and add image service/controller tests.

---

## Tasks

### Task 1: Image Entity and Repository

**Files:**
- Create: `backend/src/main/java/group/four/nyare/nyare/model/Image.java`
- Create: `backend/src/main/java/group/four/nyare/nyare/repository/ImageRepository.java`
- Test: `backend/src/test/java/group/four/nyare/nyare/repository/ImageRepositoryTest.java`

**Interfaces:**
- Produces: `Image` entity with `UUID id`, `byte[] data`, `String contentType`, `String filename`, `long size`, `Instant createdAt`.
- Produces: `ImageRepository` extending `JpaRepository<Image, UUID>`.

- [ ] **Step 1: Write failing repository test**

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Image;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ImageRepositoryTest {

    @Autowired
    private ImageRepository imageRepository;

    @Test
    @DisplayName("Save and retrieve image binary")
    void saveAndFindImage() {
        byte[] data = new byte[]{1, 2, 3, 4};
        Image image = new Image(data, "image/png", "test.png", 4L);
        Image saved = imageRepository.save(image);

        Optional<Image> found = imageRepository.findById(saved.getId());
        assertThat(found).isPresent();
        assertThat(found.get().getContentType()).isEqualTo("image/png");
        assertThat(found.get().getData()).isEqualTo(data);
    }
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `./gradlew test --tests group.four.nyare.nyare.repository.ImageRepositoryTest`
Expected: Compilation failure (classes do not exist).

- [ ] **Step 3: Implement Image entity and repository**

```java
package group.four.nyare.nyare.model;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "images")
@EntityListeners(AuditingEntityListener.class)
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false, updatable = false)
    private UUID id;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false)
    private byte[] data;

    @NotBlank
    @Column(nullable = false)
    private String contentType;

    @Column
    private String filename;

    @Column(nullable = false)
    private long size;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Image() {
    }

    public Image(byte[] data, String contentType, String filename, long size) {
        this.data = data;
        this.contentType = contentType;
        this.filename = filename;
        this.size = size;
    }

    public UUID getId() {
        return id;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public long getSize() {
        return size;
    }

    public void setSize(long size) {
        this.size = size;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
```

```java
package group.four.nyare.nyare.repository;

import group.four.nyare.nyare.model.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ImageRepository extends JpaRepository<Image, UUID> {
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests group.four.nyare.nyare.repository.ImageRepositoryTest`
Expected: PASS.

---

### Task 2: Image Service, DTO, and REST Controller

**Files:**
- Create: `backend/src/main/java/group/four/nyare/nyare/dto/ImageUploadResponse.java`
- Create: `backend/src/main/java/group/four/nyare/nyare/service/ImageService.java`
- Create: `backend/src/main/java/group/four/nyare/nyare/service/impl/ImageServiceImpl.java`
- Create: `backend/src/main/java/group/four/nyare/nyare/controller/ImageController.java`
- Test: `backend/src/test/java/group/four/nyare/nyare/controller/ImageControllerTest.java`

**Interfaces:**
- Consumes: `ImageRepository`, `MultipartFile`.
- Produces: `POST /api/images` endpoint returning `201 Created` with `ImageUploadResponse`.
- Produces: `GET /api/images/{id}` endpoint streaming image bytes with `Cache-Control`.

- [ ] **Step 1: Write failing controller test**

```java
package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.service.ImageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ImageController.class)
class ImageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ImageService imageService;

    @MockitoBean
    private JpaMetamodelMappingContext jpaMappingContext;

    @Test
    void uploadImage_returns201() throws Exception {
        UUID id = UUID.randomUUID();
        ImageUploadResponse response = new ImageUploadResponse(id, "/api/images/" + id, "image/png", 100L, Instant.now());
        when(imageService.uploadImage(any())).thenReturn(response);

        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{1, 2, 3});

        mockMvc.perform(multipart("/api/images").file(file))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/images/" + id))
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void getImage_returns200AndCacheHeader() throws Exception {
        UUID id = UUID.randomUUID();
        Image image = new Image(new byte[]{1, 2, 3}, "image/png", "test.png", 3L);
        when(imageService.getImage(id)).thenReturn(image);

        mockMvc.perform(get("/api/images/{id}", id))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().exists("Cache-Control"));
    }
}
```

- [ ] **Step 2: Run test to verify failure**

Run: `./gradlew test --tests group.four.nyare.nyare.controller.ImageControllerTest`
Expected: Fail to compile.

- [ ] **Step 3: Implement ImageUploadResponse, ImageService, ImageServiceImpl, and ImageController**

```java
package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.util.UUID;

public class ImageUploadResponse {
    private UUID id;
    private String url;
    private String contentType;
    private long size;
    private Instant createdAt;

    public ImageUploadResponse() {
    }

    public ImageUploadResponse(UUID id, String url, String contentType, long size, Instant createdAt) {
        this.id = id;
        this.url = url;
        this.contentType = contentType;
        this.size = size;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
```

```java
package group.four.nyare.nyare.service;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.model.Image;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface ImageService {
    ImageUploadResponse uploadImage(MultipartFile file);
    Image getImage(UUID id);
    void deleteImage(UUID id);
}
```

```java
package group.four.nyare.nyare.service.impl;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.exception.BadRequestException;
import group.four.nyare.nyare.exception.ResourceNotFoundException;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.repository.ImageRepository;
import group.four.nyare.nyare.service.ImageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ImageServiceImpl implements ImageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private final ImageRepository imageRepository;

    public ImageServiceImpl(ImageRepository imageRepository) {
        this.imageRepository = imageRepository;
    }

    @Override
    @Transactional
    public ImageUploadResponse uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Unsupported image format: " + contentType);
        }

        try {
            byte[] bytes = file.getBytes();
            Image image = new Image(bytes, contentType, file.getOriginalFilename(), file.getSize());
            Image saved = imageRepository.save(image);
            String url = "/api/images/" + saved.getId();
            return new ImageUploadResponse(saved.getId(), url, saved.getContentType(), saved.getSize(), saved.getCreatedAt());
        } catch (IOException e) {
            throw new BadRequestException("Failed to read image data: " + e.getMessage());
        }
    }

    @Override
    public Image getImage(UUID id) {
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + id));
    }

    @Override
    @Transactional
    public void deleteImage(UUID id) {
        Image image = imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + id));
        imageRepository.delete(image);
    }
}
```

```java
package group.four.nyare.nyare.controller;

import group.four.nyare.nyare.dto.ImageUploadResponse;
import group.four.nyare.nyare.model.Image;
import group.four.nyare.nyare.service.ImageService;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final ImageService imageService;

    public ImageController(ImageService imageService) {
        this.imageService = imageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        ImageUploadResponse response = imageService.uploadImage(file);
        URI location = URI.create(response.getUrl());
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> getImage(@PathVariable UUID id) {
        Image image = imageService.getImage(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + image.getFilename() + "\"")
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(image.getData());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable UUID id) {
        imageService.deleteImage(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `./gradlew test --tests group.four.nyare.nyare.controller.ImageControllerTest`
Expected: PASS.

---

### Task 3: Refactor Note Entity and DTOs

**Files:**
- Modify: `backend/src/main/java/group/four/nyare/nyare/model/Note.java`
- Modify: `backend/src/main/java/group/four/nyare/nyare/dto/NoteRequest.java`
- Modify: `backend/src/main/java/group/four/nyare/nyare/dto/NoteResponse.java`
- Modify: `backend/src/main/java/group/four/nyare/nyare/service/impl/NoteServiceImpl.java`
- Delete: `backend/src/main/java/group/four/nyare/nyare/model/NoteContent.java`
- Delete: `backend/src/main/java/group/four/nyare/nyare/model/ImageMetadata.java`
- Delete: `backend/src/main/java/group/four/nyare/nyare/dto/ImageMetadataUpdateRequest.java`
- Delete: `backend/src/main/java/group/four/nyare/nyare/model/converter/NoteContentConverter.java`
- Delete: `backend/src/main/java/group/four/nyare/nyare/model/validation/ValidImageReferences.java`
- Delete: `backend/src/main/java/group/four/nyare/nyare/model/validation/ImageReferencesValidator.java`

- [ ] **Step 1: Simplify Note entity and DTOs**

Update `Note.java`:
Replace `NoteContent content` with `@NotBlank @Column(nullable = false, columnDefinition = "TEXT") private String content;`.

Update `NoteRequest.java`:
```java
package group.four.nyare.nyare.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class NoteRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Note content cannot be blank")
    private String content;

    public NoteRequest() {
    }

    public NoteRequest(Long courseId, String content) {
        this.courseId = courseId;
        this.content = content;
    }

    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
```

Update `NoteResponse.java`:
```java
package group.four.nyare.nyare.dto;

import java.time.Instant;
import java.util.UUID;

public class NoteResponse {
    private UUID id;
    private Long courseId;
    private String content;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastProcessedAt;

    public NoteResponse() {
    }

    public NoteResponse(UUID id, Long courseId, String content, Instant createdAt, Instant updatedAt) {
        this(id, courseId, content, createdAt, updatedAt, null);
    }

    public NoteResponse(UUID id, Long courseId, String content, Instant createdAt, Instant updatedAt, Instant lastProcessedAt) {
        this.id = id;
        this.courseId = courseId;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastProcessedAt = lastProcessedAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getLastProcessedAt() { return lastProcessedAt; }
    public void setLastProcessedAt(Instant lastProcessedAt) { this.lastProcessedAt = lastProcessedAt; }
}
```

- [ ] **Step 2: Delete deprecated classes**
Delete `NoteContent.java`, `ImageMetadata.java`, `ImageMetadataUpdateRequest.java`, `NoteContentConverter.java`, `ValidImageReferences.java`, and `ImageReferencesValidator.java`.

- [ ] **Step 3: Update StudyPlannerEngine.java**
Change `note.getContent().getMarkdown()` to `note.getContent()`.

---

### Task 4: Update All Existing Backend Tests

**Files:**
- Modify: `backend/src/test/java/group/four/nyare/nyare/controller/NoteControllerTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/model/NoteTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/repository/NoteRepositoryTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/service/NoteServiceImplTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/ai/StudyPlannerEngineIntegrationTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/controller/StudyPlannerControllerIntegrationTest.java`
- Modify: `backend/src/test/java/group/four/nyare/nyare/service/StudyPlannerServiceImplTest.java`

- [ ] **Step 1: Replace all `new NoteContent("text", null)` invocations with `"text"`**
- [ ] **Step 2: Run all backend tests**

Run: `./gradlew test`
Expected: All tests pass.

---

## Verification Plan

### Automated Tests
```powershell
# 1. Test image upload and retrieval
./gradlew test --tests group.four.nyare.nyare.controller.ImageControllerTest

# 2. Test note CRUD with plain markdown
./gradlew test --tests group.four.nyare.nyare.controller.NoteControllerTest

# 3. Test full test suite
./gradlew test
```

### Manual Verification
1. Start the backend: `./gradlew bootRun`
2. Upload an image via `curl -F "file=@sample.png" http://localhost:8080/api/images`. Verify 201 response with location header and image ID.
3. Access `http://localhost:8080/api/images/{id}` in browser. Verify image renders with `Cache-Control` header.
4. Save a note referencing the image:
   ```json
   POST /api/notes
   { "courseId": 1, "content": "Sample lecture notes\n![Diagram](/api/images/UUID)" }
   ```
5. Trigger study planner extraction `POST /api/study-planner/process`.
