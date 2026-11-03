# Native Windows runtime

Install the pinned backend lockfile with `pnpm install --frozen-lockfile --ignore-scripts`.
The Windows platform packages are optional for cross-platform installation, but
are required for their corresponding Windows features. An installation that omits
optional dependencies does not establish that native capture or local inference
is available.

The GGUF service uses node-llama-cpp 3.22.2 and the Windows x64 prebuilt package.
It selects installed prebuilt GPU support when available, with CPU fallback and a
two-thread budget. It does not compile a missing native runtime during a user task.
The selected CPU model has been tested; this does not certify GPU backends or all
GGUF architectures.

Do dependency maintenance outside native endurance runs. Windows can lock a loaded
DLL; a failed reinstall must not be treated as success or resolved by terminating
an unrelated running task. Verify fresh-process capture and inference afterward.

`node --test test/local-gguf-runtime-real.test.mjs` tests the existing pinned
SmolVLM file, real model load/token generation, prior chat-history preservation,
manifest persistence and unload. It never deletes the original source.
`node scripts/functional-browser-check.mjs --gguf --gguf-runtime` adds actual
Models UI load/self-test/unload, metadata edits, removal and restart checks.

Self-test rates use generated token IDs and include loading/prompt evaluation in
the measured interval. A successful short generation does not prove semantic
readiness, tool use, image understanding or arbitrary model compatibility. The
selected model can trigger the library's chat-template fallback; that warning is
not a certification of its original template. Native ModelFabric chat assignment,
full local chat responses and HF download acceptance remain separate work.
