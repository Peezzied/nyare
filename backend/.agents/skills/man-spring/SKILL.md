---
name: man-spring
description: Integrate Google GenAI (Gemini) models, configure Spring AI chat clients, implement tool calling, process multimodal inputs, manage context caching in Spring Boot.
---

# man-spring: Spring AI Google GenAI (Gemini)

## Overview

Skill guide development with Spring AI Google GenAI module. Integrate Google Gemini models into Spring Boot.

> [!IMPORTANT]
> Query `spring-docs` MCP server first for Spring AI docs and reference.
> Use `search_spring_docs`, `get_spring_reference`, `search_spring_concepts` before web search.

**Sub-skill:** Use `dr-jskill` for base Spring Boot setup, Java 25 config, project architecture.

---

## When to Use

- Configure `GoogleGenAiChatModel` or `ChatClient` for Gemini models.
- Send multimodal prompts with text, images, audio.
- Execute tool calls with Spring AI `@Tool`.
- Extract structured records from model output.
- Manage Gemini cache with `GoogleGenAiCachedContentService`.
- Set safety rules, thinking levels, search retrieval.

### When NOT to Use

- Standard REST endpoints without AI (use `dr-jskill`).
- JPA domain entity edits without AI logic (use `model-craft`).
- Direct OpenAI or Anthropic integrations.

---

## Dependencies

Add Spring AI BOM and Google GenAI starter to build file.

### Maven (`pom.xml`)

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.ai</groupId>
            <artifactId>spring-ai-bom</artifactId>
            <version>2.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>org.springframework.ai</groupId>
        <artifactId>spring-ai-starter-model-google-genai</artifactId>
    </dependency>
</dependencies>
```

### Gradle (`build.gradle`)

```groovy
dependencyManagement {
    imports {
        mavenBom "org.springframework.ai:spring-ai-bom:2.0.0"
    }
}

dependencies {
    implementation 'org.springframework.ai:spring-ai-starter-model-google-genai'
}
```

---

## Application Properties

Store API key in environment variable. Set model config in `application.properties`.

```properties
# Google GenAI Authentication
spring.ai.google.genai.api-key=${GEMINI_API_KEY}

# Default Chat Options
spring.ai.google.genai.chat.options.model=gemini-2.5-flash
spring.ai.google.genai.chat.options.temperature=0.7
spring.ai.google.genai.chat.options.max-output-tokens=2048
spring.ai.google.genai.chat.options.top-p=0.95
spring.ai.google.genai.chat.options.top-k=40
```

---

## Core Components

### 1. `GoogleGenAiChatModel`

`GoogleGenAiChatModel` implement Spring AI `ChatModel` and `StreamingChatModel`. Spring Boot auto-configure bean.

```java
package group.four.nyare.nyare.service;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;

@Service
public class GeminiAssistantService {

    private final ChatModel chatModel;

    public GeminiAssistantService(ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String generateText(String userMessage) {
        ChatResponse response = this.chatModel.call(new Prompt(userMessage));
        return response.getResult().getOutput().getText();
    }
}
```

---

### 2. High-Level `ChatClient`

`ChatClient` provide fluent API for prompts, system instructions, entity extraction.

```java
package group.four.nyare.nyare.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class StudyPlannerAiService {

    private final ChatClient chatClient;

    public StudyPlannerAiService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder
                .defaultSystem("You are an academic planning assistant.")
                .build();
    }

    public String adviseStudent(String userPrompt) {
        return this.chatClient.prompt()
                .user(userPrompt)
                .call()
                .content();
    }
}
```

---

### 3. Structured Output Extraction

Extract Java records direct from Gemini responses.

```java
package group.four.nyare.nyare.service;

import java.time.LocalDate;
import java.util.List;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class TaskExtractorService {

    public record ExtractedTask(String title, String courseCode, Integer estimatedMinutes, LocalDate targetDate) {}
    public record ExtractionResult(List<ExtractedTask> tasks, String summary) {}

    private final ChatClient chatClient;

    public TaskExtractorService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public ExtractionResult extractTasks(String journalNote) {
        return this.chatClient.prompt()
                .system("Extract academic tasks from student journal entries.")
                .user(journalNote)
                .call()
                .entity(ExtractionResult.class);
    }
}
```

---

### 4. Multimodal Inputs

Pass media attachments (images, audio, documents) to Gemini models.

```java
package group.four.nyare.nyare.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;

@Service
public class SyllabusAnalysisService {

    private final ChatClient chatClient;

    public SyllabusAnalysisService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public String analyzeSyllabus(String question, Resource imageResource) {
        return this.chatClient.prompt()
                .user(userSpec -> userSpec
                        .text(question)
                        .media(MimeTypeUtils.IMAGE_PNG, imageResource))
                .call()
                .content();
    }
}
```

---

### 5. Function Calling with `@Tool`

Register Java methods as tools for model execution.

```java
package group.four.nyare.nyare.tool;

import java.time.LocalDate;
import java.util.List;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;

@Component
public class AcademicScheduleTools {

    public record ClassMeeting(String courseCode, String room, String startTime) {}

