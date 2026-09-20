package group.four.nyare.nyare.ai.prompt;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;

/**
 * Fluent builder for creating multi-message prompts structured with XML tags.
 */
public class TaggedPromptBuilder {

    private String systemInstruction;
    private final StringBuilder bodyBuilder = new StringBuilder();

    /**
     * Creates a new instance of TaggedPromptBuilder.
     */
    public TaggedPromptBuilder() {
    }

    /**
     * Factory method alias to start building a prompt.
     *
     * @return a new TaggedPromptBuilder instance
     */
    public static TaggedPromptBuilder builder() {
        return new TaggedPromptBuilder();
    }

    /**
     * Appends an XML-tagged content block using PromptTemplate.
     *
     * @param tagName the XML tag name
     * @param content the text content to enclose
     * @return this builder
     */
    public TaggedPromptBuilder tag(String tagName, String content) {
        if (tagName == null || tagName.isBlank()) {
            throw new IllegalArgumentException("tagName must not be null or blank");
        }
        String cleanTag = tagName.trim();
        PromptTemplate template = new PromptTemplate("<" + cleanTag + ">\n{content}\n</" + cleanTag + ">");
        String rendered = template.render(Map.of("content", content != null ? content : ""));

        if (!this.bodyBuilder.isEmpty()) {
            this.bodyBuilder.append("\n\n");
        }
        this.bodyBuilder.append(rendered);
        return this;
    }

    /**
     * Appends an XML-tagged content block only if the content is not null or blank.
     *
     * @param tagName the XML tag name
     * @param content the text content to enclose
     * @return this builder
     */
    public TaggedPromptBuilder tagIfPresent(String tagName, String content) {
        if (content != null && !content.isBlank()) {
            return tag(tagName, content);
        }
        return this;
    }

    /**
     * Appends plain text without XML tags.
     *
     * @param text the raw text
     * @return this builder
     */
    public TaggedPromptBuilder text(String text) {
        if (text != null && !text.isBlank()) {
            if (!this.bodyBuilder.isEmpty()) {
                this.bodyBuilder.append("\n\n");
            }
            this.bodyBuilder.append(text.trim());
        }
        return this;
    }

    /**
     * Builds a Spring AI Prompt with the configured message.
     *
     * @return a new Prompt object
     */
    public Prompt buildPrompt() {
        List<Message> messages = new ArrayList<>();
        if (this.systemInstruction != null && !this.systemInstruction.isBlank()) {
            messages.add(new SystemMessage(this.systemInstruction.trim()));
        }
        messages.add(new UserMessage(this.bodyBuilder.toString()));
        return new Prompt(messages);
    }
}
