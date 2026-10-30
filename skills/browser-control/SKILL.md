---
name: browser-control
description: Browser automation, YouTube media control, fast DOM/UIA element interaction, video playback, and web navigation.
triggers:
  - "browser"
  - "open youtube"
  - "play video"
  - "click link"
  - "search youtube"
---

# Browser & Media Control Skill

Autonomous browser and media automation for Project Zero:

## Capabilities
1. **YouTube & Media Control**: Open YouTube videos, search for queries, click recommended videos, toggle play/pause, adjust volume, and skip ads.
2. **Fast UIA & DOM Targeting**: Locate interactive browser elements (search inputs, video players, links) using UIA coordinates `(centerX, centerY)` for 1-5ms response time.
3. **Web Form Interaction**: Fill inputs, click buttons, navigate forward/back, and scroll through pages.
4. **Media Monitoring**: Track video playback streaks and capture media summaries in `video_and_media_logs`.

## Standard Execution Workflow
1. If browser is not focused, focus or launch Chrome/Edge/default browser.
2. For YouTube tasks: navigate to URL or search bar, type query, press Enter, locate target video thumbnail via UIA, and click center coordinates.
3. Verify video starts playing by observing screen changes.
4. Render interactive media card (`zero-ui:media`) in chat stream.
