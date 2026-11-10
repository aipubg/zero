# Same-player media execution correction

ZERO now opens a visible, separately owned Chrome/Edge media page and verifies the player it actually controls. Desktop accessibility remains the primary general computer backend. No new approval prompt was added. Existing personal browser profiles are not attached, modified or closed.

The previous implementation guessed player coordinates, sent duplicate toggle keys and could use playback in an unrelated muted headless browser as evidence. That path was removed. Explicit play/pause and mute/unmute now set the requested state; volume is bounded and checked. Playback requires the same nonempty source, an advancing clock and an unpaused, non-ended player without a media error. Decoded audio bytes are recorded separately; speaker audibility remains **UNVERIFIED**. Focus acknowledgement does not claim verified Windows foreground focus. Unknown commands, ambiguous/missing players and unavailable targets fail explicitly. Cancellation closes the owned browser and cannot report completed playback.

The current model tool schema exposes `media_control`. The actual chat renderer now observes new language-tagged widget blocks, preserving surrounding conversation. Widget controls target the owned player; a verified pause updates the displayed status. Generic media is no longer labelled YouTube automatically. Playwright 1.63.0 is a pinned runtime dependency, and frozen installation passed the actual dependency policy check.

## Evidence

- `artifacts/ui-design/media-ui-package-regression.log`: **104 PASS**, existing UI package assertions. These are not 104 real browser workflows.
- `artifacts/ui-design/media-final-browser-regression.log`: **5 PASS**, real visible media/control/cancellation, live widget observer, shell navigation and assistant protocol checks. Local media is actual decoded silent PCM, not acoustic output proof.
- `artifacts/ui-design/media-final-audit.log`: **18 PASS**, overlapping media checks plus classification/reporting integrity. Counts are not additive acceptance totals.
- `artifacts/ui-design/media-external-probe.json`: **PASS**, actual external MDN video playback and pause in the same visible player.
- `artifacts/media-control/1794327799635/report.json`: **PASS**, actual configured external model invoked playback through chat UI; clicking the production media card paused the same original video and displayed `PAUSED`.
- `artifacts/ui-design/media-runtime-dependency-install.log`: actual frozen pnpm installation and supply-chain policy check passed. The earlier offline attempt lacked cached package metadata and failed; it was not counted as PASS.

Reproduce the external acceptance with `node scripts/verify-media-control.mjs --external --visible-media`. It requires the configured provider and an installed Chrome/Edge, opens a visible media window, uses an isolated host/chat and writes a distinct timestamped report. No arguments are BLOCKED/NOT_RUN. The early missing live-widget observer, short upstream wait and case-sensitive rendered-label failures remain recorded separately in private artifacts; they were not reclassified.

## Limits

This proves the exact external-video/model/widget workflow and the declared local control cases. Arbitrary existing app players, YouTube query relevance/consent/ad behavior and next/previous playlist effects are not newly certified. No microphone recording or human audible confirmation occurred. The earlier fourteen-workflow browser checkpoint is separate evidence, not a rerun at this commit. Product remains PARTIAL; mobile/cloud prerequisites and full release gates remain open. The owner-withdrawn endurance test was not run.

Current source inventory: 112 test source files, 94 reviewed additional sources, 619 lexical declarations including containers, and 14 standalone runner entries. Inventory checks execute no product acceptance workflows.

Protocol references: [Playwright BrowserType](https://playwright.dev/docs/api/class-browsertype), [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement), [playback clock](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime).
