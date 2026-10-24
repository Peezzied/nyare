# Contract: `nyare.properties` Specification

## Format
Standard Java `.properties` file (ISO-8859-1 or UTF-8 encoded with `\uXXXX` escaping for non-Latin characters, loaded via `java.util.Properties`).

## Location
Resolved at runtime using `NyareApplication.class.getProtectionDomain().getCodeSource().getLocation()`.
- When running from `nyare.jar`: In the same directory as `nyare.jar`.
- When running from IDE / Gradle: In current working directory (`./nyare.properties`).

## Keys & Values Specification

```properties
# Nyare Server Configuration
# Generated automatically on launch. Edit here or via the launcher GUI.

# AI Provider selection: 'google' (default) or 'groq'
ai.provider=google

# Google Gemini API key (used when ai.provider=google)
google.api.key=

# Groq Cloud API key (used when ai.provider=groq)
groq.api.key=

# HTTP server listening port (default: 8080)
server.port=8080

# Automatically launch default system browser upon successful server startup
browser.auto-open=true

# Enable the dev audit trace console at /dev/observability (default: false)
observability.enabled=false
```

## Mapping to Spring Boot Properties

When launching Spring Boot, the launcher translates `nyare.properties` keys into Spring environment properties:

| `nyare.properties` Key | Spring Property Equivalent | Value Transformation |
| :--- | :--- | :--- |
| `ai.provider=google` | `spring.profiles.active` | Appends `google` profile |
| `ai.provider=groq` | `spring.profiles.active` | Appends `groq` profile |
| `observability.enabled=true` | `spring.profiles.active` | Prepends `observability` profile (e.g. `observability,google`) |
| `google.api.key=<key>` | `spring.ai.google.genai.api-key` | `<key>` (or `google-disabled` if blank) |
| `groq.api.key=<key>` | `spring.ai.openai.api-key` | `<key>` (or `groq-disabled` if blank) |
| `server.port=<port>` | `server.port` | `<port>` |
