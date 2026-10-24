package group.four.nyare.nyare.ai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SpringAiIntegrationTest {

    @Autowired(required = false)
    private ChatModel chatModel;

    @Test
    @DisplayName("Verify that ChatModel bean loads in Spring application context")
    void verifyChatModelBeanLoads() {
        assertThat(chatModel).isNotNull();
    }

    @Test
    @DisplayName("Execute live prompt when GOOGLE_API_KEY environment variable is present")
    void executeLiveChatPrompt() {
        assertThat(chatModel).isNotNull();
        String prompt = "Respond with 'pong' only.";
        String response = chatModel.call(prompt);

        assertThat(response).isNotBlank();
        assertThat(response.toLowerCase()).contains("pong");
    }
}
