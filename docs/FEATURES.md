# Zero — सारी Features की सूची

बनाई: 2026-11-17, `main` @ `2e25eba83` पर।
तरीका: चलते हुए app के हर page को खोलकर पढ़ा (60+ routes, headless Chrome, सिर्फ tabs खोले, कुछ बदला नहीं) और code से backend की चीज़ें निकालीं।
यह "क्या है" की सूची है, "कैसे काम करता है" की नहीं।

**निशान:** ✅ चालू · ⚠️ है पर आधा, गलती दिखाता है, या setup बाकी · ⛔ बंद, छुपा, या इस build में नहीं चलता · 🔁 duplicate (एक ही चीज़ दो जगह)

---

## 1. ऊपर की पट्टी (Top bar) — हर page पर

| चीज़ | क्या है |
|---|---|
| ✅ Breadcrumb | "Personal workspace / <page>" |
| ✅ Connected | Gateway से जुड़े होने का संकेत |
| ✅ Day/Night बटन (☀️/🌙) | "Switch to Night mode" — light/dark theme |
| ✅ Go anywhere (Ctrl K) | Command palette: pages और settings पर जाना |
| ✅ Computer Control: Active/Standby | Zero को mouse-keyboard चलाने देना या रोकना |
| ✅ Voice: READY | Zero की अपनी आवाज़ (सुनना, बोलना); click करने पर "Listening" |
| ✅ Reasoning: ON/OFF | Model की "सोच" चालू/बंद (`/no_think`) |
| ✅ Workforce: N configured | कितने agents हैं |
| ✅ Screen Share pill | "Online · Gemini" / "Online paused" / "Offline · Local" / "Stopped"; click पर live screen preview window, उसमें "Mode: Auto / Offline only" |
| ✅ Zero: Ready / action indicator | Zero जब कोई काम कर रहा हो तब दिखता है |

## 2. बायाँ sidebar

- ✅ Zero logo (Command पर ले जाता है), sidebar छोटा/बड़ा करना
- **Workspace:** ✅ New Chat · ✅ Command · ✅ Computer · ✅ Automations · ✅ Dashboards
- **Pinned items (Edit pinned items, Reorder):** ✅ Home · ✅ Agents · ✅ Systems · ✅ Plugins
- **Sessions list:** ✅ हर बातचीत; हर एक पर Pin, Archive, Delete, Session menu; ✅ "Filter & sort"; ✅ "Show more"
- ✅ "Manage plugins" link
- ✅ Git branch badge ("main")
- ✅ Owner menu ("Identity and app menu"): Settings वगैरह
- ✅ Home (Talk to your Home agent) · ✅ Inbox ("0 inbox items")
- 🔁 "Command" और "Home" दोनों `/chat/zero` पर; "Computer" और "Systems" दोनों `/systems` पर

## 3. New Chat (`/new`)

- ✅ स्वागत हिस्सा: "Your ideas. In motion."
- ✅ चार शुरुआती कार्ड: **Find the signal** (research) · **Make something** · **Get things moving** (computer पर काम) · **Expand your Zero** (skills)
- ✅ स्थिति पट्टी: MODEL, VOICE, OBSERVATION, WORKSPACE
- ✅ Session box "What should this session work on?", **Where:** (कौन सा computer), **Incognito** switch, attachment, **Dictate**, **Start session**, model picker
- ✅ Recent chats
- ⚠️ यहाँ VOICE "Partial" लिखा आता है जबकि top bar पर "Voice: READY" — दो अलग voice systems (देखें §21)

## 4. Chat — Command (`/chat/zero`)

**Header**
- ✅ Session का नाम (Rename) · ✅ Side panel · ✅ Open split view · ✅ Session actions menu

**Session actions menu**
- ✅ Pin (P) · Rename (R) · Mark as unread (U) · Archive (A / Ctrl+Shift+A) · Move to group (New group) · Assign to (Zero) · Fork conversation (F) · Delete (D)
- ✅ Copy: Session link · Preview link · Conversation as Markdown · Session ID
- ✅ Open in: New tab · New window · Split right · Split below · **Continue in terminal…**
- ✅ View: Reasoning · Tool calls · Keep commentary · Toggle desktop panel

