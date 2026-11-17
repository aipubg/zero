# Zero — kya chal raha hai, kya offline hai

Jaanch: 2026-11-18, chalte hue Zero host (127.0.0.1:18789) par har feature ko asli call karke.
Naya UI (`app/zero-ui`) yahi list **Status** page par live dikhata hai.

## ✅ Chal raha hai (naye UI se juda hua)

| Feature | Host method / tool | UI page |
|---|---|---|
| Chat, streaming jawab, tool chips, rokna | `chat.send`, `zero.stream.*`, `zero.tool.start`, `chat.abort` | Chat |
| Sessions (naya, naam badlo, archive, delete, history) | `sessions.*`, `chat.history` | Chat |
| Model chunna (Auto-Best ya koi model) | `models.list`, `chat.send{model}` | Chat, Models |
| Providers: jodna, key daalna, test, hatana, default | `zero.providers.*`, `models.authStatus` | Models |
| Gemini Live Screen Share one-click setup, online/offline switch | `zero.screenShare.*` | Models, Screen |
| Computer: apps kholna, windows, focus/close, screen dekhna | `tools.call zero_computer_action / open_app`, `/desktop/frame.jpg` | Computer |
| Computer par haath rokna (hold / release) | `zero-policy.computer-hold.*` | Computer |
| Terminal (PowerShell commands) | `tools.call run_process` | Terminal |
| Tasks: list, detail, cancel, retry | `tasks.*` | Tasks |
| Automations (cron): banana, on/off, delete, abhi chalao, templates | `cron.*`, `automation.*` | Automations |
| Memory: layers, list, search, jodna, bhoolna | `memory.*` | Memory |
| Agents, teams, workers | `agent.profile.list`, `agent.team.list`, `workers.list` | Agents |
| Skills (list, chalao) aur plugins (on/off) | `skills.*`, `plugins.*` | Skills |
| Web research | `research.search` | Research |
| Voice: bolkar likhna (browser mic), jawab bolkar sunna | browser speech + `voice.synthesize`, `voice.status` | Chat, Voice |
| Screen observation (kya dekha gaya) | `zero.observation.*` | Screen |
| Devices, approvals, secrets, system info, gateway restart | `devices.*`, `zero.approval.list`, `secrets.store.*`, `system.info`, `zero.gateway.*` | Settings |
| Customization: themes, accent rang, photo se rang, font size, density, orb | browser (har device par yaad rehta hai) + `users.prefs.*` | Appearance |

## ⚪ Offline / band (aur kyun)

| Cheez | Haalat | Kya karna hoga |
|---|---|---|
| **Chat ka model (provider `nv`)** | API key nahi hai — `.env` aur `.zero-data` 2026-11-18 ko mit gaye, key unke saath chali gayi | Models page par key dobara daalein |
| Gemini Live Screen Share | Key set nahi (data mitne ke baad) | Models → "Gemini Live Screen Share" me key daalein |
| zero-desktop runtime (`desktop_control`) | Install nahi; installer ka URL toota hua | Runtime installer theek karna baaki |
| Local vision (SmolVLM) | Model files hain, runtime nahi chalta | — |
| Fast input daemon | Windows Defender rokta hai; Zero dheeme raste se chalta hai | Defender exclusion (aapka faisla) |
| Realtime talk provider | Koi provider nahi; voice browser mic + Windows SAPI se chalti hai | — |
| Gemini Live ki awaaz me jawab | Setting hai, audio playback nahi bana | — |
| Skill registry (ClawHub), Skill workshop, Memory import, GitHub identity | Purane vendored UI ke features, Zero host me inka backend kabhi nahi tha | Naye UI se hata diye |
| Secrets store, approval par faisla | Host me sirf "ok" lautane wale stub hain — kuch save nahi hota | Asli backend banana baaki; naya UI inhe nahi dikhata (approvals sirf padhne ke liye) |
| Backups | Koi backup target set nahi | — |
| Channels, MCP servers, cloud workers | Configure nahi | — |
