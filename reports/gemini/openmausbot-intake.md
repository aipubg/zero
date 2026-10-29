# GEM-02 — OpenMausBot Computer-Control and Desktop-Viewer Intake Audit

**Date:** 2026-10-23  
**Owner:** Gemini (Skills and Reuse Intake Developer)  
**Status:** Complete / Ready for Review  
**Audited Sources:** `upstream/openmausbot` (Apache-2.0 core outside `enterprise/`), `server/computer-control.ts`, `server/screen-frame-gate.ts`, `server/desktop-viewer-targets.ts`  
**Target Audience:** Qoder (CU-01 / CU-02), OpenCode (UI-04), ChatGPT (Senior Review)

---

## 1. Context and Objective

With GEM-00 (initial skill candidate intake) and GEM-01 (skill lifecycle & Hermes memory intake) completed, this audit investigates **OpenMausBot** for reusable patterns in:
1. **Human Takeover & Control Arbitration:** Non-blocking in-memory hold mechanics.
2. **Screen Freshness & Frame Deduplication:** Deduplicating unchanged frames and preventing stale input execution.
3. **Licensing & Compliance:** Legal boundaries under Apache-2.0, trademark exclusions, and avoidance of the `enterprise/` directory.

---

## 2. Licensing and Compliance Boundary

1. **Core License:** OpenMausBot core (outside `enterprise/`) is licensed under **Apache-2.0**.
   - Adaptation of patterns or code into Zero requires retaining copyright notices and preserving attribution in `THIRD_PARTY_NOTICES.md`.
2. **`enterprise/` Carve-Out (STRICT AVOIDANCE):**
   - Files within `upstream/openmausbot/enterprise/` are source-available under a proprietary license requiring commercial keys. Zero strictly ignores and avoids all code under `enterprise/`.
3. **Trademarks & Naming:**
   - Section 6 of Apache-2.0 explicitly excludes trademark rights. The names "OpenMausBot", "MausBot", and associated mascots are trademarks of Supamaus Software Private Limited.
   - Zero AI conforms strictly to this constraint: the product is named **Zero AI / Zero**, with its own branding mark and wordmark.

---

## 3. Computer Control & Takeover Architecture (`computer-control.ts`)

OpenMausBot's `ComputerControl` class demonstrates three foundational design principles that Qoder and OpenCode have already begun adapting into Zero:

1. **Strictly In-Memory Persistence:**
   - Holds and leases are intentionally stored in-memory (`private entries = new Map<string, Entry>()`).
   - *Rationale:* A hold that survived a server crash or reboot would brick the computer operator indefinitely. On restart, the system cleanly defaults to `held: false`.
2. **Refused, Never Queued Actions:**
   - While a person holds control, incoming bot actions are rejected immediately with an error rather than buffered.
   - *Rationale:* A queued click or keypress executing after hand-back would land on whatever arbitrary window or input field the user left in the foreground.
3. **Opaque Lease Handshake (`controlLeaseId`):**
   - The acquisition of control returns a unique `controlLeaseId`.
   - The lease ID is deliberately absent from public broadcasts, snapshots, and general client APIs to prevent other processes or agents from spoofing release calls.
4. **Idempotent Take:**
   - Repeated "take" requests while already held return the active snapshot without resetting the `heldSinceMs` start timestamp.

---

## 4. Screen Frame Gating & Freshness (`screen-frame-gate.ts`)

OpenMausBot solves the problem of high-frequency visual polling and redundant processing with a lightweight hashing gate:

```typescript
export function screenFrameHash(png: string): string {
  return createHash("sha256").update(png).digest("hex");
}

export function settledFrameIsNews(shownFrameHash: string | undefined, png: string): boolean {
  return shownFrameHash === undefined || screenFrameHash(png) !== shownFrameHash;
}
```

### Application to Zero (CU-01 & Desktop Panel):
- **Stale Frame Invalidation:** Hand-back from human takeover sets `resumeSnapshotRequired = true`. Any agent action presenting a frame hash captured before the handover timestamp is rejected.
- **Bandwidth & Compute Efficiency:** The human-view viewer can skip re-rendering identical frames when `settledFrameIsNews` returns false.

---

## 5. Summary Matrix for Qoder (CU-01/CU-02) and OpenCode (UI-04)

| Feature / Seam | OpenMausBot Pattern | Zero Target Seam | Implementation Owner |
|---|---|---|---|
| **Human Takeover** | In-memory `ComputerControl` hold + lease ID | `zero-policy` plugin hook via `zero.computer.control` | Qoder (CU-02) |
| **Action Refusal** | Return immediate error; reject queueing | `before_tool_call` plugin hook returns `{ allow: false, reason: "human hold" }` | Qoder (BE-02 / CU-02) |
| **Fresh Capture Gate** | `resumeSnapshotRequired` flag cleared only by new screenshot | Armed on lease release or connection drop; gate verified in `k7-run.mjs` | Qoder & OpenCode |
| **Viewer Link** | Native loopback RFB stream target | Built-in Control UI `/systems` desktop panel over loopback VNC | OpenCode (UI-04) |

---

## 6. Conclusion

Zero's existing computer hold contract (`zero.computer.control`, `stats.releasedByDisconnect`, `resumeSnapshotRequired`) successfully absorbs the best practices of OpenMausBot without introducing external daemons or violating Apache-2.0 trademark boundaries. No code from `enterprise/` is needed.
