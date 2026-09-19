---
name: spring-ai-google-genai
description: Use when integrating Google GenAI (Gemini) models, configuring Spring AI chat clients, implementing function calling tools, processing multimodal inputs, or configuring Gemini context caching in Spring Boot applications.
---

# Spring AI Google GenAI (Gemini)

## Overview

This skill guides development with the Spring AI Google GenAI module. It provides patterns to integrate Google Gemini models into Spring Boot applications.

**REQUIRED SUB-SKILL:** Use `dr-jskill` for base Spring Boot configuration, Java 25 setup, and project architecture.

---

## When to Use

- Configure `GoogleGenAiChatModel` or `ChatClient` for Gemini models.
- Send multimodal prompts containing text, images, or audio.
- Execute tool calls with Spring AI `@Tool` annotations.
- Extract structured records from model responses.
- Manage Gemini cached content with `GoogleGenAiCachedContentService`.
- Configure model safety settings, thinking levels, or search retrieval.

### When NOT to Use

- Use standard REST controllers without AI integration (use `dr-jskill`).
- Modify JPA domain entities without AI logic (use `model-craft`).
- Integrate OpenAI or Anthropic models directly.

---

## Dependency Configuration

Configure the Spring AI Bill of Materials (BOM) and Google GenAI starter in your build file.

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

Store your API key in environment variables. Define model parameters in `application.properties`.

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

## Core Architectural Components

### 1. `GoogleGenAiChatModel`

`GoogleGenAiChatModel` implements the Spring AI `ChatModel` and `StreamingChatModel` interfaces. Spring Boot auto-configures a bean for this class.

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

### 2. High-Level `ChatClient` Usage

`ChatClient` provides a fluent API for prompt construction, system instructions, and entity extraction.

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

Extract structured Java records directly from Gemini responses.

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

Pass media attachments such as images or documents to Gemini models.

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

Register Java methods as tools for Gemini model execution.

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

Configure request-specific options including safety settings, thinking levels, and search retrieval.

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

### 7. Context Caching Management

Use `GoogleGenAiCachedContentService` to cache large static contexts across multiple calls.

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

## Common Mistakes & Resolutions

| Mistake | Cause | Resolution |
| :--- | :--- | :--- |
| Hardcoded API keys in repository files | Secret exposure risk | Externalize key to `GEMINI_API_KEY` environment variable. |
| Missing BOM import | Version conflicts across Spring AI modules | Import `spring-ai-bom` in `<dependencyManagement>`. |
| Modifying domain entities inside AI services | Entity layer violation | Keep AI inputs and outputs as DTOs or Java records. |
| Incompatible media MIME types | Unsupported multimodal format | Validate image and audio MIME types with `MimeTypeDetector`. |
| Unhandled API rate limits | Rapid sequential requests | Configure retry templates and backoff periods. |

---

## Quick Reference

| Class / Component | Package | Primary Responsibility |
| :--- | :--- | :--- |
| `GoogleGenAiChatModel` | `org.springframework.ai.google.genai` | Executes chat interactions with Gemini models. |
| `GoogleGenAiChatOptions` | `org.springframework.ai.google.genai` | Configures model runtime options and parameters. |
| `GoogleGenAiSafetySetting` | `org.springframework.ai.google.genai.common` | Defines content moderation thresholds and categories. |
| `GoogleGenAiCachedContentService` | `org.springframework.ai.google.genai.cache` | Creates and manages reusable cached content tokens. |
| `GoogleGenAiUsage` | `org.springframework.ai.google.genai.metadata` | Reports token usage including thinking and cache tokens. |
| `GoogleGenAiToolCallingManager` | `org.springframework.ai.google.genai.schema` | Manages tool execution and schema conversions. |

---

## External References

Consult these official links for additional API details and reference documentation:

- [Spring AI Google GenAI Javadoc](https://javadoc.io/doc/org.springframework.ai/spring-ai-google-genai/latest/index.html)
- [Spring AI Getting Started Guide](https://docs.spring.io/spring-ai/reference/getting-started.html)
- [Spring AI Google GenAI Chat Reference](https://docs.spring.io/spring-ai/reference/api/chat/google-genai-chat.html)

