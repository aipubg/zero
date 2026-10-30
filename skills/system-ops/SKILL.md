---
name: system-ops
description: Windows OS management, app launching, window control, registry/services inspection, and file operations.
triggers:
  - "system"
  - "launch app"
  - "close app"
  - "switch window"
  - "windows settings"
---

# Windows System Operations Skill

Perform essential Windows operating system management autonomously:

## Capabilities
1. **Application Lifecycle**: Launch installed desktop applications (`open_app`, `launch_app`) and terminate hung processes (`kill_app`).
2. **Window Control**: List open windows (`list_windows`), focus foreground windows (`focus_window`), minimize, maximize, and restore.
3. **File System Operations**: Read, create, edit, move, copy, and archive files and directories safely.
4. **Clipboard Management**: Inspect and set clipboard contents (`clipboard_get`, `clipboard_set`) without leaking sensitive data.

## Standard Execution Workflow
1. Identify target application or window title.
2. If application is already running, bring to front; otherwise launch executable.
3. Verify window is in foreground before initiating input actions.
4. Return success status with window title and process ID.
