# Zero Provider Manager — Roadmap

## Decision

Zero keeps one local, loopback-only OpenClaw Gateway. It is the runtime for agents, sessions, memory, tools and the native Control UI. The current fixed `zero-gw` model route will be retired only after a replacement provider is validated and activated.

The new Provider Manager is a native Zero Control UI page plus a small Gateway-side management extension. It configures OpenClaw `models.providers`; it is not a second gateway, model proxy, chat UI, transcript store or provider marketplace.

### Owner UX direction — 2026-10-23

Use the **Kilo Code VS Code extension** (not Kimi Desktop) as the reference. The provider workflow
belongs inside Zero's existing OpenClaw-themed Models experience. Present a Kilo-style provider
list/editor and model discovery there, while retaining useful OpenClaw model controls: model
selection starts at Auto where supported, Utility Model starts at Auto, fallback remains available,
Thinking stays Default, and Fast Mode stays Default. Do not remove the Gateway health/connection
page or OpenClaw runtime files. The legacy fixed `zero-gw` provider is removed from active config
only after a replacement route has passed activation and rollback checks.

The existing upstream Models screen is not edited in `upstream/`. OpenCode must first establish
which provider controls can be composed into the Zero native plugin page with supported page/
navigation contributions. The product must show one coherent Models workflow; if an upstream
screen cannot be hidden through a supported contribution seam, document that limit and propose the
smallest native navigation change for review instead of silently creating two competing provider
managers.

## User workflow

1. **Providers** lists custom providers with display name, protocol, endpoint host, state, selected models and last validation result.
2. **Add provider** collects provider ID, display name, adapter, base URL, API key or headers, and timeout. IDs accept lowercase letters, digits, `_` and `-`.
3. **Discover models** calls `GET <baseUrl>/models` through the trusted Gateway-side extension. The browser never calls an upstream endpoint or receives the key. It supplies search, select-all, deselect-all and manual IDs.
4. **Describe models** records exact model ID, display name, image input, tools, reasoning, context/output limits and only capabilities that have been verified.
5. **Test** makes a minimal upstream health/model request without changing Zero's active route.
6. **Activate** previews role-to-model bindings, uses a partial Gateway config patch, checks a fresh route, then marks the provider active. A failed activation restores the previous bindings.
7. **Edit, disable, delete** retain audit data. An active provider cannot be deleted until its roles are moved to another valid model.

## Credentials

The UI accepts an API key like Kilo, but it is write-only. The Gateway stores it in protected native secret storage and writes only a SecretRef in `models.providers.<id>`. Lists, edit responses, logs, config diffs and exports show no key; edit shows only “configured”, replace, or remove. Environment SecretRefs remain supported for externally managed providers.

## Provider data model

```text
Provider: id, displayName, adapter, baseUrl, authMode, secretRef, headersRef,
          timeoutSeconds, enabled, createdAt, updatedAt
Model:    providerId, id, displayName, input modalities, contextWindow, maxTokens,
          tools/reasoning capability, compatibility state, selected
Binding:  agentId -> providerId/modelId, activationRevision, lastProbe
```

First release adapters: `openai-completions`, `openai-responses`, `anthropic-messages`, and `ollama`. Other adapters require a passing request/stream/tool probe.

## Delivery phases

### PM-00 — Gateway provider contract and migration

Qoder inventories current `zero-gw` bindings and defines native RPC for list/create/update/test/discover/activate/disable/delete. It validates IDs/URLs, stores credentials as protected secret references, applies safe partial config patches and rolls back failed activation. `zero-gw` remains live during this phase.

**Pass:** current route remains live; no key appears in config/log/list response; an OpenAI-compatible discovery/test works; failed test does not alter live bindings.

### PM-01 — Native Models and Providers experience

OpenCode integrates Kilo's provider workflow into the existing Zero native Control UI and its
OpenClaw theme. It ports Kilo's useful interaction: add/edit dialog, saved-key masking, debounced
discovery, stale-response cancellation, manual entry, model search/multi-select and provider
edit/delete. Keep Auto model selection, Auto utility model, fallback, Default thinking and Default
fast mode. Use only PM-00/native Gateway RPCs; no direct browser-to-provider request and no second
UI. Do not modify upstream files.

**Pass:** create/edit/disable/delete/activate work through native RPC and tests show browser state has no key.

### PM-02 — Multiple providers and model policy

Several providers can be configured and Lead/Researcher/Operator can receive explicit models. Model discovery never grants models to an agent automatically. Text, stream, tool and image tests decide whether a model may be assigned to Operator.

**Pass:** role switching is isolated; rejected tool/vision test blocks that label; rollback restores a working binding.

### PM-03 — Existing local-server mode

Connect first to an existing local Ollama, LM Studio, llama.cpp, vLLM or SGLang OpenAI-compatible endpoint. Reuse the provider form. Make private-network access explicit where required.

**Pass:** a loopback local model works without installing a managed runtime or downloading model weights.

## Source reuse

Kilo is an interaction/source reference, not a wholesale merge because its webview is React and Zero's product UI is native Control UI. If code is copied, add Kilo's MIT notice in `app/zero-control-ui/THIRD_PARTY_NOTICES.md`.

- Kilo dialog: debounced fetch, stale response cancellation, manual fallback, model search/select, safe edit.
- Kilo provider tab: provider list, edit and disconnect/delete interaction.

## Evidence from the screenshots

The screenshot flow matches Kilo's documented form: ID/name, API type, base URL, optional key/headers, model discovery and an editable provider. The NVIDIA list showing 84 models only proves `/v1/models` discovery; each selected model still needs tool and image compatibility tests before Zero uses it for agents or desktop work.

## Primary sources

- [Kilo custom-provider/model workflow](https://github.com/Kilo-Org/kilocode/blob/main/packages/kilo-docs/pages/code-with-ai/agents/custom-models.md)
- [Kilo CustomProviderDialog source](https://github.com/Kilo-Org/kilocode/blob/main/packages/kilo-vscode/webview-ui/src/components/settings/CustomProviderDialog.tsx)
- [Kilo ProvidersTab source](https://github.com/Kilo-Org/kilocode/blob/main/packages/kilo-vscode/webview-ui/src/components/settings/ProvidersTab.tsx)
- [OpenClaw custom providers](https://docs.openclaw.ai/gateway/config-tools/custom-providers)
- [OpenClaw local/custom runtime guide](https://docs.openclaw.ai/concepts/model-providers/custom-providers)
