# Using the current Windows build

Open [Zero](http://127.0.0.1:18789/chat/zero). The local host is running with the current UI and runtime fixes. After a PC restart, run `zero-host.cmd` from the repository, then open the same address. Initial dependency setup uses `zero-setup.cmd`.

This is a usable build on the existing Windows PC, not a complete production certification. Existing owner-mode behavior and user data are preserved. No new permission popup was added. The owner permanently withdrew 24-hour endurance testing; it was not restarted or counted as passing.

The final checkpoint includes 104 UI-package checks, 72 selected core checks, ten actual browser workflows, and a separate actual browser widget/Gateway test. Their scopes differ: supplied DOM checks are not browser acceptance, and skipped scenarios are not PASS.

Cleanup removed 186 obsolete generated UI folders (25,038,178 bytes), retained the active build and two prior verified generations, removed unreachable legacy test bodies, and reduced unnecessary layout spacing. Chats, model files, owner settings and unrelated temporary files were retained.

Mobile/cloud/remote acceptance needs unavailable devices or workers. Full independent production acceptance, the corrected complete human voice runner, and the actual model-generated media/playback pipeline remain open. These limits are recorded rather than turned into completion claims.

See the [delivery receipt](verification/2026-11-10/windows-ready-delivery.json), [widget fixes and real browser evidence](verification/2026-11-10/widget-outcome-and-gateway-fix.json), and [current acceptance matrix](verification/CURRENT-ACCEPTANCE.md).
