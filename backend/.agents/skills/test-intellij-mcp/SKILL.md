---
name: test-intellij-mcp
description: Tests connectivity and functionality of the IntelliJ MCP server tools.
---

# Test IntelliJ MCP

Use this skill to test connectivity to the IntelliJ MCP server and verify its tools.

## Available Tools Reference

The `intellij` MCP server exposes lazy tools:
- `get_project_modules`: Lists project modules.
- `get_file_problems`: Returns errors/diagnostics for a file path.
- `search_in_files_by_text`: Searches file contents by string.
- `find_files_by_name_keyword`: Finds files matching keywords.
- `get_symbol_info`: Finds symbol definitions and declarations.

---

## Test Verification Workflow

Execute these steps in sequence to verify the IntelliJ MCP connection.

### Step 1: Query Project Modules
Call `get_project_modules` with empty arguments to check basic MCP connectivity:
```json
{
  "ServerName": "intellij",
  "ToolName": "get_project_modules",
  "Arguments": {}
}
```

### Step 2: Search Files or Symbols
Call `find_files_by_name_keyword` or `search_in_files_by_text` to verify indexing:
```json
{
  "ServerName": "intellij",
  "ToolName": "find_files_by_name_keyword",
  "Arguments": {
    "keyword": "Course"
  }
}
```

### Step 3: Check File Diagnostics
Call `get_file_problems` on a source file to verify static analysis:
```json
{
  "ServerName": "intellij",
  "ToolName": "get_file_problems",
  "Arguments": {
    "filePath": "src/main/java/group/four/nyare/nyare/model/Course.java"
  }
}
```

---

## Diagnostic Check Status

- If tools return structured project data, IntelliJ MCP is active and operational.
- If calls fail or time out, follow fallback procedures specified in backend rules.