**Transcript (बातचीत)**
- ✅ Show earlier · ✅ हर message पर markers (दाईं ओर navigation) · ✅ Reply to message · ✅ Copy as markdown · ✅ Copy code
- ✅ Tool output / Raw details (हर tool का नतीजा) · ✅ "Show N hidden lines"
- ✅ **Zero Computer Execution** card: steps की सूची, COMPLETED/PARTIAL, **Take Over** बटन
- ✅ Media card (YouTube वगैरह), dashboard widgets, Mermaid diagrams, Markdown, code highlighting, HTML preview, spreadsheet view, link reader (UI bundle में मौजूद)

**Composer (लिखने का box)**
- ✅ "Message Zero" box · ✅ Send · ✅ Model picker (Default model (Auto-Best) + configured models, context size)
- ✅ Add attachment: **Take photo · Photo · File · Skills · Connectors · Manage plugins**
- ✅ Execution permissions: **Guarded** (इंसान review करे) · **Workspace** (AI reviewer) · **Full Access**
- ✅ Start voice input
- ⚠️ "Tap to talk" और "Dictation": "No realtime voice / transcription provider is configured"
- ✅ Fallback chat dock (`zero-chat-dock.js`): अगर असली composer न दिखे तो अपना "Message Zero…" box लगा देता है 🔁

**Side panels (UI bundle में; हर एक live नहीं खोला)**
- Browser panel · Desktop panel · Terminal panel (ghostty) · Processes · Subagents · Questions · Link reader · File editor · Session discussion · Detail panel

## 5. Computer (`/systems`)

- ✅ Machine card (DESKTOP-2KH8JO8): LOAD, cores, MEMORY, history graph, "Hide statistics", "Machine details"
- ✅ Live desktop viewer (noVNC जैसा): **Take control · Return control · Refresh · Switch to view only · Audio · Picture-in-Picture · New window · Fullscreen · Disconnect · Desktop size**
- ✅ Computer control hold: "Computer control is free / Global hold · all sessions"
- ⚠️ Backups: "No backups recorded — `zero backup enable --to <location>`"

## 6. Automations (`/automations`)

- ✅ Tabs: All · Active · Paused · Run history (Status, Delivery, Sort filters)
- ✅ New automation · Filters · Refresh · Search
- ✅ Starter automations (6): Repo pulse · Standup ghostwriter · Hacker News scout · Dependency radar · Night watch · Polyglot minute
- ✅ Backend templates (3): Daily Research & Codebase Digest · Auto-Consolidate Memory on Screen Idle · Instant Desktop Alert on Task Failure
- ✅ पीछे हर 15 सेकंड scheduler चलता है

## 7. Dashboards (`/dashboards`)

- ✅ हर session का अपना board; Zero widgets pin कर सकता है ("status card")
- ✅ Search, Author filter, Sort (Recently updated / Title A–Z)

## 8. Agents (`/agents`)

- ✅ Team roster: Zero (model, Active, "Open chat"), "Manage agents", "New agent"
- ✅ Backend specialists: Zero (Coordinator) · Research Specialist · Engineering Specialist · Quality & Security Auditor · Desktop Operator — UI में सिर्फ Zero दिखता है (जानबूझकर)

## 9. Plugins hub (`/plugins`, `/skills`)

- ✅ Tabs: **Plugins** (All / Featured / Trending / Installed, Plugin settings, Search) · **Skills** · **Skill workshop** (Learning Off/Auto, Learn from history)
- ✅ 9 built-in skills (देखें §15)
- ⛔ Skills search: "Method 'skills.search' not found"
- ⛔ Skill workshop: "Method 'skills.workshop.changes' not found"
- 🔁 वही 9 skills Plugins tab, Skills tab और Settings → Plugins (plugins के नाम से) तीनों में

## 10. दूसरे pages (sidebar में नहीं, सीधे link से खुलते हैं)

