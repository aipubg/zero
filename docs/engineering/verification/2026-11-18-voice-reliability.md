# Voice reliability repair — 2026-11-18

Status: PARTIAL project acceptance; implemented fixes pass scoped regression.

## Changes

- `app/zero-control-ui/src/voice-control.js`: mic mute stops native capture and browser recognition while retaining the conversation and output; unmute reacquires capture. End voice remains distinct. Recognition handlers, synthesis watchdogs and disposal are cleaned up. Status is scoped to the owned chat, polling cannot overlap, and late chat replies cannot speak after ending/restarting a session.
- `app/zero-control-ui/src/home-screen.js`: preserve speaking display while muted, remove listeners and timers when leaving Home, reconnect listeners on reopening, handle missing/zero-size canvas and height-only resizing, and base animation speed on elapsed time. Hidden documents skip drawing.
- `services/host/native-gateway.mjs` and `packages/voice-engine/conversation.mjs`: explicit `preserveConversation` microphone stop clears pending input endpoint without cancelling the current assistant reply.
- `packages/voice-engine/index.mjs`: reject stale capture acquisition after session shutdown; malformed audio callbacks report capture failure and abort capture rather than throwing into the process; optional mute input discard resets buffered audio/VAD.
- Updated generated UI manifest through the existing build pipeline. No new runtime modules or removals.

## Verification

Final selected run: **43 passed, 0 failed, 0 skipped** across `test/voice-manners.test.mjs`, `test/voice-summary.test.mjs`, `test/voice-conversation.test.mjs`, `test/home-scene.test.mjs`, `packages/voice-engine/test/windows-voice.test.mjs`, `test/native-gateway.test.mjs`, and `test/voice-completion-honesty.test.mjs`.

The native gateway test exercised an isolated actual WebSocket connection and persisted effects. Audio and canvas tests use supplied adapters; they do not establish physical audibility or visual acceptance. UI build and `git diff --check` passed. No performance benchmark or crash-free endurance claim.

## Remaining failures and limits

The wider regression run was not clean: missing installed spawn-policy module; incomplete fake DOM APIs (`getElementById`, `style.setProperty`); bundle assertions expecting old model-provider markup and prohibiting existing voice-language local storage; and Phase 15 manual transcription finding an already-drained audio buffer. These remain unresolved, not silently skipped or treated as passes.

Actual headset mute/unmute, browser rendering, automatic recognition fallback, prolonged use, and full project acceptance remain unverified. The existing live host was not restarted; backend changes require its normal restart. The animation is the existing SVG/canvas presentation, not a newly implemented 3D renderer.

No commit created. Existing model/provider and system configuration edits were preserved. Rollback should reverse only this change's source/test hunks and rebuild the UI; do not reset unrelated configuration changes.
