# Windows source setup

Run `zero-setup.cmd` from a checked-out source tree on Windows x64 with Node.js24.11 or later and npm available. The script uses pnpm11.25.0 if already installed; otherwise it runs that exact version through npm exec without global installation. Network access is needed for uncached packages and the pinned primary desktop runtime.

Setup installs backend and standalone UI dependencies from frozen lockfiles with lifecycle scripts disabled, builds the existing UI, and provisions the checksum-pinned agent-desktop runtime. Each run records a separate `artifacts/setup/<run>/report.json`, including failures. Setup never establishes functional or production acceptance merely from installed assets.

An existing custom pnpm cache can be selected with `-StoreDirectory <path>`; setup does not change global package-manager configuration. `-UseNpmBootstrap` exercises the pinned npm-exec path even if the exact pnpm version is already available.

Launch `zero-host.cmd` afterward. The default native host uses18789; an already running owner host must not be replaced by a test. For an isolated test, set `ZERO_PORT` to an unused local port and use a separate source/data directory.

`zero-setup.cmd -WithOfflineSpeech` additionally downloads pinned Whisper CPU assets. It preserves the selected voice engine. Explicit host selection uses `ZERO_VOICE_RECOGNITION_BACKEND=whisper`; see [speech evidence and remaining gates](WHISPER-STT-PREPARATION.md). Optional local chat/vision models have separate pinned installers under `scripts/`; setup does not overwrite model assignments, credentials, preferences or existing user state.

The standalone UI workspace intentionally does not auto-install its OpenClaw peer. Building the browser contribution does not require the host package; using its legacy OpenClaw plugin entry still requires a compatible peer supplied by that environment. The native host has its own declared/pinned OpenClaw dependency in backend.

The child workspace boundary follows [pnpm workspace settings](https://pnpm.io/settings#packages); the actual11.25.0 install/build was verified separately from the parent app workspace.

Fresh-directory verification on the existing Windows PC uses an archive outside the owner repository, cleared Node search/preload environment, installed package origin checks, a real native bootstrap, actual browser input and disk-persisted Skill toggles, and actual native desktop field/button effects. The shared package cache and installed Node/Chrome are prerequisites: this is not clean-machine installation, uninstall, upgrade/rollback or independent release certification. Those gates remain open in [current acceptance](verification/CURRENT-ACCEPTANCE.md).

See [actual fresh-source evidence](verification/2026-11-10/fresh-windows-source-setup.json): both setup paths, actual UI and stopped/new-process state persistence, two real desktop tests, twelve Skill/restore checks, and byte comparisons of selected user-file fixtures. A deliberately mismatched manifest produced a nonzero setup exit and retained FAIL receipt; original failed installation attempts were not converted into PASS.