    @Tool(description = "Retrieve scheduled class meetings for a specific date")
    public List<ClassMeeting> getMeetingsForDate(LocalDate date) {
        return List.of(new ClassMeeting("CCS201", "Lab 3", "09:00 AM"));
    }
}
```

Enable tools during chat prompt invocation:

```java
public String planDayWithTools(String request) {
    return this.chatClient.prompt()
            .user(request)
            .tools(new AcademicScheduleTools())
            .call()
            .content();
}
```

---

### 6. Dynamic `GoogleGenAiChatOptions`

Set per-request options: safety filters, thinking level, search grounding.

```java
package group.four.nyare.nyare.service;

import java.util.List;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.ai.google.genai.common.GoogleGenAiSafetySetting;
import org.springframework.ai.google.genai.common.GoogleGenAiThinkingLevel;
import org.springframework.stereotype.Service;

@Service
public class AdvancedGenAiService {

    private final GoogleGenAiChatModel chatModel;

    public AdvancedGenAiService(GoogleGenAiChatModel chatModel) {
        this.chatModel = chatModel;
    }

    public String executeAdvancedQuery(String userQuery) {
        GoogleGenAiSafetySetting safety = GoogleGenAiSafetySetting.builder()
                .category(GoogleGenAiSafetySetting.HarmCategory.HARM_CATEGORY_HATE_SPEECH)
                .threshold(GoogleGenAiSafetySetting.HarmBlockThreshold.BLOCK_LOW_AND_ABOVE)
                .build();

        GoogleGenAiChatOptions options = GoogleGenAiChatOptions.builder()
                .model("gemini-2.5-pro")
                .temperature(0.2)
                .thinkingBudget(1024)
                .thinkingLevel(GoogleGenAiThinkingLevel.HIGH)
                .includeThoughts(true)
                .googleSearchRetrieval(true)
                .safetySettings(List.of(safety))
                .build();

        return this.chatModel.call(new Prompt(userQuery, options))
                .getResult()
                .getOutput()
                .getText();
    }
}
```

---

### 7. Context Caching

Use `GoogleGenAiCachedContentService` to cache large static tokens across calls.

```java
package group.four.nyare.nyare.service;

import java.time.Duration;
import org.springframework.ai.google.genai.cache.CachedContentRequest;
import org.springframework.ai.google.genai.cache.GoogleGenAiCachedContent;
import org.springframework.ai.google.genai.cache.GoogleGenAiCachedContentService;
import org.springframework.stereotype.Service;

@Service
public class CourseMaterialCacheService {

    private final GoogleGenAiCachedContentService cacheService;

    public CourseMaterialCacheService(GoogleGenAiCachedContentService cacheService) {
        this.cacheService = cacheService;
    }

    public GoogleGenAiCachedContent createCourseCache(String courseName, String largeSyllabusText) {
        CachedContentRequest request = CachedContentRequest.builder()
                .model("gemini-2.5-flash")
                .displayName(courseName + "-syllabus")
                .contents(largeSyllabusText)
                .ttl(Duration.ofHours(2))
                .build();

        return this.cacheService.create(request);
    }
}
```

---

## Common Pitfalls

| Mistake | Cause | Fix |
| :--- | :--- | :--- |
| Hardcoded API key in code | Secret leak risk | Store key in `GEMINI_API_KEY` env var. |
| Missing BOM import | Version conflict across modules | Import `spring-ai-bom` in `<dependencyManagement>`. |
| Mutate domain entity in AI service | Architecture layer violation | Use DTO or Java record for AI input/output. |
| Invalid media MIME type | Unsupported format | Check MIME type with `MimeTypeDetector`. |
| Unhandled API rate limit | Fast sequential calls | Add retry template with exponential backoff. |

---

## Quick Reference

| Class / Component | Package | Role |
| :--- | :--- | :--- |
| `GoogleGenAiChatModel` | `org.springframework.ai.google.genai` | Run chat calls with Gemini models. |
| `GoogleGenAiChatOptions` | `org.springframework.ai.google.genai` | Configure runtime model options. |
| `GoogleGenAiSafetySetting` | `org.springframework.ai.google.genai.common` | Set safety filter threshold and category. |
| `GoogleGenAiCachedContentService` | `org.springframework.ai.google.genai.cache` | Manage reusable cached context tokens. |
| `GoogleGenAiUsage` | `org.springframework.ai.google.genai.metadata` | Token usage report (standard, thinking, cache). |
| `GoogleGenAiToolCallingManager` | `org.springframework.ai.google.genai.schema` | Tool execution and schema map. |

---

## Documentation & References

Query `spring-docs` MCP server first for official Spring AI docs, guides, best practices.

MCP tools:
- `search_spring_docs`: Search Spring AI docs by keyword.
- `get_spring_reference`: Fetch specific Spring AI reference page.
- `search_spring_concepts`: Search Spring AI architecture concepts.
- `get_spring_best_practices`: Fetch recommended patterns for Spring AI.

External links:
- [Spring AI Google GenAI Javadoc](https://javadoc.io/doc/org.springframework.ai/spring-ai-google-genai/latest/index.html)
- [Spring AI Getting Started Guide](https://docs.spring.io/spring-ai/reference/getting-started.html)
- [Spring AI Google GenAI Chat Reference](https://docs.spring.io/spring-ai/reference/api/chat/google-genai-chat.html)
