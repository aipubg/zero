# Windows `computer.act` action taxonomy (derived, machine-checked)

**Owner:** Qoder · **Written:** 2026-10-23 · **Pins:** OpenClaw `013240515205573248c27ab6b8eec7303f0da1a8` (`2026.10.6`)
**Answers:** DeepSeek Harness ask (e) in `AGENT_CHAT.txt` (stable action names for the policy matcher + budget/audit rows) and @manager's "record exact Windows computer.act action names".
**Machine-readable form:** [`computer-act-actions.json`](computer-act-actions.json) — regenerate with `node computer/tools/derive-windows-actions.mjs` (last run: 9/9 self-checks pass, exit 0).

**Provenance, stated honestly:** these names are **derived from pinned source by a script**, not executed against a live node. `[needs GO]` CU-01 step S5/S11 confirms the advertised set against a real `computerUse` descriptor. Do not treat this table as live proof — treat it as the exact thing CU-01 must compare reality against.

> **Cross-checked against the installed release (2026-10-23).** The runtime is commit `fe06181`, not the `0132405` this table was derived from. I did not stop at comparing the name list: I **executed the release's own filter logic** — `CUA_COMMON_ACTION_NAMES` (38 names) through `platformActions(platform)` (`dist/extensions/cua-computer/index.js:21435`, which drops only `left_mouse_down`/`left_mouse_up` off Linux) — and it yields **36 names on win32, the identical set** to my source-derived table (`release-only: []`, `mine-only: []`; `wait` and `hold_key` absent from both). The release builds the list differently from the checkout (it composes 38 common names rather than filtering 40), so the agreement is a genuine cross-check, not a tautology. What did *not* survive the pin shift is the driver version and its pinned digests (`0.34.1` → `0.32.0`) — see [release-pin-reconciliation.md](../../reports/computer/release-pin-reconciliation.md).

---

## 1. The two command channels (this is the part that surprises people)

The model sees **one** tool (`computer`), but its actions split across **two** node commands `[CODE]`:

| Channel | Carried by | Which actions |
|---|---|---|
| `screen.snapshot` | the read path (`computer-tool-request.ts:20` `LOCAL_ACTIONS = ["screenshot","wait"]`) | `screenshot`, `wait` (local pacing, still needs snapshot authority), and `take_control`'s fresh capture |
| `computer.act` | the input path (`computer-tool-request.ts:21-23` — every v2 name **not** in `LOCAL_ACTIONS`) | **all input actions *and* the structured observation actions**: `list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `zoom`, `get_browser_state`, `get_recording_state` |

Consequences that belong in the contract, not in a footnote:

- **`computer.act` is not "the input command".** Denying it (`gateway.nodes.commands.deny`) also removes accessibility/window/browser observation, while a plain `screenshot` still works. Emergency stop therefore *degrades* observation rather than blinding it — useful for a "watch what you did" recovery view, and a reason the hold must be an explicit allowlist rather than "block everything except screenshot".
- A **desktop-scope `screenshot` never reaches the driver as `computer.act`**: `handleDesktopAct` only accepts the 13-name desktop wire set (`driver-result.ts:25` → `v2.slice(1,14)`), so a hand-built `computer.act {action:"screenshot"}` would hit `COMPUTER_UNSUPPORTED_ACTION`. Direct RPC clients must call `screen.snapshot` for capture (`docs/nodes/computer-use.md:269`, `:265`).

## 2. Dispatch order inside the provider (what a raw caller must get right)

`handleWindowAct` (`extensions/cua-computer/src/window-actions.ts:186-215`) resolves in this order `[CODE]`:

1. action ∈ **targeted set** (11 names) **and** `windowRef`/`elementRef` present → window/element native tool (delivery mode honoured here only).
2. else action ∈ **desktop wire set** (13 names) → `handleDesktopAct` (foreground desktop injection; `deliveryMode` explicitly *not* sent, and the result says `deliveryModeApplicable:false`).
3. else → recording family (`get_recording_state`, `start_recording`, `stop_recording`, `replay_trajectory`).
4. else → browser family (`get_browser_state`, `browser_*`).
5. else → discovery/window family (`list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `launch_app`, `kill_app`, `bring_to_front`, `set_value`, `invoke_menu`, `zoom`, `escalate_scope`).

