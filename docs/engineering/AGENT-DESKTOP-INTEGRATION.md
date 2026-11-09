# Primary desktop accessibility backend

ZERO now exposes `desktop_control` as its primary semantic desktop tool. It uses the pinned Vercel Labs `agent-desktop` **1.2.0** Windows x64 executable. Existing coordinate/browser commands remain compatible; the assistant tool descriptions prefer the new accessibility path. This is not a claim that every old action now automatically routes through the new executable.

## Install and execution

Run `node scripts/install-agent-desktop.mjs` from the repository. The installer downloads the official native release, checks pinned archive and executable SHA-256, validates archive entries and publishes exclusively. It does not run upstream npm postinstall, stop other hosts, install global packages or introduce approval dialogs. The installed runtime is in `artifacts/agent-desktop-runtime/bin/agent-desktop.exe`; reinstall after artifact cleanup or on a fresh checkout.

The tool accepts `command`, an array of CLI `args`, optional text `input` and boolean `headed`. Start with `status`, then use `snapshot` scoped to an actually observed window ID. Click/get/set-value use qualified refs returned by that snapshot. `input` is sent on stdin for text commands, keeping typed text out of process arguments. Existing manual hold and desktop lease coordination remain in the execution path. Observation remains possible during manual hold.

No automatic retry or coordinate fallback occurs after a failed or uncertain native action. Delivery/retry disposition is retained. `delivered_verified` is distinct from merely delivered input. A failed reference is not converted into success. Read live state before deciding whether another action is needed.

## Verified scope — 10 November 2026

- Actual owned Windows Forms window: semantic Unicode set-value, fresh snapshot, one button invocation, independent application-file readback with expected text and exactly one click. Invalid unqualified ref rejected without another click. Manual hold preserved.
- Actual canonical host-registered `desktop_control` tool executed these actions. Actual configured external model called this primary tool and returned the exact field value from its snapshot. The response now exposes `modelContent` separately from the existing presentation-card-augmented `content`; the UI remains unchanged. This does not relax the separate strict local-recall test.
- Eight existing browser workflows passed, including persisted memory/settings/plugin effects, actual scrollTop change and actual process reconnect. Eight selected scope/tool-batch/operator regression checks also passed.
- Evidence: [native/model workflow](verification/2026-11-10/agent-desktop-native-and-model.json) and [UI regressions](verification/2026-11-10/agent-desktop-ui-regression.json).

The native click reported `delivered_unverified`; the separate application-file readback established the selected test's effect. The adapter does not relabel all clicks as independently verified.

Initial fixture discovery failed because the hidden helper startup also hid its form. The owned fixture was corrected to explicitly show its form without activating it. An initial model run exhausted the existing tool-round budget with malformed CLI arguments; command enums and concrete argument descriptions corrected the interface. A later raw-message comparison failed because ZERO appends presentation cards; `modelContent` now preserves the original model response while preserving existing rendered content. Failed artifacts remain local, including private desktop inventory; they are not copied into public documentation.

## Limits and remaining acceptance

This is one native fixture and one model readback workflow, not a broad accuracy benchmark. Duplicate indistinguishable controls can refuse with ambiguity; take an appropriate new observation or deliberately choose a coordinate path. Canvas/pixel-only applications still need visual/coordinate support. Secure/UAC/locked desktops and elevated application boundaries are not solved by adopting this backend. Only Windows x64 is provisioned by this installer. No new phone/cloud target is available; user confirmed Windows-PC-only testing.

Owner configuration edits and existing UI/data are preserved. The complete ZERO master acceptance, human microphone/barge-in, strict local recall and full endurance gate remain open. No production sign-off is made here.

## Upstream provenance

- [Repository and architecture](https://github.com/vercel-labs/agent-desktop), research checkout `ab7dfb218cddc1594aa1d87a5bfcd0ac76da2276`.
- [Pinned release](https://github.com/vercel-labs/agent-desktop/releases/tag/v1.2.0); archive SHA-256 `a4199f741a441cedd349bf56c5eba01783b1261258b498efeb7ec9945220c3e8`, executable SHA-256 `d274667031322e50b9c2b1ab81c2ca46835d52cc932769a5c34bd4d481fd94c3`.
- Exact-version bundled desktop and Windows guides were read from the installed binary (`skills get desktop`, `skills get platform`). Their protocol envelope version is 2.6; runtime version is 1.2.0.
- Apache-2.0 license is retained at [upstream license](../third-party/agent-desktop-LICENSE.txt) and copied beside the installed runtime metadata.
