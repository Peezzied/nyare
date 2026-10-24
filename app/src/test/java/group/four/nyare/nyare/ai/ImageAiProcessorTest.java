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
