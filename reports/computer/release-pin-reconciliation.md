# CU-02 — Release-pin reconciliation (checkout `0132405` vs installed `fe06181`)

**Owner:** Qoder · **Written:** 2026-10-23 · **Scope:** read-only inspection of files DeepSeek's approved install already put on disk. **I installed, built, launched, connected, or controlled nothing.** No key handled, no commit made.
**Why this exists:** the senior's BUILD WINDOW A entry records that the installed npm artifact is `openclaw@2026.10.6` built from **`fe06181dc5ecc01cf8904abbfc26925925efefbc`** (matching the official `v2026.10.6` tag), while `upstream/openclaw` sits at **`013240515205573248c27ab6b8eec7303f0da1a8`**. **Every number in my CU-00/CU-02 lane was derived from the checkout, not the release.** A live CU-01 run compares its descriptor against my derived expectation, so an unverified pin mismatch would have turned a bookkeeping difference into a fake "driver mismatch" finding on run day.

## 1. What I checked, and the result

| Claim in my lane | Derived from checkout `0132405` | Installed release `fe06181` | Verdict |
|---|---|---|---|
| v2 action contract | 40 names, `computer-use-contract.ts:8-49` | 40 names, **exact same order** (`dist/computer-use-contract-Ctek0XlQ.mjs`) | **MATCH — byte-for-byte on the name list.** My advertised count of 36 on win32 stands. |
| Windows action filter | `platformActions()` drops `hold_key`, `wait`, and `left_mouse_down/up` off Linux (`driver-result.ts:91-98`) | Release composes `CUA_COMMON_ACTION_NAMES` (38) then filters via `platformActions` at `dist/extensions/cua-computer/index.js:21435`, dropping only `left_mouse_down/up` off Linux | **HOLDS, and now executed rather than inferred.** Rebuilding the release list from its own code and running its filter yields **36 on win32 — the identical set** to my derivation (`release-only: []`, `mine-only: []`). The two trees build the list by *different* composition, so the match is a real cross-check rather than a tautology. |
| **Driver SDK version** | `@trycua/cua-driver` **0.34.1** (`extensions/cua-computer/package.json:12`) | **0.32.0** (`dist/extensions/cua-computer/package.json`, and `.pnpm/@trycua+cua-driver@0.32.0`) | **MISMATCH — my published number is wrong for the runtime.** Corrected everywhere it matters. |
| **win32-x64 pinned digests** | `cua_driver_sdk.dll 8b2ebd4e…`, `cua_driver_node_runtime.node 82ae6bc0…` | `cua_driver_sdk.dll 8d4ffbc583341d0bd5ea621e4577a3fe3aa286c3fcf04590c6f598d30b6a1919`, `cua_driver_node_runtime.node 48d75442de05ae674acf81342278585ef14724a7992b9a09d900e4e03d2c5a80` | **MISMATCH — expected, since they belong to different driver versions.** The release's own manifest is the authority for G-C. |
| **G-C doctor outcome** | untestable at the time | I hashed the files actually on disk: **both MATCH the release manifest** (`26,842,960 B` dll, `633,160 B` node runtime) | **PREDICTED PASS.** The artifact-integrity gate should print `no findings`. This is the strongest de-risking in this document: the likeliest G-C failure mode is now ruled out **without executing anything**. |
| **Driver footprint** | ~26.6 MiB (registry `unpackedSize` for **0.34.1**) + 0.94 MB JS | **measured on disk:** native package dir `27,477,129 B`; JS `936,709 B`; combined **28,413,838 B (~27.1 MiB)** | Estimate was right in magnitude, wrong in source. Now `[MEASURED]`. |
| `@openclaw/fs-safe` | plugin declares **0.26.8** | installed **0.25.0** (+ `fs-safe-win32-x64-msvc@0.25.0`) | **MISMATCH (minor).** Recording it so nobody cites 0.26.8 as the running version. |
| `rastermill` | 0.4.0 | 0.4.0 | **MATCH.** |
| License posture | win32 native `MIT AND MPL-2.0`; I flagged that OpenClaw's `THIRD_PARTY_NOTICES.md` omits CUA as an **unresolved compliance gap** | 0.32.0 is also **`MIT AND MPL-2.0`**, and the package **ships `node-runtime-NOTICE.md`**: the `.node` file is a compatibility build from `uniffi-bindgen-react-native` 0.31.0-3 under MPL-2.0, with the source pinned to the matching Cua release tag | **GAP NARROWS, materially.** The notice obligation is satisfied *inside the artifact*; only OpenClaw's own aggregate notices file omits it. For a private local build this is benign; for distribution the obligation is file-level on the driver's own MPL sources, which we do not modify. |
| Takeover gap | `take_control is only available for an attached or session desktop` (`computer-tool-node.ts:363-369`) | identical string in `dist/computer-tool-BYo9lKTd.mjs` | **HOLDS on the release.** The CU-01 S11 expectation is unchanged. |
| Authorization ceilings | session TTL 3600 s, idle 300 s, `Unrestricted`, `createConfigured` | `maxSessionTtlSeconds: 3600n`, `maxIdleTtlSeconds: 300n` present in the installed plugin bundle | **HOLDS.** |
| Windows limitation text | cited `computer-use.md:242` (primary display, held input, modifiers, key restrictions) | same sentences present at installed **`:238`**, plus identical error-code rows `:318-319` | **HOLDS; line numbers shift.** My citations are checkout-relative — see §2. |
| Install-schedule inputs | estimates only | `E:` free **427,528,032,256 B (~398 GiB)**; OpenClaw `--version` → `2026.10.6 (fe06181)`; plugin API floor `>=2026.10.6` | **No disk constraint** for my ~27 MiB delta. |

