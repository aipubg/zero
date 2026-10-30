---
name: terminal-exec
description: High-speed command execution, shell automation, process management, and CLI tool workflows on Windows.
triggers:
  - "terminal"
  - "run command"
  - "shell"
  - "powershell"
  - "process"
---

# Terminal Execution & Process Management Skill

Execute PowerShell, CMD, and background processes reliably on Windows.

## Capabilities
1. **PowerShell 5.1/7 & CMD Automation**: Run Windows commands, parse stdout/stderr cleanly, and handle non-zero exit codes.
2. **Background Process Management**: Spawn, monitor, and terminate background daemon processes without blocking the main agent loop.
3. **Environment & Path Isolation**: Safely resolve executables via `where.exe`, inspect path variables, and sanitize inputs.
4. **Encoding & Null-Safety**: Enforce UTF-8 encoding across Windows console buffers and prevent shell syntax escaping errors.

## Standard Execution Workflow
1. Verify command syntax and ensure required binaries exist on PATH.
2. Run command with bounded timeout (default 5-30s) and capture stdout/stderr.
3. Check exit code; on failure, analyze stderr and offer targeted repair.
4. Format output cleanly for display.
