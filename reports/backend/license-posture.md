# Backend license posture — what Zero must keep if it ships OpenClaw

**Ticket:** BE-01/BE-02 supporting work (no ticket of its own; MASTER_PLAN §9 obligation)
**Owner:** DeepSeek Harness
**Date:** 23 October 2026, 04:20 Asia/Calcutta
**Scope:** the backend runtime we intend to install (`openclaw@2026.10.6`, pin `0132405`), its declared notices, and the one native package already identified for the Windows computer route.
**Method:** read-only inspection of the pinned checkout. No install, so **transitive dependency licenses are NOT enumerated here** — that requires the installed tree (§5).

---

## 1. Why this exists

MASTER_PLAN §9: "Code reuse requires preserving the relevant license, copyright, NOTICE, third-party license, and any file-level license obligations. Check the exact source file and dependency, not just the repository's main license."

Zero is private and single-user today. **The obligations change the moment Zero is distributed** (shared binary, published installer, hosted service). Recording the posture now is cheap; reconstructing it later is not.

---

## 2. The base license

| Item | Value | Evidence |
|---|---|---|
| Package | `openclaw` 2026.10.6 | `upstream/openclaw/package.json:3` |
| Declared license | **MIT** | `package.json:28` |
| Copyright line | `Copyright (c) 2026 OpenClaw Foundation` | `upstream/openclaw/LICENSE:3` |
| License file size | 1,076 bytes (standard MIT text) | file inspection |

**Obligation:** MIT requires the copyright notice and permission notice be included in all copies or substantial portions. If Zero ships a bundled runtime, `LICENSE` must travel with it and a NOTICE must credit OpenClaw Foundation.

---

## 3. Upstream's own third-party notices (4 entries, all permissive)

`upstream/openclaw/THIRD_PARTY_NOTICES.md` (111 lines) records code *incorporated into the source*, beyond package-manager metadata:

| Component | License | Relevance to Zero |
|---|---|---|
| SQLite | Public domain | Only macOS standalone builds compile it (`:9-16`). Not our Windows path |
| Pi / pi-mono (`@earendil-works/pi-*`) | MIT, © 2025 Mario Zechner | Portions adapted into OpenClaw + a runtime dependency (`:18-30`) |
| GitHub Octicons | MIT, © 2026 GitHub Inc | Two icon paths in the Control UI (`:50-56`). Only matters if we ship the Control UI |
| **Hermes Agent** | MIT, © 2025 Nous Research | OpenClaw's repetition guard adapts Hermes code — pinned to a specific commit (`:80-90`) |

Two things worth noting:

1. **Hermes is already inside OpenClaw.** MASTER_PLAN lists Hermes as a "reference only" project and warns against adding a second runtime. The evidence shows a small, attributed, MIT-licensed adaptation already exists upstream — so "reuse Hermes ideas" is partly already done, and we must not re-import the same logic.
2. **SQLite is public domain, but the runtime uses SQLite heavily** (state, sessions, plugin state). No notice obligation; listed for completeness.

---

## 4. The gap: the Windows computer route is not covered

`THIRD_PARTY_NOTICES.md` **does not mention CUA or any `@trycua/*` package at all**.

Qoder's CU-00 inventory established from npm registry metadata (read-only, no download) that the Windows path pulls:

| Package | Version | License | Size |
|---|---|---|---|
| `@trycua/cua-driver` | 0.34.1 | MIT | ~960 KB unpacked |
| `@trycua/cua-driver-win32-x64-msvc` | 0.34.1 | **"MIT AND MPL-2.0"** | ~27.9 MB (~26.6 MiB) |

**This is the one real compliance item in the backend/runtime scope.** The native package carries an MPL-2.0 component. MPL-2.0 is *file-level* copyleft: using it unmodified and merely aggregating it imposes no source-disclosure on Zero's own code, but distribution requires (a) making the MPL-covered source available, (b) keeping notices, and (c) not relicensing those files. For a private local install none of this triggers; for a shipped installer it does.

**Action:** before any Windows computer-use package is distributed, capture that package's own LICENSE/NOTICE into Zero's NOTICE bundle and confirm the MPL file list. Qoder's report is the source of record; this note only flags the obligation.

---

## 5. What is deliberately not covered here

| Not covered | Why | How to close it |
|---|---|---|
| Transitive npm dependency licenses (~1,859 packages) | Requires the installed tree; `pnpm-lock.yaml` lists versions but not license fields | After install: `pnpm licenses list --json` in `E:\zero\backend`, store the output as the license inventory |
| Bundled `extensions/*` (101 names, 3 checked out) | Their source is not in the sparse checkout; each may have its own license | Read each `openclaw.plugin.json`/`package.json` license when a plugin is first enabled; we plan to enable very few |
| OpenDots / CopilotKit / OpenMausBot | UI and reference lanes, OpenCode's and Qoder's reports | Not backend scope |
| Model weights | Never downloaded (MASTER_PLAN §7) | n/a |
| Gateway/provider terms of service | Not a license question; owner's responsibility | n/a |

---

## 6. Concrete obligations, in the order they bite

1. **Now (private local use):** keep `THIRD_PARTY_NOTICES.md` and `LICENSE` in the pinned checkout; do not delete or rewrite them. **Done — the checkout is read-only.**
2. **When Zero bundles the runtime:** ship OpenClaw's MIT text + copyright, and a Zero `NOTICE` listing OpenClaw Foundation, the four upstream notices, and the CUA native package (§4).
3. **If Zero ships an installer or a hosted build:** add the MPL-2.0 source-availability step for the CUA native package, and generate the transitive license inventory (§5) as a release gate.
4. **Never:** strip upstream headers, relicense upstream files, or present OpenClaw's code as Zero's own (PROJECT_MEMORY: "no OpenAI/OpenClaw/OpenDots branding in the product").

---

## 7. Limitations

- Transitive licenses are unenumerated until an install exists. Treat §2-§4 as complete for the *source* we read and incomplete for the *runtime* we would run.
- The CUA license detail is second-hand from Qoder's registry-metadata read (`reports/computer/windows-cua-inventory.md`); I did not fetch it myself.
- No legal review has been performed. This is an engineering inventory, not counsel.

**Files:** created `reports/backend/license-posture.md`. No upstream file modified; no other owner's file touched.