| Page | क्या है |
|---|---|
| ✅ Usage (`/usage`) | Tokens/Cost, Today/7d/30d/90d/1y/All, date range, time zone, session filter, Pin, Export |
| ✅ Activity (`/activity`) | Sessions (24h/7d/30d/All) और Live activity |
| ✅ Sessions (`/sessions`) | सारे sessions की table, transcript search, filters, Active/Archived, bulk select |
| ✅ Worktrees (`/worktrees`) | New worktree, Clean up now |
| ✅ Terminal (`/terminal`) | "New session" — Zero का अपना terminal |
| ⚠️ Meetings (`/meetings`) | Meeting notes/transcripts, filters — "Loading…" पर रुकता है |
| ⛔ Portals (`/portals`) | "This gateway does not support portals" |
| ⚠️ Apps (`/apps`) | iPhone, Android, Apple Watch, Wear OS, macOS, Windows, Linux, Chrome extension, ClawHub — upstream के links; "Pair your device" |
| ⚠️ Lobsterdex (`/lobsterdex`) | Upstream का "lobster palette" खेल (49 palettes) — Zero से जुड़ा नहीं |
| ⛔ Import Memory (`/memory-import`) | Codex/Claude Code memory import — "Method 'migrations.memory.plan' not found" |
| 🔁 | `/settings/sessions`, `/settings/worktrees`, `/settings/lobsterdex`, `/settings/memory-import` वही pages दोबारा |

## 11. Settings (Owner menu → Settings) — 25 pages

**ऊपर:** Back to app (Esc) · Settings search · Ask Zero

| Page | क्या-क्या है |
|---|---|
| ⚠️ **Profile** | Display name/avatar, YOUR ACCESS (Reconnect, Technical details), IDENTITY, CONNECTED ACCOUNTS (Gateway, Person, Personal sign-in), GITHUB CONNECTIONS (My GitHub, System GitHub, GitHub for Zero, Verify, Manage), Usage statistics link. गलतियाँ: IDENTITY में "Cannot read properties of undefined (reading '0')", GitHub "status for a different target" |
| ✅ **Appearance** | Tabs Theme / UI. Language · Theme (Import tweakcn) · Color mode (System/Light/Dark) · Accent (Claw red, Coral, Amber, Mint, Teal, Blue, Violet, Pink, Slate, Custom) · Typography (Interface, Chat prose, Terminal font) · Browser tab icon · Text size (90–140%) · Sidebar · Session observer · Lobsterdex · Chat (Message width, Send shortcut, Follow-ups while working, Small model) · Session sources (Open external sessions in) · Connection (Microphone, Camera) |
| ⚠️ **Notifications** | Browser push: "Enable notifications" (अभी Not subscribed) |
| ✅ **Gateway** (`/settings/connection`) | Gateway URL, Gateway secret, ping (p50/p95/p99), Gateway activity (CPU/memory/delay), Default session, Gateway host (uptime, OS, Node, PID). ⚠️ "Last ping failed. Retrying…" |
| ⚠️ **Channels** | WhatsApp, Telegram, Google Chat, Slack, Signal, iMessage, Nostr, "More channels", DM access requests — कोई जुड़ा नहीं |
| ⛔ **Communications** | "No settings in this section" |
| ⚠️ **Talk** | Trigger words (editing इस gateway पर बंद), Realtime voice provider/model/speaker voice — "Not configured" |
| ⚠️ **Devices** | Paired devices (Primary Desktop: offline), Pair device, Exec approvals (Gateway/Node, Load approvals), Exec node binding |
| ⚠️ **Cloud workers** | Profiles / Pool / Snapshots, Add profile, Prepared pool, Repositories — कुछ configured नहीं |
| ✅ **Agents** | Tabs: Overview (identity, emoji, image, workspace, primary model, Decision model) · Files (core files) · Tools (Minimal/Coding/Messaging/Full, Enable/Disable all) · Skills (allowlist) · Channels · Automations · Memory (Dreaming). ⚠️ "Could not load runtime tool catalog" |
| ✅ **Models** | Add Provider · Import GGUF · Export/Import Config · Agents → · **✦ Gemini Live Screen Share** · Model defaults (Primary, Utility, Fallback, Thinking, Fast mode) · Agent model bindings · Configured providers (Test connection, Edit, Delete) · Provider form (key pool, models, reasoning/vision toggles, fallback, Screen Share (Online) section) · Local GGUF (mount, Hugging Face search/download, self-test) |
| ✅ **Search** | Web search on/off, provider (Automatic: DuckDuckGo + Wikipedia), per-agent route, Test search, provider setup |
| ✅ **Plugins** | Tabs Installed / Advanced; install from local folder / npm / executable, refresh, restart, check runtime; load paths, allow/deny lists |
| ✅ **Skills** | 9 skills, Search, Workshop, Create skill, Import skill (local / GitHub + pinned revision), Uninstall, Run skill task, filters (Ready/Needs setup/Disabled) |
| ⚠️ **MCP** | Add server; `zero mcp status/doctor/login/reload` commands; कोई server नहीं |
| ✅ **Memory** | Tabs: Overview (Memory is awake, zero-local-embeddings, Embeddings Ready) · Memories (search) · Dreams (Scene/Diary/Advanced, Light/Deep/REM) · Settings (memory engine, dreaming model) |
| ⛔ **Automation** | "No settings in this section" |
| ✅ **Privacy & Security** | Gateway auth, Exec policy (allowlist), Browser enabled, Available tools (Minimal/Coding/Messaging/Full), Pair device |
| ✅ **Secrets** | Add / Bulk Add, write-only या agent-readable secrets |
| ✅ **Approvals** | Standing grants, 30 दिन की approval history |
| ⚠️ **Infrastructure** | सिर्फ "Gateway server settings" (advanced form) |
| ✅ **Labs** | Decision assistance, Code Mode (Node.js / QuickJS executor), Tool Search |
| ✅ **Advanced** | Form / Raw editor; Core, Agent Defaults, Other; Metadata, Models, Patch, Telemetry |
| ✅ **About** | About Zero, One assistant, Privacy, Updates, Local integrations, Screen observation (**Stop observation**, **Private Mode**), Legal notices |
| ⛔ Updates · Logs · Debug | Native shell ने जानबूझकर छुपाए (chat पर भेज देता है) |

