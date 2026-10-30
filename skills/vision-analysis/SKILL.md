---
name: vision-analysis
description: Multimodal screen perception, element boundary extraction, UI OCR, and visual scene understanding.
triggers:
  - "vision"
  - "look at screen"
  - "what is on screen"
  - "analyze image"
  - "read screen"
---

# Vision Analysis & Screen Perception Skill

Multi-tier visual analysis for autonomous GUI control:

## Capabilities
1. **Tier 1 Structured Perception**: Fast Windows UI Automation (UIA) tree inspection and native Windows OCR text extraction.
2. **Tier 2 Local Vision Model**: Moondream2 multimodal projector (`@vision`) scene analysis and relative coordinate extraction.
3. **Cursor Target Inspection**: Identify the exact element, button, text, and window directly under the user's cursor (`cursor_target`).
4. **Motion & Media Detection**: Detect high-frequency frame differences to identify active video playback or streaming media.

## Standard Execution Workflow
1. Capture desktop frame or inspect current UIA tree via `zero_screen_context`.
2. Extract interactive element list with bounding boxes and `(centerX, centerY)` points.
3. If cursor context requested, map mouse `(x, y)` to intersecting element.
4. Return structured UI elements and concise visual summary.
