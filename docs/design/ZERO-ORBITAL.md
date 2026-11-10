# ZERO / Orbital

The owner requested a first-party Zero UI on 10 November 2026, superseding the earlier correction-phase instruction to retain the visual design. Orbital changes the product shell while keeping the existing Gateway, routes, conversations, installation records and settings authoritative.

## Visual direction

Graphite surfaces, sea-glass cyan, precise typography and a custom slashed-zero orbital emblem. The emblem is local SVG/CSS, not a downloaded brand asset. A quiet grid and concentric lines suggest a personal command space without invented charts or performance counters. System fonts avoid a remote font dependency.

The command home introduces four working entry points: research, creation, computer tasks and skills. Draft shortcuts focus the existing composer, preserve an already-written draft and never submit a message. Model, voice, observation and connection labels come from actual Gateway responses; an unavailable connection is not presented as a ready model.

## Working navigation

The workspace navigation exposes Command, Computer, Automations, Dashboards, Memory, Search, Models, Agents, Skills, Plugins, Settings and About Zero. The navigation palette adds Voice, Devices, Cloud workers, MCP, Privacy, Appearance, Gateway and Notifications. These destinations use the existing application routes rather than introducing a second state store or disconnected demo backend.

**Alt+K** opens route navigation. Filtering, arrow keys, Enter and Escape work. The existing Ctrl+K application search remains separate. The palette closes before native route interception, and shell activation/disposal is idempotent. Settings retain their detailed native navigation with Zero branding.

## Layout and preservation

The live control buttons sit in a scrollable header tray rather than floating over navigation. Desktop and tablet use a split hero; mobile keeps the composer visible and uses a two-column action grid. Keyboard focus is visible, reduced-motion preferences disable transitions, and native scroll fades use the dark surface token. Skills and Plugins installation forms share the new spacing, field and button styles.

No owner configuration, credentials, chat, models or skills were deleted or replaced. The hidden Models test marker was removed; contracts now check the actual heading and assert marker absence. No permission popup or new approval gate was introduced.

## Evidence and limits

See [the Orbital verification receipt](../engineering/verification/2026-11-10/zero-orbital-ui.json). Dedicated browser checks exercise real navigation, draft preservation, keyboard interaction and responsive layout against a disposable real host. Broader browser runs exercise actual backend workflows. The latest broad run is **13 PASS / 1 FAIL**, with the real external GitHub Skill download timing out; that failure is retained. This UI checkpoint is not full production sign-off, universal accessibility certification or completion of the remaining product work. The owner-withdrawn 24-hour endurance test was not restarted.