## 12. Zero के tools (AI जो खुद इस्तेमाल करता है) — 29

| Tool | काम |
|---|---|
| `zero_computer_action` | Mouse, keyboard, windows, screenshot, UI elements, clipboard |
| `browser` | Zero का अपना browser (signed-in profile): URL, search, YouTube play, page पढ़ना, click/type/fill form, video control |
| `open_app` | App खोलना और सामने लाना |
| `spotify_control` | Spotify: play, pause, next, volume, search |
| `desktop_control` | zero-desktop accessibility runtime (⚠️ runtime install नहीं) |
| `run_process` · `read_file` · `write_file` | Commands चलाना, files पढ़ना-लिखना |
| `system_info` | Hostname, OS, memory |
| `web_search` · `web_extract` · `research_search` | Web खोज, page का text |
| `see_screen` · `screen_context` | Local screen देखना / observations |
| `ask_screen` | Online: Gemini Live से screen के बारे में पूछना |
| `screen_act` | Online: Gemini Computer Use से screen पर काम |
| `memory_recall` · `memory_remember` · `doctor_memory_status` | Memory |
| `procedure_learn` · `procedure_recall` · `zero_skill_learn` | सीखा हुआ तरीका याद रखना |
| `skills_list` · `skill_execute` | Skills |
| `schedule_task` · `goal_plan` · `goal_status` | Automations, लंबे goals |
| `delegate_agent` | Specialist agents को काम |
| `voice_status` | Voice की स्थिति |

## 13. पीछे चलने वाले काम (Background)