Targeted set = `left_click, right_click, middle_click, double_click, triple_click, left_click_drag, left_mouse_down, left_mouse_up, scroll, type, key`
Desktop wire set = `left_click, right_click, middle_click, double_click, triple_click, mouse_move, left_click_drag, left_mouse_down, left_mouse_up, scroll, type, key, hold_key`

## 3. Windows (win32) advertised set — **36 names**

`platformActions('win32')` = the 40 v2 names minus **`hold_key`, `left_mouse_down`, `left_mouse_up`, `wait`** (`driver-result.ts:91-98`). Same set on darwin, because that filter only special-cases Linux — **do not read the darwin row as a Peekaboo claim**; Peekaboo is a different provider with a different descriptor.

| Group | Windows names |
|---|---|
| Capture/pacing | `screenshot` *(via `screen.snapshot`)*, `wait` *(tool layer only, never native)* |
| Pointer (desktop or window/element target) | `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` |
| Keyboard | `type`, `key` |
| Scroll | `scroll` |
| Discovery / window / element | `list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `launch_app`, `kill_app`, `bring_to_front`, `set_value`, `zoom`, `invoke_menu`, `escalate_scope` |
| Browser family | `get_browser_state`, `browser_prepare`, `browser_navigate`, `browser_click`, `browser_type`, `browser_dialog`, `browser_set_input_files`, `browser_download`, `browser_pointer` |
| Recording family | `get_recording_state`, `start_recording`, `stop_recording`, `replay_trajectory` |

Excluded vs Linux: `left_mouse_down`, `left_mouse_up` (Linux-only, and there only as **background window pixel** targets with `windowRef` + image-bearing `observationId`).

**Two names are advertised but conditionally hidden at the tool layer** `[CODE computer-tool-schema.ts:21-41]`:
`browser_set_input_files`, `browser_download`, `get_recording_state`, `start_recording`, `stop_recording`, `replay_trajectory` are dropped unless the execution has a cleanup owner. On the MCP tool path recording and file-transfer actions are unavailable entirely (`docs/nodes/computer-use.md:76`).

**One name is tool-layer-only and always fails on our topology:** `take_control` is added to the enum when `screenshot` is available (`computer-tool-schema.ts:84`) but throws `take_control is only available for an attached or session desktop` for `target:"gateway"` and `target:"node"` (`computer-tool-node.ts:363-369`). Keep it out of Zero's action vocabulary until D-009's hold exists.

## 4. Names that survive the list but still get refused at runtime (Windows)

DeepSeek: these are the codes your audit/budget rows will actually see. All `[CODE]`, none live-verified.

| Trigger | Code |
|---|---|
| `modifiers` set on a click/scroll/drag desktop action | `COMPUTER_UNSUPPORTED_ACTION` (`commands.ts:201-206,280-284`) |
| `key` value that is a digit or punctuation char | `COMPUTER_UNSUPPORTED_KEY` (`actions.ts:98-105`) — driver drops layout shift state; route via `type` |
| `screenIndex !== 0`, or non-primary `windowRef` geometry mismatch | `COMPUTER_UNSUPPORTED_DISPLAY` (`commands.ts:103-109,487`) |
| reported screen geometry ≠ screenshot geometry (DPI scaling) | `COMPUTER_UNSUPPORTED_DISPLAY` (`commands.ts:498-506`) |
| coordinates outside the delivered frame | `COMPUTER_INVALID_REQUEST` (`actions.ts:128-132`) |
| stale / foreign `displayFrameId`, driver reconnect | `COMPUTER_STALE_FRAME` (`commands.ts:222-227`, `frame.ts`) |
| stale window/browser observation, navigation, or driver generation | `COMPUTER_STALE_OBSERVATION` (`action-targets.ts:44-48,99-107`) |
| driver refusal, structured | `COMPUTER_REFUSED_<code>` e.g. `background_unavailable`, `background_occluded`, `foreground_unavailable` (`commands.ts:111-119`) |
| SDK/package/digest/version problems at startup | `COMPUTER_DRIVER_PACKAGE_MISSING`, `COMPUTER_DRIVER_VERSION_MISMATCH`, `COMPUTER_DRIVER_DIGEST_MISMATCH`, `COMPUTER_DRIVER_PLATFORM_UNSUPPORTED`, `COMPUTER_DRIVER_UNAVAILABLE` (`docs/nodes/computer-use.md:319-334`) |
| contract/descriptor disagreement | `COMPUTER_CONTRACT_MISMATCH` (`computer-use-contract.ts:57`) |

Caps worth mirroring in any Zero-side budget: `scrollAmount` schema max 100 but **driver cap 50**, default 3 (`commands.ts:302`); drag `durationMs` clamped to **10 s** (`commands.ts:343-345`); `wait` duration bounded by `MAX_WAIT_SECONDS`; discovery results truncated at **500** items, browser elements at **2 000** (`driver-result.ts:86-87`); delivered frame default `jpeg`, `maxWidth 1600`, quality `0.72` (`commands.ts:489-491`); native capture input-pixel ceiling **40 M** (8K primaries survive) (`commands.ts:46-49`).

## 5. The hold allowlist DeepSeek and OpenCode asked about

The D-009 human-hold must keep **observation** available and refuse **input** — refuse, never queue. Derived from upstream's own classification seam (`extensions/cua-computer/src/node-invoke-policy.ts:17-35`) `[CODE]`:

- **Allow while a human holds control** (8 observation names): `screenshot`, `list_apps`, `list_windows`, `get_accessibility_tree`, `get_cursor_position`, `get_window_state`, `zoom`, `get_browser_state`, plus `wait`. (Reads on `screen.snapshot` are unaffected by a tool-layer hold anyway.)
- **Refuse while held**: every pointer/keyboard/scroll action, the window/element mutation set (`launch_app`, `kill_app`, `bring_to_front`, `set_value`, `invoke_menu`, `escalate_scope`), the browser action set, and the recording family.
- **Reason code:** `computer-hold:human-control` (OpenCode's §11 name — adopted, see the [hold contract](takeover-hold-contract.md)). Do **not** rely on the default, because upstream normalises a missing reason to `blocked by <policyId>` (`src/plugins/trusted-tool-policy.ts:138-140`).
- **High-risk families for budgets/audit** (unchanged from upstream): `kill_app`→`process_termination`, `browser_navigate`, `browser_download`, `browser_set_input_files`, `start_recording`, `replay_trajectory`, `escalate_scope`.

## 6. Open items, recorded rather than waited on

1. `[needs GO]` Confirm against a live node descriptor that the advertised set is exactly these 36 (`nodes pending`/`computerUse` descriptor read; CU-01 step S5).
2. `[needs live proof]` Whether `get_window_state`'s background delivery actually succeeds on Windows or always returns `COMPUTER_REFUSED_background_unavailable`. CU-01 S3 is designed to answer this; the code comments imply foreground-only desktop input, and window-targeted background delivery is driver-internal, which is exactly the kind of docs-vs-behaviour gap CU-00 warned about.
3. `[unresolved, DeepSeek's lane]` Whether any Zero action names should be *denied outright* rather than merely hidden (my recommendation: `escalate_scope` and `kill_app` stay denied-by-default for the Operator agent; `start_recording`/`replay_trajectory` stay off until CU-03 has an audit store).
4. `[not covered here]` The macOS Peekaboo provider's action set — irrelevant to Zero's Windows environment; do not reuse this table for it.
