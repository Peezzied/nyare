---
trigger: always_on
description: Always bypass the terminal sandbox when running Gradle or Java commands.
---

# Java and Gradle Sandbox Execution Rule

Always bypass the sandbox when you execute Java or Gradle commands.

## Requirements

1. Set `BypassSandbox: true` for all Gradle CLI commands:
   - `gradle`
   - `./gradlew`
   - `gradlew`
   - `gradlew.bat`
2. Set `BypassSandbox: true` for all Java CLI commands:
   - `java`
   - `javac`
   - `javap`
   - `jar`