- ✅ **Offline screen share:** हर 2 सेकंड capture, 5 मिनट का RAM buffer, बदलाव पहचानना, Windows OCR, encrypted SQLite observations
- ✅ **Online screen share (Gemini Live):** बदलाव पर frame (max 1/s), excluded apps / Take Over / घंटे की सीमा पर रुकना
- ⛔ Local vision model (SmolVLM): runtime `llama-server.exe` नहीं
- ✅ Automation scheduler (हर 15 s), event automations, durable tasks (resume/retry/checkpoint)
- ✅ Agent team, desktop lease (एक समय एक ही agent mouse चलाए)
- ✅ Memory: layers, local TF-IDF embeddings, consolidation, "dreaming"
- ✅ Voice engine: Windows speech (सुनना-बोलना), VAD, barge-in; ⛔ Whisper runtime नहीं
- ✅ Model fabric: Auto-Best, failover, usage counting, local GGUF (node-llama-cpp), Hugging Face download
- ✅ Self-learning: सफल काम से procedure बनाना
- ✅ Session cleanup (machine/test sessions हटाना), multi-app missions (एक request में कई apps)
- ✅ Live desktop stream (`/desktop/stream`, `/desktop/screenshot`)
- ⛔ Fast input daemon (Windows Defender ने रोका) — one-off PowerShell से काम चलता है

## 14. Backend packages

| Package | क्या है |
|---|---|
| `capability-engine` | सारे tools का "एक कमरा": computer, browser, media, Spotify, mode manager, keyboard नियम, screen_act, screen share |
| `model-fabric` | Providers, Auto-Best, local GGUF, Gemini Live client, Gemini screen share setup |
| `screen-intelligence` | Capture, buffer, OCR, observations, protected fields |
| `voice-engine` | Windows speech, VAD, whisper (fallback), conversation |
| `agent-runtime` | Agent team, tasks, desktop lease, messaging |
| `automation` | Cron, event automations, templates |
| `memory` | Unified memory |
| `research-engine` | Search, artifacts, file ops |
| `sessions` | Session store |
| `skill-sdk` | Skills: GitHub import, bundles, execution |
| `plugin-sdk` | Plugins, MCP adapter |
| `workspaces` | Workspaces, process workers |
| `device-protocol` | Devices pairing |
| `gateway-protocol` | RPC protocol |

## 15. Skills (9) और plugins

- **Skills:** browser-control · code-refactoring · github-automation · memory-retention · pdf-processing · system-ops · terminal-exec · vision-analysis · web-research
- ✅ `skills/self-learning-creator.mjs` (नई skill बनाना)
- 🔁 Root `plugins/` (system-tools, web-tools, dynamic-loader) — app अपनी `src/plugins/dynamic-loader.mjs` copy इस्तेमाल करता है; root वाली सिर्फ एक script में

## 16. Host के RPC हिस्से (272 methods)

Sessions · Chat/agent · Tools · Computer/desktop · Observation · Screen share · Providers/models · Local GGUF · Memory · Research · Automations/cron · Tasks · Agent team/leases · Workers/workspaces/projects · Devices/pairing/notifications · Voice · Skills · Plugins · Secrets · Exec/plugin approvals · Usage · Logbook · Dashboards widgets · Themes · Profile/prefs · Updates · Environments · Diagnostics

## 17. HTTP रास्ते

- ✅ `/health`, `/health/liveness`, `/health/readiness`, `/health/features`
- ✅ `/v1/models`, `/v1/chat/completions` (OpenAI-जैसा, सिर्फ model proxy)
- ✅ `/api/gateway/config`, `/api/gateway/proxy`, `/api/gateway/local-gguf/*`
- ✅ `/desktop/screenshot`, `/desktop/stream`

## 18. Scripts और चलाने की files

- चलाना: `zero-host.ps1`, `zero-host.cmd`, `start-all.ps1`, `zero-gateway.ps1`, `zero-setup.ps1/.cmd`
- Install: `scripts/install-agent-desktop.mjs` (⚠️ URL टूटा), `install-local-chat.mjs`, `install-local-stt.mjs`, `install-local-vision.mjs`
- Backup/restore: `backup-user-state.mjs`, `restore-user-state.mjs`
- जाँच: `scripts/full-audit.mjs`, `check-rpc-handlers.mjs`, `verify-*.mjs`, `backend/scripts/acceptance.mjs`, `preflight.mjs`, `scan-secrets.mjs`

