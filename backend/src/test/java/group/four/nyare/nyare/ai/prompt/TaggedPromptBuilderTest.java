package group.four.nyare.nyare.ai.prompt;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.prompt.Prompt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaggedPromptBuilderTest {

    @Test
    @DisplayName("TaggedPromptBuilder builds single and multiple XML tagged blocks")
    void taggedPromptBuilder_multipleTags_assemblesFormattedText() {
        // given
        TaggedPromptBuilder builder = TaggedPromptBuilder.create()
                .tag("context", "Course notes for CCS201")
                .tag("rules", "Plan only for today")
                .text("Summarize the main points.");

        // when
        String resultText = builder.buildText();

        // then
        assertThat(resultText)
                .contains("<context>")
                .contains("Course notes for CCS201")
                .contains("</context>")
                .contains("<rules>")
                .contains("Plan only for today")
                .contains("</rules>")
                .contains("Summarize the main points.");
    }

    @Test
    @DisplayName("TaggedPromptBuilder tagIfPresent skips empty or null blocks")
    void taggedPromptBuilder_tagIfPresent_skipsBlankContent() {
        // given
        TaggedPromptBuilder builder = TaggedPromptBuilder.builder()
                .tag("context", "Valid notes")
                .tagIfPresent("emptyTag", "")
                .tagIfPresent("nullTag", null)
                .tagIfPresent("blankTag", "   ")
                .tagIfPresent("validTag", "Active items");

        // when
        String resultText = builder.buildText();

        // then
        assertThat(resultText)
                .contains("<context>")
                .contains("Valid notes")
                .contains("</context>")
                .contains("<validTag>")
                .contains("Active items")
                .contains("</validTag>")
                .doesNotContain("emptyTag")
                .doesNotContain("nullTag")
                .doesNotContain("blankTag");
    }

    @Test
    @DisplayName("TaggedPromptBuilder buildPrompt creates SystemMessage and UserMessage")
    void taggedPromptBuilder_buildPrompt_createsSystemAndUserMessages() {
        // given
        TaggedPromptBuilder builder = TaggedPromptBuilder.create()
                .system("You are an academic planner.")
                .tag("schedule", "Monday 09:00 AM")
                .text("Generate tasks.");

        // when
        Prompt prompt = builder.buildPrompt();

        // then
        assertThat(prompt.getInstructions()).hasSize(2);
        assertThat(prompt.getInstructions().get(0).getMessageType()).isEqualTo(MessageType.SYSTEM);
        assertThat(prompt.getInstructions().get(0).getText()).isEqualTo("You are an academic planner.");

        assertThat(prompt.getInstructions().get(1).getMessageType()).isEqualTo(MessageType.USER);
        assertThat(prompt.getInstructions().get(1).getText())
                .contains("<schedule>")
                .contains("Monday 09:00 AM")
                .contains("</schedule>")
                .contains("Generate tasks.");
    }

    @Test
    @DisplayName("TaggedPromptBuilder tag throws exception on blank tag name")
    void taggedPromptBuilder_blankTagName_throwsException() {
        TaggedPromptBuilder builder = new TaggedPromptBuilder();
        assertThatThrownBy(() -> builder.tag("   ", "content"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
