package group.four.nyare.nyare.launcher;

import java.io.IOException;
import java.io.Reader;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

/**
 * Reads and writes {@code nyare.properties}, the portable launcher
 * configuration stored next to the executable JAR (or in the working
 * directory when running outside a JAR).
 */
public class LauncherConfig {

    public static final String FILE_NAME = "nyare.properties";

    public static final int MIN_PORT = 1024;
    public static final int MAX_PORT = 65535;

    private static final String PROVIDER_GOOGLE = "google";
    private static final String PROVIDER_GROQ = "groq";

    private final Path file;

    private String aiProvider = PROVIDER_GOOGLE;
    private String googleApiKey = "";
    private String groqApiKey = "";
    private int serverPort = 8080;
    private boolean browserAutoOpen = true;
    private boolean observability = false;

    private LauncherConfig(Path file) {
        this.file = file;
    }

    /**
     * Resolves {@code nyare.properties} next to the running JAR, or in the
     * working directory when the code source is not a JAR (IDE, Gradle).
     * Boot JARs report the code source as a {@code jar:nested:...} URL, so the
     * outer JAR path is extracted from the URL text.
     */
    static Path defaultFile() {
        try {
            URI location = LauncherConfig.class.getProtectionDomain()
                    .getCodeSource().getLocation().toURI();
            String text = location.toString();
            Path codeSource;
            int nestedAt = text.indexOf("nested:");
            if (nestedAt >= 0) {
                int jarEnd = text.indexOf(".jar", nestedAt);
                codeSource = jarEnd < 0 ? null
                        : Path.of(URI.create("file:" + text.substring(nestedAt + 7, jarEnd + 4)));
            } else {
                codeSource = Path.of(location);
            }
            if (codeSource != null && Files.isRegularFile(codeSource)
                    && codeSource.toString().endsWith(".jar")) {
                return codeSource.getParent().resolve(FILE_NAME);
            }
        } catch (Exception e) {
            // Fall through to the working directory.
        }
        return Path.of(System.getProperty("user.dir"), FILE_NAME);
    }

    public static LauncherConfig load() {
        return load(defaultFile());
    }

    /**
     * Loads configuration from {@code file}. Generates the file with defaults
     * when missing, merges defaults for missing keys, and falls back to
     * defaults when the file cannot be parsed.
     */
    public static LauncherConfig load(Path file) {
        LauncherConfig config = new LauncherConfig(file);
        if (!Files.exists(file)) {
            populateApiKeysFromDotenv(file, config);
            config.saveQuietly();
            return config;
        }
        Properties props = new Properties();
        try (Reader reader = Files.newBufferedReader(file, StandardCharsets.UTF_8)) {
            props.load(reader);
        } catch (IOException | IllegalArgumentException e) {
            System.err.println("nyare.properties is unreadable (" + e.getMessage()
                    + "); regenerating defaults.");
            config.saveQuietly();
            return config;
        }
        boolean missing = false;
        String provider = props.getProperty("ai.provider");
        missing |= provider == null;
        config.aiProvider = sanitizeProvider(provider);

        String googleKey = props.getProperty("google.api.key");
        missing |= googleKey == null;
        config.googleApiKey = googleKey == null ? "" : googleKey.trim();

        String groqKey = props.getProperty("groq.api.key");
        missing |= groqKey == null;
        config.groqApiKey = groqKey == null ? "" : groqKey.trim();

        populateApiKeysFromDotenv(file, config);

        String port = props.getProperty("server.port");
        missing |= port == null;
        config.serverPort = parsePort(port);

        String autoOpen = props.getProperty("browser.auto-open");
        missing |= autoOpen == null;
        config.browserAutoOpen = autoOpen == null || Boolean.parseBoolean(autoOpen.trim());

        String observability = props.getProperty("observability.enabled");
        missing |= observability == null;
        config.observability = observability != null
                && Boolean.parseBoolean(observability.trim());

        if (missing) {
            config.saveQuietly();
        }
        return config;
    }

