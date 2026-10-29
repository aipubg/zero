# Owner Decision Packet — Provider Manager and Computer Lane

**Prepared:** 2026-10-24 08:25 IST / 02:55 UTC · **Evidence refreshed:** 2026-10-24 10:16 IST /
04:46 UTC · **By:** OpenCode · **For:** owner / Senior review
**Status:** PM-01 remains **READY FOR REVIEW**; no self-acceptance is claimed.

This packet contains only the five decisions that still block or limit acceptance. Nothing in this
packet authorizes an agent action by itself. No model route, provider, secret, binding, Gateway, or
desktop state was changed while preparing it. `zero-gw` stays protected and `upstream/` stays
read-only.

## Current evidence in one line each

- **Provider Manager:** source, mock tests, and 23/23 UI tests pass (including generic provider-ID
  derivation, collision safety, and byte-for-byte model-ID preservation on display-name-only edits);
  live `list`/discovery/test are registered and read-only verified; live
  create/update/activate/disable/delete/rollback are **not** exercised. The UI now handles redacted
  `config.get` SecretRefs with a verified-canonical, shared-host-fail-closed guard; end-to-end
  Discover still needs the owner-authorized retry in §5. The final review checklist and safe manual
  steps are in `reports/ui/provider-manager-ui.md` §18.
- **Model capability:** four owner-authorized probes recorded; text and image passed **once** at 64
  tokens, image was mixed at 32, streaming/tools passed every observed run. Not stable verification.
- **Computer:** offline rig 152/152; no designated environment marker; `k7-run.mjs --plan` is
  correctly **BLOCKED**; `cua-computer` is not enabled; no desktop action was taken.
- **Routes:** current live values are recorded drift, not an approved route.

## 1. Intended model routes and `utilityModel`

**Current read-only state**

| Scope | Primary | Fallbacks | `utilityModel` |
|---|---|---|---|
| `agents.defaults` | `zero-gw/nvidia/nemotron-3.5-super-vl-120b-a12b` | `[]` | absent |
| `zero` (Lead) | inherits defaults | inherits defaults | absent |
| `researcher` | inherits defaults | inherits defaults | absent |
| `operator` | `zero-gw/z-ai/glm-5.3-flash` | Nemotron | absent |

**Decision needed.** Confirm the intended primary, fallbacks, and utility model for defaults,
Lead, Researcher, and Operator. For `utilityModel`, choose one intended state:

