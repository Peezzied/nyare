# Contract: GitHub Actions Pre-release Workflow Specification

## Workflow File
Path: `.github/workflows/prerelease.yml`

## Triggers
- `release` event with activity types: `[published, prereleased]`
- `workflow_dispatch` event with optional input:
  - `tag_name` (string, optional): Git release tag to upload the asset to.

## Permissions
```yaml
permissions:
  contents: write
```

## Environment
- OS: `ubuntu-latest`
- Java Toolchain: Eclipse Temurin JDK 25
- Node.js Runtime: Node 22 (LTS)

## Pipeline Contract Steps
1. **Repository Checkout**: `actions/checkout@v4`
2. **Setup Node.js**: `actions/setup-node@v4` (`node-version: 22`, npm cache on `frontend/package-lock.json`)
3. **Setup Java**: `actions/setup-java@v4` (`distribution: 'temurin'`, `java-version: '25'`)
4. **Setup Gradle**: `gradle/actions/setup-gradle@v4`
5. **Frontend Build**:
   - `npm ci` in `frontend/`
   - `npm run build` in `frontend/` (outputs to `app/src/main/resources/static/`)
6. **Backend Configuration Setup**:
   - Copies `application*.properties.example` to `application*.properties` in `app/src/main/resources` and `app/src/test/resources`.
7. **Make Wrapper Executable**: `chmod +x app/gradlew`
8. **Unit Tests**:
   - `cd app && ./gradlew test -PexcludeIntegrationTests`
9. **Package Executable JAR**:
   - `cd app && ./gradlew bootJar -x test`
10. **Locate and Normalize Artifact**:
    - Discards `*-plain.jar` and `*-javadoc.jar`.
    - If `TAG` is available: copies bootJar to `nyare-${TAG}.jar`.
11. **Upload Actions Artifact**:
    - `actions/upload-artifact@v4` with retention of 7 days.
12. **Upload to GitHub Release**:
    - If triggered by `release` or `tag_name` provided: executes `gh release upload "$TAG" "$JAR_PATH" --clobber`.
