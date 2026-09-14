package group.four.nyare.nyare.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class WebConfigTest {

    @Test
    @DisplayName("Should configure CORS mappings for /api/** with allowed origins and methods")
    void addCorsMappings_registersExpectedConfiguration() {
        WebConfig webConfig = new WebConfig();
        TestCorsRegistry registry = new TestCorsRegistry();

        webConfig.addCorsMappings(registry);

        Map<String, CorsConfiguration> corsConfigurations = registry.getCorsConfigurations();
        assertThat(corsConfigurations).containsKey("/api/**");

        CorsConfiguration config = corsConfigurations.get("/api/**");
        assertThat(config.getAllowedOrigins())
                .containsExactlyInAnyOrder("http://localhost:5173", "http://localhost:3000");
        assertThat(config.getAllowedMethods())
                .containsExactlyInAnyOrder("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS");
        assertThat(config.getAllowedHeaders()).containsExactly("*");
    }

    private static class TestCorsRegistry extends CorsRegistry {
        @Override
        public Map<String, CorsConfiguration> getCorsConfigurations() {
            return super.getCorsConfigurations();
        }
    }
}
