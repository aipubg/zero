# Using the current Windows build

Open [Zero](http://127.0.0.1:18789/chat/zero). The existing Windows build is available for the owner's live use. The 11 November handoff observed the real Orbital chat window, Connected status, active computer control and a selected model. No new test conversation or microphone recording was started for that handoff.

1. Select the main chat and type in **Message Zero** to send a task.
2. For ZERO's native headset conversation, click the **Voice** button in the top status tray. It changes to **Voice: Listening** when the server microphone is active. Click the same button again to stop listening. This is the existing native voice control; the lower composer's microphone is a separate host control.
3. Use the sidebar for Computer, Memory, Search, Models, Agents, Skills and Plugins. **Alt+K** opens Zero navigation.
4. After a PC restart, run `E:\zero\zero-host.cmd`, keep its host window running, then open the same address. If ZERO is already Connected, use the existing host instead of starting another copy. Initial dependency setup uses `zero-setup.cmd`; it is not needed again merely to open the installed build.

This is a usable build on the existing Windows PC, not a complete production certification. Existing owner-mode behavior and user data are preserved. No new permission popup was added. The owner permanently withdrew 24-hour endurance testing; it was not restarted or counted as passing.

The earlier delivery receipt records 104 UI-package checks, 72 selected core checks, ten browser workflows and a separate widget/Gateway check at that checkpoint. Subsequent [complete pinned Skill acquisition](verification/2026-11-10/skill-transport-correction.md), [same-player media execution](verification/2026-11-10/media-control-correction.md) and [native session renewal](verification/2026-11-10/desktop-session-renewal.md) have their own scoped evidence. These historical checkpoints are not a fresh all-tests run at the current commit, and their overlapping counts must not be added together.

Cleanup removed 186 obsolete generated UI folders (25,038,178 bytes), retained the active build and two prior verified generations, removed unreachable legacy test bodies, and reduced unnecessary layout spacing. Chats, model files, owner settings and unrelated temporary files were retained.

An actual external-model chat → visible video → media card → pause workflow now has evidence; the former statement that the entire model/media path had no proof is superseded by that specific result. Arbitrary app players and speaker audibility are outside that media proof. Mobile/cloud/remote acceptance still needs unavailable devices or workers. Full independent production acceptance and the corrected complete human voice runner remain open. The owner accepts the existing tested build for live use; that handoff does not convert unrun gates into PASS.

See the [delivery receipt](verification/2026-11-10/windows-ready-delivery.json), [widget fixes and real browser evidence](verification/2026-11-10/widget-outcome-and-gateway-fix.json), and [current acceptance matrix](verification/CURRENT-ACCEPTANCE.md).
