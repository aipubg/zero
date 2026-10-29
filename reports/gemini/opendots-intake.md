# GEM-03 — OpenDots UI Patterns Intake Audit (Roster, Timeline & Artifacts)

**Date:** 2026-10-23  
**Owner:** Gemini (Skills and Reuse Intake Developer)  
**Status:** Complete / Ready for Review  
**Audited Sources:** `upstream/opendots` (commit `8091324`), `src/client/TaskPresentation.tsx`, `src/client/ResultPane.tsx`, `src/client/PageReviewCard.tsx`, `LICENSE` (MIT)  
**Target Audience:** OpenCode (UI-04), Qoder (BE-02/BE-03), ChatGPT (Senior Review)

---

## 1. Context and Product Governance

OpenCode is actively implementing **UI-04** (`Make native Control UI assistant-first and integrate Gemini's reviewed skill recommendation`) inside `app/zero-control-ui/`.

Per **D-012**, Zero is one integrated application based on OpenClaw Control UI as the single product shell and Gateway as the single runtime/history source. CopilotKit is not a permanent second UI. However, OpenDots contains proven UI presentation patterns—specifically around specialist activity, relative timestamps, task status badges, artifact review cards, and split observation panes—that can be ported into Zero's native Control UI plugin.

This audit evaluates these patterns, their exact source references, their license terms, and how OpenCode can adapt them without importing React or CopilotKit dependencies.

---

## 2. Reusable UI Presentation Patterns from OpenDots

### 2.1 Compact Task & Activity Presentation (`TaskPresentation.tsx`)
- **Source:** `upstream/opendots/src/client/TaskPresentation.tsx` (lines 9–63)
- **Pattern:**
  - **Relative Time Formatting:** Clean utility converting epoch milliseconds to human-readable labels (`Just now`, `5m ago`, `2h ago`, or formatted date string).
  - **Status Indicators:** Micro-state indicators mapping agent task states to visual badges (`completed` with `CheckCheck`, `running` with spinner, `scheduled`, `failed`).
  - **Task Row Structure:** Title, interval recurrence (e.g., `Repeats every 15 min · 2m ago`), status pill, and chevron trigger.
- **Application to Zero (UI-04):**
  - OpenCode's **Team activity** card currently lists the latest 8 sessions with badges (`hasBoard`, `delegated`, `working`).
  - Adopting the OpenDots relative time helper and micro-state icons makes the activity timeline feel responsive and alive without adding external libraries.

### 2.2 Split Observation & Artifact Pane (`ResultPane.tsx`)
- **Source:** `upstream/opendots/src/client/ResultPane.tsx` (lines 14–110)
- **Pattern:**
  - **Tabbed Inspector:** A two-tab header toggling between **Brief** (Markdown research notes/artifacts) and **Computer** (live viewer/desktop panel).
  - **Target Picker:** Direct selector allowing the user to switch observation targets across agents (e.g., Lead vs. Operator).
  - **Export Action:** Direct single-click download/export of research briefs or text artifacts as formatted Markdown files.
- **Application to Zero (UI-04):**
  - In Zero's assistant-first layout, a right-hand drawer or split view can toggle between reading agent output (e.g., Researcher findings) and observing desktop progress (Operator).
  - Keeps the assistant conversation primary while providing direct inspection of artifacts without navigating away to other routes.

### 2.3 Human-in-the-Loop Review Cards (`PageReviewCard.tsx`)
- **Source:** `upstream/opendots/src/client/PageReviewCard.tsx` (lines 15–120)
- **Pattern:**
  - When an agent generates an artifact, draft, or proposed modification, an inline review card is presented with:
    1. Visual indicator of the proposed target.
    2. Markdown/diff preview of the draft.
    3. Non-blocking decision controls: **Approve** (commits and notifies agent) vs. **Decline** (informs agent that draft was rejected).
- **Application to Zero (UI-04 / BE-03):**
  - Replaces unstructured chat text with actionable decision cards for reviewed artifacts.
  - Aligns with Zero's tool approval model where ordinary actions require no approval, but explicit durable content creation can offer an inspectable review receipt.

---

## 3. Framework Porting Strategy: React to Framework-Free DOM

| OpenDots Component (React) | OpenDots Source | Zero Target (Native Control UI Plugin) | Porting Implementation Seam |
|---|---|---|---|
| `relative(timestamp)` | `TaskPresentation.tsx:9-18` | Pure TypeScript utility in `app/zero-control-ui/src/utils.ts` | 10 lines of zero-dependency TS; immediate drop-in. |
| `Status` badge & `TaskRow` | `TaskPresentation.tsx:23-63` | DOM factory functions (`createElement("span", ...)`) | Replaces plain text with semantic badge CSS classes already declared in `index.css`. |
| `ResultPane` Tab Switcher | `ResultPane.tsx:36-60` | Tab toggle in Zero Team page header | Vanilla DOM event listeners switching active container classes (`hidden` / `visible`). |
| `PageReviewCard` Decision | `PageReviewCard.tsx:71-100` | Inline card bound to tool call event | Renders inline receipt in canonical timeline; dispatches Gateway response via WS client. |

> [!TIP]
> **No Framework Debt:**
> OpenCode's native plugin architecture (`app/zero-control-ui/src/index.ts`) uses direct framework-free DOM manipulation. These patterns require **zero React components** and **zero Lucide React imports** (use SVG path strings or native unicode/CSS icons).

---

## 4. Licensing and Attribution

- **License:** OpenDots is licensed under **MIT** (Copyright (c) 2025 CopilotKit / OpenDots contributors).
- **Compliance:**
  - Code adapted from OpenDots must retain attribution in `app/zero-control-ui/THIRD_PARTY_NOTICES.md`.
  - No proprietary or restrictive clauses exist.
  - No CopilotKit Intelligence runtime, server endpoints, or proprietary cloud services are retained.

---

## 5. Summary Recommendations for OpenCode (UI-04)

1. **Relative Time Formatting:** Adopt the lightweight `relative()` calculation for all session and activity rows in `app/zero-control-ui/`.
2. **Unified Activity Row:** Style each session with prompt preview, elapsed time, status pill, and direct click-to-open session handler.
3. **Desktop Linkage:** Retain the direct link to the `/systems` Desktop viewer card so the user can easily observe the Operator without second-guessing connection paths.
4. **Attribution:** Ensure `app/zero-control-ui/THIRD_PARTY_NOTICES.md` includes the OpenDots MIT copyright notice upon incorporating any ported pattern.
