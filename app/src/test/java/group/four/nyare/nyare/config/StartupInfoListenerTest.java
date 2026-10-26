package group.four.nyare.nyare.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.env.MockEnvironment;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class StartupInfoListenerTest {

    @Mock
    private ConfigurableApplicationContext applicationContext;

    @Mock
    private SpringApplication springApplication;

    @Test
    @DisplayName("onApplicationEvent handles application startup event without errors")
    void onApplicationEvent_validEvent_executesWithoutException() {
        // given
        StartupInfoListener listener = new StartupInfoListener();
        MockEnvironment environment = new MockEnvironment();
        environment.setProperty("server.ssl.enabled", "false");
        environment.setProperty("server.port", "8080");
        environment.setProperty("server.servlet.context-path", "/");
        environment.setProperty("spring.application.name", "nyare");
        environment.setActiveProfiles("dev");

        given(applicationContext.getEnvironment()).willReturn(environment);

        ApplicationReadyEvent event = new ApplicationReadyEvent(
                springApplication,
                new String[0],
                applicationContext,
                Duration.ZERO
        );

        // when / then
        assertThatCode(() -> listener.onApplicationEvent(event))
                .doesNotThrowAnyException();
    }
}
