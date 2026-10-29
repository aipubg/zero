# ZERO AI — Source Download Inventory

**Captured:** 23 October 2026 · **Workspace:** `E:\zero`  
**Method:** shallow (`--depth 1`) and filtered (`--filter=blob:none`) Git clones; selected sparse paths only. No dependencies, model weights, containers, or runtime services installed.

> **Second OpenMausBot tree (2026-10-26):** `upstream/OpenMausBot-main` is a separate, later snapshot:
> package `0.1.127`, **no `.git` metadata**, 5,111 files / 150,508,407 bytes, deterministic tree
> SHA-256 `f0e8df3757811e4254b51589b020ed6a5b23a9acacbb495919b414f6c3c25b62`. It is **not** the
> `0.1.123` / `d393b7a…` checkout in the table below. See
> `reports/open-mouse-connect-plan.md` §9.1 for the license-scope record. Do not substitute one
> snapshot's audit for the other.

| Repository | Local path | Pinned commit | Checkout scope | Git object pack |
|---|---|---|---|---:|
| OpenClaw | `upstream/openclaw` | `013240515205573248c27ab6b8eec7303f0da1a8` | Gateway/provider/tool/node docs; agents, gateway, skills, plugins, provider runtime; plugin SDK, Gateway client/protocol; CUA/OpenRouter/LiteLLM extensions; UI | 77.97 MiB |
| OpenDots | `upstream/opendots` | `8091324942b86789ed0da7facbee855145d933b0` | docs, React client, server, shared source, computer deployment | 7.90 MiB |
| OpenMausBot | `upstream/openmausbot` | `d393b7a728068cd6b0e9e96fd6997c13b6b10ba6` | docs, selected product component/lib areas, Electron, server reference | 87.27 MiB |
| Hermes Agent | `upstream/hermes-agent` | `6e8adc7a4621399936f764fae9d01d1169489b23` | shallow root files only; runtime/skills source not expanded | 2.06 MiB |
| Qwen-AgentWorld | — | — | Not downloaded; not required for an API-backed personal-assistant MVP | — |

Approximate pack total for downloaded repos: **175.2 MiB**. This excludes checkout files and Git metadata. The checkout is sparse to avoid downloading unused platform apps/full histories; it is still a meaningful source snapshot. Do not expand it or run package installs without a scoped task.

## Toolchain observed

- Git for Windows: `2.53.0.windows.3`
- Node.js: `v24.22.1`
- pnpm currently on PATH: `11.25.0`
- OpenClaw package manifest: version `2026.10.6`, Node `>=24.22.1 <25 || >=26.12.1`, pinned package manager `pnpm@12.15.0`.
- OpenMausBot manifest: version `0.1.123`, Node `>=24`, package manager `pnpm@10.33.0`.
- OpenDots manifest: version `0.1.0`, Node `>=24.0.0`.

The local Node version satisfies OpenClaw's declared Node range. The active pnpm does **not** match OpenClaw's pinned pnpm version. No dependencies were installed; resolve this only if/when a small run/build ticket requires it.

## Notes

- Sparse checkout rules: inspect with `git -C upstream/<repo> sparse-checkout list`.
- Keep these upstream paths read-only. Create Zero-owned code in separate directories after the senior developer accepts the Gate 0 contracts.
- Exact commit pins describe this snapshot on the capture date; verify upstream changes before any later update.
