package group.four.nyare.nyare.launcher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LauncherConfigTest {

    @TempDir
    Path tempDir;

    private Path configFile() {
        return tempDir.resolve(LauncherConfig.FILE_NAME);
    }

    @Test
    void load_missingFile_generatesFileWithDefaults() {
        // given
        Path file = configFile();

        // when
        LauncherConfig config = LauncherConfig.load(file);

        // then
        assertThat(file).exists();
        assertThat(config.getAiProvider()).isEqualTo("google");
        assertThat(config.getGoogleApiKey()).isEmpty();
        assertThat(config.getGroqApiKey()).isEmpty();
        assertThat(config.getServerPort()).isEqualTo(8080);
        assertThat(config.isBrowserAutoOpen()).isTrue();
        assertThat(config.isObservability()).isFalse();
    }

    @Test
    void load_blankKeysWithDotenvNextToFile_populatesFromDotenv() throws Exception {
        // given
        Path file = configFile();
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, "GOOGLE_API_KEY=test-dotenv-google\nGROQ_API_KEY=\"test-dotenv-groq\"\n");

        // when
        LauncherConfig config = LauncherConfig.load(file);

        // then
        assertThat(config.getGoogleApiKey()).isEqualTo("test-dotenv-google");
        assertThat(config.getGroqApiKey()).isEqualTo("test-dotenv-groq");
    }

    @Test
    void load_savedFile_roundTripsAllValues() throws Exception {
        // given
        Path file = configFile();
        LauncherConfig original = LauncherConfig.load(file);
        original.setAiProvider("groq");
        original.setGoogleApiKey("google-key-1");
        original.setGroqApiKey("groq-key-2");
        original.setServerPort(9090);
        original.setBrowserAutoOpen(false);
        original.setObservability(true);
        original.save();

        // when
        LauncherConfig reloaded = LauncherConfig.load(file);

        // then
        assertThat(reloaded.getAiProvider()).isEqualTo("groq");
        assertThat(reloaded.getGoogleApiKey()).isEqualTo("google-key-1");
        assertThat(reloaded.getGroqApiKey()).isEqualTo("groq-key-2");
        assertThat(reloaded.getServerPort()).isEqualTo(9090);
        assertThat(reloaded.isBrowserAutoOpen()).isFalse();
        assertThat(reloaded.isObservability()).isTrue();
    }

    @Test
    void load_corruptedFile_fallsBackToDefaultsAndRegenerates() throws Exception {
        // given
        Path file = configFile();
        Files.writeString(file, "ai.provider=\\uZZZZinvalid-escape");

        // when
        LauncherConfig config = LauncherConfig.load(file);

        // then
        assertThat(config.getAiProvider()).isEqualTo("google");
        assertThat(config.getServerPort()).isEqualTo(8080);
        assertThat(LauncherConfig.load(file).getServerPort()).isEqualTo(8080);
    }

    @Test
    void load_partialFile_regeneratesMissingKeysKeepingValues() throws Exception {
        // given
        Path file = configFile();
        Files.writeString(file, "server.port=9090\ngroq.api.key=partial-key");

        // when
        LauncherConfig config = LauncherConfig.load(file);

        // then
        assertThat(config.getServerPort()).isEqualTo(9090);
        assertThat(config.getGroqApiKey()).isEqualTo("partial-key");
        String written = Files.readString(file);
        assertThat(written).contains("ai.provider=google");
        assertThat(written).contains("google.api.key=");
        assertThat(written).contains("server.port=9090");
        assertThat(written).contains("browser.auto-open=true");
        assertThat(written).contains("observability.enabled=false");
    }

    @Test
    void load_invalidPort_fallsBackToDefaultPort() throws Exception {
        // given
        Path file = configFile();
        Files.writeString(file, "server.port=not-a-number");

        // when
        LauncherConfig config = LauncherConfig.load(file);

        // then
        assertThat(config.getServerPort()).isEqualTo(8080);
    }

    @Test
    void toSpringArgs_groqProvider_mapsProfilesAndKeys() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());
        config.setAiProvider("groq");
        config.setGoogleApiKey("google-key");
        config.setGroqApiKey("groq-key");
        config.setServerPort(9090);

        // when
        String[] args = config.toSpringArgs();

        // then
        assertThat(args).contains(
                "--spring.profiles.active=groq",
                "--spring.ai.google.genai.api-key=google-key",
                "--spring.ai.openai.api-key=groq-key",
                "--server.port=9090");
    }

    @Test
    void toSpringArgs_blankKeys_omitsApiKeyArgs() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());

        // when
        String[] args = config.toSpringArgs();

        // then
        assertThat(args).contains(
                "--spring.profiles.active=google",
                "--server.port=8080");
        assertThat(args).noneMatch(arg -> arg.startsWith("--spring.ai.google.genai.api-key="));
        assertThat(args).noneMatch(arg -> arg.startsWith("--spring.ai.openai.api-key="));
    }

    @Test
    void missingApiKeyWarning_withEnvironmentKey_returnsNull() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());
        org.springframework.mock.env.MockEnvironment env = new org.springframework.mock.env.MockEnvironment();
        env.setProperty("spring.ai.google.genai.api-key", "env-google-key");

        // when
        String warning = config.missingApiKeyWarning(env);

        // then
        assertThat(warning).isNull();
    }

    @Test
    void toSpringArgs_observabilityEnabled_prefixesObservabilityProfile() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());
        config.setObservability(true);

        // when
        String[] args = config.toSpringArgs();

        // then
        assertThat(args).contains("--spring.profiles.active=observability,google");
    }

    @Test
    void toSpringArgs_extraArgs_overrideManagedKeysAndPassThrough() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());

        // when
        String[] args = config.toSpringArgs(
                "--server.port=9999", "--logging.level.root=DEBUG", "positional");

        // then
        assertThat(args).contains("--server.port=9999");
        assertThat(args).doesNotContain("--server.port=8080");
        assertThat(args).contains("--logging.level.root=DEBUG", "positional");
    }

    @Test
    void missingApiKeyWarning_blankSelectedProviderKey_returnsWarning() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());

        // when / then
        assertThat(config.missingApiKeyWarning())
                .contains("Google API key is missing");
        config.setAiProvider("groq");
        assertThat(config.missingApiKeyWarning())
                .contains("Groq API key is missing");
    }

    @Test
    void missingApiKeyWarning_selectedProviderKeySet_returnsNull() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());
        config.setGoogleApiKey("google-key");

        // when / then
        assertThat(config.missingApiKeyWarning()).isNull();
    }

    @Test
    void setServerPort_outOfRange_throwsIllegalArgument() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());

        // when / then
        assertThatThrownBy(() -> config.setServerPort(80))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> config.setServerPort(70000))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void setAiProvider_unknownValue_throwsIllegalArgument() {
        // given
        LauncherConfig config = LauncherConfig.load(configFile());

        // when / then
        assertThatThrownBy(() -> config.setAiProvider("anthropic"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