- **A.** the NVIDIA NIM `z-ai/glm-5.3-flash` ref (the owner's original Lead/Vision/Utility choice),
- **B.** inherit the primary/default route,
- **C.** intentionally absent.

Also state whether Operator should keep GLM primary with a Nemotron fallback, or follow another
route. "No change" is a valid answer and leaves the recorded drift in place.

**Why gated:** route selection is an owner decision, and applying it is a live config mutation.

## 2. Disposable provider authorization, or accept unverified CRUD

**Current state.** Live Provider Manager enumeration, discovery, and test work; live
create/update/activate/disable/delete and rollback are unverified. `zero-gw` must not be used as the
test subject.

Choose one:

- **A. Authorize a bounded live CRUD window.** Name a disposable **non-protected** provider, its
  endpoint/model, whether its credential may be used, and the allowed window. The run would be
  create -> test -> activate -> verify/rollback -> disable -> delete, with evidence captured and no
  change to `zero-gw`.
- **B. Accept "live CRUD/activation unverified"** as the review basis for PM-01, relying on source,
  backend mock tests, and the 23/23 UI suite.

**Why gated:** no disposable provider exists and live config mutation is prohibited without owner
authorization. There is no third, self-authorized option.

## 3. Repeat capability probe, or accept observed-once evidence

**Current state.** Four owner-authorized probes ran 03:40-04:19 IST against NVIDIA NIM
`https://integrate.api.nvidia.com/v1`, model `z-ai/glm-5.3-flash`, through the provider ref
`zero-gw/z-ai/glm-5.3-flash`:

- text: 4/32 tokens = `empty_content`; 64 = **observed pass once**;
- image: 4 = failed, 32 = mixed, 64 = **observed pass once** (27.3 s);
- streaming and tools: passed in every observed run;
- budgets: text/image 64, streaming 4, tools 32.

Choose one:

- **A. Authorize exactly one repeat probe.** Specify endpoint, model, which capabilities (text and
  image, or all four), timeout/budget, and confirm spend. No binding change would be made.
- **B. Accept the observed-once/mixed evidence** as the review basis, keeping text/image labelled
  as unverified and streaming/tools as passed-on-observed-runs.

**Why gated:** a fifth probe needs explicit owner authorization plus the exact safe endpoint/model.
Metadata is not evidence, and capability must not be inferred from a catalogue description.

## 4. Designated isolated Windows environment and O1/O2/O5/O6

**Current state.** No `computer/spike/designated-environment.json` exists; `cua-computer` is not
enabled; `node computer/spike/k7-run.mjs --plan` reports **BLOCKED**; no desktop observe/input/
takeover, trusted-policy live firing, or BE-02 A6/A7 has run.

The owner must supply all of the following:

| # | Decision | Recommendation / note |
|---|---|---|
| **O1** | Which machine is the designated Zero environment: a new VM or a separate Windows test account. | Never the everyday profile (D-003). VM creation/image pull is itself gated. |
| **O2** | Consent and product choice for a loopback-only authenticated VNC/RFB server on that environment. | Required for live view; third-party software plus a service credential. |
| **O5** | CU-01 takeover scope: accept that step S11 is a measured upstream gap, or redirect to the cloud/attached-desktop path. | Recommended: measure the unmodified baseline, record the gap, then prove the hold separately. |
| **O6** | Hold live-test order: before or after CU-01. | Recommended: **after** CU-01, so the baseline and CU-02 delta stay attributable. |

**Required sequence after the decisions**

1. On the designated machine, run the read-only preflight first:
   `powershell -NoProfile -ExecutionPolicy Bypass -File E:\zero\computer\spike\preflight.ps1 -OutFile E:\zero\computer\spike\preflight.json`
   Stop on an unsupported CPU target, more than one display, or effective scaling other than 100%.
2. The **owner** writes `computer/spike/designated-environment.json` with exactly:
   `designated:true`, `designatedBy:"owner"`, `ticket:"CU-01"`, `o1Resolved:true`,
   `holdRecoveryApproved:true`, `environmentLabel:"<role label>"`, `recordedAtUtc:"<ISO-8601 Z>"`.
   An agent must never create or self-designate this marker.
3. Only then: G-C enable `cua-computer`, G-E pair the node, G-F run CU-01, G-G run the hold checks.
   BE-02 A6/A7 and trusted-policy live firing follow CU-01.

**Why gated:** real desktop actions require a designated isolated environment, not the everyday
desktop; the marker and O1/O2/O5/O6 are owner inputs.

## 5. Gateway refresh and one Discover retry

**Current state.** The redacted-SecretRef UI fix is live and tested, but the running Gateway process
(`22876`, started 04:17:18 IST) predates the current provider-manager source (mtime 06:30:30 IST), so
the loaded handler still enforces the older validation message. End-to-end Discover has not been
re-run since the fix.

**New shared-host gate.** The live secret store contains two secret entries authorized for
`integrate.api.nvidia.com`: `ZERO_PROVIDER_NVIDIA_API_KEY` and `ZERO_PROVIDER_ZERO_GW_API_KEY`. The
updated guard now fails closed for `nvidia` because the redacted config cannot prove which entry it
referenced. A UI Discover retry would therefore be blocked before any provider request. A read-only
audit found no active config reference to `ZERO_PROVIDER_ZERO_GW_API_KEY`; `zero-gw` uses an `env`
ref. Resolving this requires an owner-authorized store-metadata change (remove or re-scope
`ZERO_PROVIDER_ZERO_GW_API_KEY`), or an explicit decision to accept that `nvidia` stays blocked.

Choose one:

- **A. Authorize a bounded refresh, the store-metadata resolution, and retry.** Approve a Gateway
  refresh so the current provider-manager source is loaded; approve removal or re-scoping of
  `ZERO_PROVIDER_ZERO_GW_API_KEY` after confirming it is not referenced by `zero-gw`; then run
  exactly one Discover retry for `nvidia` through the updated Control UI, capturing only the
  sanitized result/error and latency.
- **B. Accept end-to-end Discover as unverified and `nvidia` as blocked** for this review, relying on
  the source trace, the shared-host guard, and the 23/23 offline suite. The stale-handler and
  shared-host notes stay recorded.

**Why gated:** a Gateway restart is a live-service action, Discover is a live provider request, and
removing/re-scoping a store entry is a secrets mutation; each needs explicit owner authorization.

## Reply template

```text
1. Routes: defaults=<primary>/<fallbacks>/<utility>; zero=...; researcher=...; operator=...
   utilityModel choice: A (GLM ref) / B (inherit) / C (absent)
2. Provider CRUD: A authorize disposable provider <id> at <endpoint>/<model> for <window>
   OR B accept live CRUD/activation as unverified
3. Capability: A authorize one repeat probe on <endpoint>/<model> for <capabilities>, budget <n>
   OR B accept observed-once/mixed evidence
4. Computer: O1=<environment>; O2=<VNC choice/consent>; O5=<scope>; O6=<order>
   Designation marker: owner will write it / not yet
5. Discover proof: A authorize Gateway refresh + one nvidia Discover retry
   OR B accept end-to-end Discover as unverified
```

Until these are answered, no gated action will be taken and PM-01 stays **READY FOR REVIEW**.