## 2. The rule I am adopting about citations

My lane's file:line references are **checkout-relative** (`0132405`), because that is the tree I was given read-only access to and the only one with full source (the npm artifact ships built `dist/`, not TypeScript sources). Where a claim is load-bearing for a live check, I now cite the **installed artifact as the authority** and the checkout as the derivation. Concretely, at G-C/G-E I compare against:

- driver version and pinned digests → `backend/node_modules/openclaw/dist/extensions/cua-computer/package.json` (**0.32.0**, digests above), **not** the 0.34.1 record in my CU-00 inventory;
- advertised action set → the release name list (identical to my 40), with the expectation **36 on win32**;
- docs wording → installed `docs/nodes/computer-use.md:238,318-319`.

## 3. What this changes in the plan

1. **G-C is now a confirmation, not an experiment.** Hash match already verified offline. I still run the focused doctor check at GO time, because the *host's* own check is the thing that gates the provider — my hashing proves the inputs, not the code path.
2. **No scope change for CU-01.** Driver 0.32.0 vs 0.34.1 could still differ in *behaviour* (background window delivery, DPI reporting, `key` handling), which the source diff cannot settle. Every Windows limitation in §5 of the CU-00 inventory was code-verified in the checkout, and the checkout's own list matches the release exactly, but behaviour lives in the closed native `.dll`. That keeps risk item A5 (`get_window_state` background delivery) and the DPI equality assertion firmly in `[needs live proof]`.
3. **One new risk added:** the checkout is **ahead of** the release (it contains extra doc paragraphs about hosted agent turns, `cursorX/cursorY` receipt fields, Peekaboo self-window omission, and macOS approval-panel hiding that the release docs lack). So a future "it works in `upstream/`" reading is not evidence about the running build. Anything I re-derive must state which tree it came from. This is the computer-lane mirror of the backend contract check the senior asked DeepSeek to do.
4. **The 0.34.1 numbers stay in the CU-00 inventory**, unedited, with a dated addendum pointing here — I do not silently rewrite an accepted artifact.

## 4. Reproduce this

```bash
# read-only; no install, no execution of anything OpenClaw
node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("backend/node_modules/openclaw/dist/extensions/cua-computer/package.json","utf8"));console.log(p.dependencies["@trycua/cua-driver"],JSON.stringify(p.cuaDriverArtifacts["win32-x64-msvc"]))'
# hash the native artifacts actually on disk
# (see §1: both matched the release manifest; 26,842,960 B + 633,160 B)
node computer/tools/derive-windows-actions.mjs   # checkout-pinned derivation, 9/9 self-checks
diff backend/node_modules/openclaw/docs/nodes/computer-use.md upstream/openclaw/docs/nodes/computer-use.md
```

**Bottom line:** my action taxonomy, takeover-gap, ceilings and license findings survive the pin change; my driver **version, digests and footprint numbers did not** and are corrected above. The likeliest G-C failure mode is ruled out before the window opens.