## 19. बंद, टूटी या आधी चीज़ें (एक जगह)

1. Skills search, Skill workshop, Import Memory — RPC methods नहीं (`skills.search`, `skills.workshop.changes`, `migrations.memory.plan`)
2. Portals — "not supported"
3. Communications, Automation settings — खाली
4. Profile — identity error, GitHub status error
5. Gateway page — "Last ping failed"
6. Talk realtime voice, Dictation, Tap to talk — provider नहीं
7. Agents → Tools — "Could not load runtime tool catalog"
8. Meetings — loading पर अटकता है
9. Service worker (`sw.js`) — हर page पर 404
10. Desktop runtime (zero-desktop) — install नहीं; installer URL टूटा
11. Local vision (SmolVLM) — runtime नहीं
12. Whisper — runtime नहीं (Windows speech पर चलता है)
13. Fast input daemon — Windows Defender ने रोका
14. Updates, Logs, Debug pages — जानबूझकर छुपे
15. Gemini Live की आवाज़ में जवाब — setting है, audio अभी नहीं चलता
16. Command palette के "Privacy & security" (`/settings/privacy`) और "Gateway" (`/settings/gateway`) links गलत: chat पर पहुँचते हैं; असली pages `/settings/security`, `/settings/connection`
17. Channels, MCP, Cloud workers, Secrets, Devices pairing — सुविधा है, कुछ configured नहीं
18. Backups — चालू नहीं

## 20. Duplicates (एक ही चीज़ कई जगह)

1. Command = Home (`/chat/zero`); Computer = Systems (`/systems`)
2. Sessions/Worktrees, Lobsterdex, Import Memory — `/x` और `/settings/x` दोनों
3. 9 skills — Plugins hub के Plugins tab, Skills tab, और Settings → Plugins में plugins के नाम से भी
4. Agents — `/agents` (roster) और Settings → Agents
5. Voice — top bar का Zero voice (Voice: READY) और upstream का Talk/Dictation (not configured); New Chat पर "VOICE Partial"
6. Screen देखना — `see_screen`, `screen_context`, `ask_screen` (offline/online)
7. Chat composer — असली composer और fallback chat dock
8. `win-actions.ps1` / `win-actions-daemon.ps1` — `packages/capability-engine/` और `app/zero-control-ui/src/computer/` दोनों में
9. Root `plugins/` और `app/zero-control-ui/src/plugins/dynamic-loader.mjs`
10. `backend/gateway/*.ts` (client, sdk, registry, hooks, cache, telemetry, sanitizer, types) — सिर्फ आपस में इस्तेमाल; बाकी app नहीं इस्तेमाल करता
11. Models settings के पुराने नाम: `/models`, `/providers`, `/model-setup`, `/settings/models`, `/settings/providers`, `/settings/model-setup` — सब Models page पर

## 21. Settings files और switches

- Data: `.zero-data/` (SQLite stores, secrets, browser profile), `zero-system/state/`, `models/gateway-providers.json`, `models/gateway-defaults.json`, `.env`
- Env switches: `ZERO_SCREEN_AUTOSTART` (0 = local screen share खुद न चले), `ZERO_MAX_ASSISTANT_TURNS`, `ZERO_MAX_ACTIONS`, `ZERO_GOAL_CRON`, `ZERO_VOICE_RECOGNITION_BACKEND`, `ZERO_BROWSER_PROFILE_DIR`, `ZERO_DATA_DIR`, `ZERO_STATE_DIR`, `ZERO_CONFIG_PATH`, `ZERO_PROVIDERS_PATH`, `ZERO_AGENT_BINDINGS_PATH`, `ZERO_SKILLS_DIR`, `ZERO_LOCAL_MODELS_DIR`, `ZERO_PREFS_PATH`, `ZERO_PORT`/`ZERO_GATEWAY_PORT`, `ZERO_GATEWAY_TOKEN`, `ZERO_NO_AUTO_UPDATE`, `ZERO_SUPERVISED`, `ZERO_ROOT`
