package group.four.nyare.nyare.ai;

import group.four.nyare.nyare.exception.BadRequestException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.MimeType;
import org.springframework.util.MimeTypeUtils;

import java.util.Map;
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

    private final ChatClient chatClient;
    private final long aiTimeoutMs;

    private static final String USER_PROMPT =
            "Describe the attached academic note image in at most 120 words. "
                    + "Transcribe only decision-relevant text and describe only diagrams that are present. "
                    + "Never describe the image medium and never state what is absent.";

    @Autowired
    public ImageAiProcessor(
            ChatClient.Builder chatClientBuilder,
            @Value("classpath:image_sys-prompt.st") Resource systemPromptResource,
            @Value("${nyare.image-processor.ai-timeout-ms:30000}") long aiTimeoutMs) {
        SystemPromptTemplate systemTemplate = new SystemPromptTemplate(systemPromptResource);
        String renderedSystemPrompt = systemTemplate.render(Map.of());

        this.chatClient = chatClientBuilder
                .defaultSystem(renderedSystemPrompt)
                .build();
        this.aiTimeoutMs = aiTimeoutMs;
    }

    ImageAiProcessor(ChatClient chatClient) {
        this(chatClient, 30000);
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
                    .user(u -> u.text(USER_PROMPT).media(mimeType, resource))
                    .call()
                    .content();
            return content != null ? content.trim() : "";
        }

        CompletableFuture<String> future = CompletableFuture.supplyAsync(() ->
                chatClient.prompt()
                        .user(u -> u.text(USER_PROMPT).media(mimeType, resource))
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