    private static void populateApiKeysFromDotenv(Path configFile, LauncherConfig config) {
        if (!config.googleApiKey.isBlank() && !config.groqApiKey.isBlank()) {
            return;
        }
        Path parent = configFile.getParent();
        if (parent == null) {
            return;
        }
        Path envFile = parent.resolve(".env");
        if (!Files.isRegularFile(envFile)) {
            return;
        }
        try {
            for (String line : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) {
                    continue;
                }
                int eq = trimmed.indexOf('=');
                if (eq <= 0) {
                    continue;
                }
                String key = trimmed.substring(0, eq).trim();
                String val = trimmed.substring(eq + 1).trim();
                if ((val.startsWith("\"") && val.endsWith("\""))
                        || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length() - 1);
                }
                if (config.googleApiKey.isBlank() && "GOOGLE_API_KEY".equals(key)) {
                    config.googleApiKey = val;
                }
                if (config.groqApiKey.isBlank() && "GROQ_API_KEY".equals(key)) {
                    config.groqApiKey = val;
                }
            }
        } catch (IOException e) {
            // Ignore unreadable .env file; nyare.properties defaults apply.
        }
    }

    private static String sanitizeProvider(String value) {
        if (value == null) {
            return PROVIDER_GOOGLE;
        }
        String trimmed = value.trim().toLowerCase();
        return PROVIDER_GROQ.equals(trimmed) ? PROVIDER_GROQ : PROVIDER_GOOGLE;
    }

    private static int parsePort(String value) {
        if (value != null) {
            try {
                int port = Integer.parseInt(value.trim());
                if (port >= MIN_PORT && port <= MAX_PORT) {
                    return port;
                }
            } catch (NumberFormatException e) {
                // Fall through to the default port.
            }
        }
        return 8080;
    }

    /** Writes the current values back to {@code nyare.properties}. */
    public void save() throws IOException {
        String nl = System.lineSeparator();
        String content = "# Nyare Server Configuration" + nl
                + "# Generated automatically on launch. Edit here or via the launcher GUI." + nl + nl
                + "# AI Provider selection: 'google' (default) or 'groq'" + nl
                + "ai.provider=" + aiProvider + nl + nl
                + "# Google Gemini API key (used when ai.provider=google)" + nl
                + "google.api.key=" + escape(googleApiKey) + nl
                + "# Groq Cloud API key (used when ai.provider=groq)" + nl
                + "groq.api.key=" + escape(groqApiKey) + nl + nl
                + "# HTTP server listening port (default: 8080)" + nl
                + "server.port=" + serverPort + nl + nl
                + "# Automatically launch default system browser upon successful server startup" + nl
                + "browser.auto-open=" + browserAutoOpen + nl + nl
                + "# Enable the dev audit trace console at /dev/observability (default: false)" + nl
                + "observability.enabled=" + observability + nl;
        Files.writeString(file, content, StandardCharsets.UTF_8);
    }

    private void saveQuietly() {
        try {
            save();
        } catch (IOException e) {
            System.err.println("Could not write nyare.properties: " + e.getMessage());
        }
    }

    private static String escape(String value) {
        return value.replace("\\", "\\\\");
    }

    /**
     * Returns a startup warning when the selected provider's API key is blank,
     * or {@code null} when a key is configured. AI features fail without it.
     */
    public String missingApiKeyWarning() {
        return missingApiKeyWarning(null);
    }

    /**
     * Returns a startup warning when the selected provider's API key is blank
     * in this config and missing in the Spring environment.
     */
    public String missingApiKeyWarning(org.springframework.core.env.Environment env) {
        boolean google = PROVIDER_GOOGLE.equals(aiProvider);
        String key = google ? googleApiKey : groqApiKey;
        if (!key.isBlank()) {
            return null;
        }
        if (env != null) {
            String springKey = env.getProperty(google
                    ? "spring.ai.google.genai.api-key"
                    : "spring.ai.openai.api-key");
            if (springKey != null && !springKey.isBlank() && !springKey.endsWith("-disabled")) {
                return null;
            }
        }
        return (google ? "Google" : "Groq")
                + " API key is missing. AI features will fail until it is configured.";
    }

    /**
     * Maps the launcher keys to Spring Boot command-line arguments. Entries in
     * {@code extraArgs} that repeat a managed key override the file value.
     */
    public String[] toSpringArgs(String... extraArgs) {
        Map<String, String> managed = new LinkedHashMap<>();
        managed.put("spring.profiles.active",
                observability ? "observability," + aiProvider : aiProvider);
        if (!googleApiKey.isBlank()) {
            managed.put("spring.ai.google.genai.api-key", googleApiKey);
        }
        if (!groqApiKey.isBlank()) {
            managed.put("spring.ai.openai.api-key", groqApiKey);
        }
        managed.put("server.port", String.valueOf(serverPort));

        List<String> passthrough = new ArrayList<>();
        for (String arg : extraArgs) {
            if (arg != null && arg.startsWith("--") && arg.indexOf('=') > 2) {
                int eq = arg.indexOf('=');
                String key = arg.substring(2, eq);
                if (managed.containsKey(key)) {
                    managed.put(key, arg.substring(eq + 1));
                    continue;
                }
            }
            passthrough.add(arg);
        }
        List<String> result = new ArrayList<>(managed.size() + passthrough.size());
        managed.forEach((key, value) -> result.add("--" + key + "=" + value));
        result.addAll(passthrough);
        return result.toArray(new String[0]);
    }

    public Path getFile() {
        return file;
    }

    public String getAiProvider() {
        return aiProvider;
    }

    public void setAiProvider(String aiProvider) {
        if (!PROVIDER_GOOGLE.equals(aiProvider) && !PROVIDER_GROQ.equals(aiProvider)) {
            throw new IllegalArgumentException("ai.provider must be 'google' or 'groq'");
        }
        this.aiProvider = aiProvider;
    }

    public String getGoogleApiKey() {
        return googleApiKey;
    }

    public void setGoogleApiKey(String googleApiKey) {
        this.googleApiKey = googleApiKey == null ? "" : googleApiKey.trim();
    }

    public String getGroqApiKey() {
        return groqApiKey;
    }

    public void setGroqApiKey(String groqApiKey) {
        this.groqApiKey = groqApiKey == null ? "" : groqApiKey.trim();
    }

    public int getServerPort() {
        return serverPort;
    }

    public void setServerPort(int serverPort) {
        if (serverPort < MIN_PORT || serverPort > MAX_PORT) {
            throw new IllegalArgumentException(
                    "server.port must be between " + MIN_PORT + " and " + MAX_PORT);
        }
        this.serverPort = serverPort;
    }

    public boolean isBrowserAutoOpen() {
        return browserAutoOpen;
    }

    public void setBrowserAutoOpen(boolean browserAutoOpen) {
        this.browserAutoOpen = browserAutoOpen;
    }

    public boolean isObservability() {
        return observability;
    }

    public void setObservability(boolean observability) {
        this.observability = observability;
    }
}
