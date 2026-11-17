# Plan: Online Screen Share (Gemini) + मज़बूत Mouse/Keyboard

स्थिति: **मंज़ूर (2026-11-17)।** Phase A, B, D, E, F पूरे। Phase C (`win-actions.ps1`) दूसरे agent के बिना-commit बदलावों की वजह से रुका है; Phase G owner की अलग मंज़ूरी पर; Phase H owner के साथ live जाँच।

---

## 1. लक्ष्य

Owner जब Settings → Models में Gemini API key वाला provider जोड़ेगा, तो उसी provider में
**"Screen Share (Online)"** का option दिखेगा। उसे चालू करते ही:

1. **Zero screen देख पाएगा** — लगातार (कम रफ़्तार पर) या ज़रूरत पड़ने पर, और समझ पाएगा कि owner क्या कर रहा है।
2. **Zero बोलकर/लिखकर मदद कर पाएगा** — screen देखकर सवालों का जवाब, सुझाव।
3. **Zero इंसान की तरह computer चला पाएगा** — mouse से click, drag, scroll; keyboard shortcuts; window छोटी-बड़ी/इधर-उधर करना; desktop icons खिसकाना; browser चलाना।
4. **पुराना (offline) screen share जैसा है वैसा रहेगा।** Internet या Gemini key न हो तो वही चलेगा।
   Online में Gemini वाला तरीका, offline में local वाला तरीका।

---

## 2. आज क्या मौजूद है (जो नहीं हटेगा)

| हिस्सा | कहाँ | क्या करता है |
|---|---|---|
| Screen observer (offline आँखें) | `packages/screen-intelligence/index.mjs` (`ScreenObserver`) | हर 2 सेकंड screen capture, 5 मिनट का RAM ring buffer, बदलाव पहचानना, encrypted SQLite में observations |
| Capture | `packages/screen-intelligence/windows-capture.mjs` (`captureDriverDesktop`) | GDI से JPEG frame (~150 KB, 1280 चौड़ा) |
| Local OCR | `packages/screen-intelligence/ocr-vision.mjs` | Windows WinRT OCR |
| Local vision model | `models/local-vision.json` (SmolVLM-256M) | runtime (`llama-server.exe`) disk पर नहीं है — अभी बंद |
| Preview | `services/host/native-gateway.mjs` में `/desktop/screenshot`, `/desktop/stream` | UI का "Screen Share: Live" pill और preview window |
| `see_screen` tool | `packages/capability-engine/desktop-actions.mjs` (`seeScreen`) | एक ताज़ा frame + OCR + UI elements model को |
| हाथ | `packages/capability-engine/win-actions.ps1` + `windows-driver.mjs` | click, move, drag, scroll, type (Unicode), hotkey, window focus/min/max/close, UI Automation elements |

**कमियाँ जो इस plan में भरनी हैं:**
- Window को **move/resize** करने का action नहीं है (सिर्फ min/max/close)।
- **Drag** एक झटके में होता है (80 ms), desktop icon या window drag अक्सर फेल होगा।
- `mouse_down` / `mouse_up` / `key_down` / `key_up` (दबाकर रखना) नहीं हैं।
- Process DPI-aware नहीं है — अभी 100% scaling पर ठीक है, 125%/150% पर coordinates गलत होंगे।
- हर action नया PowerShell (0.35–0.6 s); तेज़ वाला daemon Windows Defender ने block किया है।
- Keyboard-destination नियम (`keyboard-target-required`) सिर्फ chat loop में है; RPC या नए Live session से आने वाली calls पर लागू नहीं।
- चेतावनी: `win-actions.ps1` में **किसी दूसरे agent के बिना-commit बदलाव** (आज 22:09, SendInput keys) पड़े हैं। इस file पर काम शुरू करने से पहले वे commit या साफ़ होने चाहिए।

---

## 3. दो तरीके: Offline और Online

| | Offline (जैसा अभी है) | Online (नया) |
|---|---|---|
| आँखें | Local capture + WinRT OCR + UI Automation tree | वही capture → **Gemini Live API** को frames |
| समझ | OCR text + UI elements, chat model को | Gemini लगातार देखता है, बातचीत का context रखता है |
| हाथ | Zero के अपने actions (UIA नाम से / coordinates से) | वही actions + **Gemini Computer Use** जो screenshot देखकर बताता है कहाँ click करना है |
| Internet | ज़रूरी नहीं | ज़रूरी, Gemini key ज़रूरी |
| Screen बाहर जाता है? | नहीं | **हाँ, Google को** — इसलिए owner की अनुमति से ही |

**Mode कैसे चुना जाएगा (`resolveScreenShareMode`):**
1. Owner ने pill से "Offline" चुना है → offline।
2. वरना, कोई provider है जिसमें `screenShare.enabled = true`, key मौजूद, और आखिरी connection जाँच सफल → online।
3. Online session टूटे / internet जाए / key गलत हो → अपने-आप offline, pill पर वजह दिखे; ठीक होते ही वापस online (owner ने offline न चुना हो तो)।
4. Offline observer **हमेशा चलता रहेगा** (वही frames online को भी देता है), इसलिए fallback में देरी नहीं।

---

## 4. Gemini के दो हिस्से (docs से पक्का किया, नाम आपकी key से दोबारा जाँचेंगे)

### 4a. Gemini Live API — "आँखें + बातचीत"
- WebSocket: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=…`
- पहला message `setup` (model, `generationConfig.responseModalities`, `systemInstruction`, `tools.functionDeclarations`, `contextWindowCompression.slidingWindow`, `sessionResumption`, `outputAudioTranscription`)।
- Screen frames: `realtimeInput.video = { mimeType: "image/jpeg", data: <base64> }`, **ज़्यादा से ज़्यादा 1 frame/सेकंड**।
- Model tool माँगे तो `toolCall.functionCalls[{id,name,args}]` → हम `toolResponse.functionResponses[{id,name,response}]` भेजते हैं।
- Live models native-audio हैं: जवाब AUDIO में (24 kHz PCM) आता है, text उसके `outputTranscription` से मिलेगा।
- सीमाएँ: एक connection ~10 मिनट; बिना compression के audio+video session 2 मिनट; `slidingWindow` से लंबा; `goAway` आने पर `sessionResumption` handle से नया connection।
- Docs में model IDs: `gemini-3.8-live` (default), `gemini-3.8-live-extended-thinking`, `gemini-2.5-flash-native-audio-preview-12-2025`, `gemini-3.1-flash-live-preview` (legacy)। **Docs आपस में मेल नहीं खाते** — Phase A में आपकी key से असली list लेंगे।

### 4b. Gemini Computer Use — "सटीक हाथ"
- Interactions API: `POST https://generativelanguage.googleapis.com/v1/interactions` (header `x-goog-api-key`)।
- Tool: `{ "type": "computer_use", "environment": "desktop" }` — desktop (OS-level cursor) environment मौजूद है।
- Desktop actions: `click`, `double_click`, `triple_click`, `middle_click`, `right_click`, `mouse_down`, `mouse_up`, `move` (x,y) · `drag_and_drop` (start/end) · `type` (text, press_enter) · `press_key`, `key_down`, `key_up` (key) · `hotkey` (keys[]) · `scroll` (x,y,direction,magnitude) · `wait` · `take_screenshot`। हर action के साथ `intent`।
- Coordinates 0–999 grid पर (docs में एक जगह pixels भी लिखा है — **Phase A में असली test से पक्का करेंगे**)।
- हर action के बाद हम `function_result` में नया screenshot (PNG) लौटाते हैं; `previous_interaction_id` से बातचीत आगे चलती है।
- Safety: action में `safety_decision.decision = "require_confirmation"` आए तो owner से पूछना ज़रूरी; हाँ पर `safety_acknowledgement: true` भेजना।
- `excluded_predefined_functions` से जो action न चाहिए वह बंद; साथ में अपने functions (जैसे `open_app`, `yield_to_user`) दे सकते हैं।
- Docs में model IDs: `gemini-4-hydrogen` (sample में), बाकी सिर्फ summary से — Phase A में पक्का।

### 4c. Phase A के असली नतीजे (owner की key, सिर्फ बनाई हुई test images, 2026-11-17)

**Key का tier: Free Tier।**

| जाँच | नतीजा |
|---|---|
| Live models (`bidiGenerateContent`) | `gemini-3.8-live`, `gemini-3.8-live-extended-thinking`, `gemini-3.1-flash-live-preview`, `gemini-2.5-flash-native-audio-latest` (+ preview), `gemini-3.5-transcribe-live`, `gemini-3.5-live-translate-preview`, `gemini-robotics-er-2-streaming-preview` |
| Live: `responseModalities: ["TEXT"]` | **मना** (close 1007: "TEXT is not supported by the model") |
| Live: `responseModalities` setup के top level पर | **मना** ("Unknown name responseModalities at 'setup'") — सही जगह `generationConfig` |
| Live: AUDIO + `outputAudioTranscription` | **चलता है।** Text जवाब transcript से; audio `audio/pcm;rate=24000` |
| Live: test image पढ़ना + tool call | Frame भेजने के ~1.2 s बाद `report_seen_text({"text":"ZERO TEST 4729"})` — बिल्कुल सही; रंग भी सही बताए। `toolResponse` में `scheduling: "INTERRUPT"` स्वीकार हुआ |
| Live: `sessionResumptionUpdate` | माँगे बिना ही `setupComplete` के तुरंत बाद आता है (`resumable: true`) |
| Computer Use endpoint | `/v1/interactions` image नहीं लेता — **`/v1beta/interactions` ज़रूरी** |
| CU, `environment: "desktop"` | `gemini-4-hydrogen` और `gemini-3.5-flash-lite` दोनों पर **"Request blocked due to safety violations"** (वही image browser में चली) |
| CU, `environment: "browser"` | `gemini-3.5-flash-lite`: **चलता है**, ~10 s, `click {x:750, y:744}` |
| Coordinates | **0–999 grid पक्का**: (750,744) → 1440×900 पर (1080,670) = OK बटन का ठीक केंद्र |
| `gemini-4-hydrogen`, `gemini-3.8-flash` | उस समय 503 "high demand" |
| `gemini-4-argon`, `gemini-2.5-computer-use-preview-10-2025` | Free Tier पर quota 0 (429) |

**इनसे plan में बदलाव:**
1. Live का जवाब हमेशा audio में आएगा; chat में text `outputTranscription` से दिखेगा, आवाज़ चलाना optional।
2. Computer Use (`screen_act`) **"browser" environment** से चलेगा, पूरे desktop के screenshot के साथ; `navigate`, `go_back`, `go_forward` को `excluded_predefined_functions` से बंद करके `open_app` अपना function। Default model `gemini-3.5-flash-lite`, settings में बदल सकते हैं; 503/429 पर अगला model आज़माना।
3. CU धीमा है (~10 s/step), इसलिए Live session पहले Zero के अपने तेज़ हाथ (UI Automation नाम + coordinates) इस्तेमाल करेगा; `screen_act` तब जब control नाम से न मिले।
4. "desktop" environment को settings में option रखेंगे (paid tier पर चल सकता है), default "browser"।

---

## 5. Architecture

```
                      ┌──────────────────────── Zero Host (Node, आपकी मशीन) ────────────────────────┐
 Screen ──capture──►  ScreenObserver (offline, हमेशा) ──frames──┬──► offline: OCR, UIA, see_screen
                                                                 │
                                                                 └──► ScreenShareService (नया)
                                                                        │  mode = offline | online
                                                                        ▼
                                                    GeminiLiveSession (नया) ◄──WebSocket──► Gemini Live
                                                        │  toolCall                         (आँखें+बात)
                                                        ▼
  Chat agent loop ──────────────► CapabilityEngine.execute  (एक ही कमरा, वही नियम)
                                     ├─ zero_computer_action (हाथ, नए actions के साथ)
                                     ├─ screen_act (नया) ──► GeminiComputerUse ◄──HTTPS──► Gemini CU
                                     └─ बाकी tools (browser, open_app, run_process …)
                                                        │
                                     KeyboardDestinationRule + Safety confirm (engine के अंदर)
```

- **Key कभी browser/UI में नहीं जाती।** WebSocket और HTTPS दोनों Node host से खुलते हैं; key `.env` / private secret store में रहती है (जैसे आज)।
- Live session और chat agent दोनों के actions **एक ही `CapabilityEngine`** से जाते हैं — एक नियम, एक audit log।

### नई files
| File | काम |
|---|---|
| `packages/model-fabric/gemini-live-client.mjs` | Raw WebSocket client: setup, frames, toolCall/toolResponse, transcripts, goAway/resumption, compression, reconnect with backoff, usage tracking |
| `packages/model-fabric/gemini-computer-use.mjs` | Interactions API client: request बनाना, actions पढ़ना, coordinate scaling, safety_decision पढ़ना |
| `packages/capability-engine/screen-share.mjs` | `ScreenShareService`: mode चुनना, observer से frames लेना (बदलाव पर, ≤1 fps, हर 10 s heartbeat), pause नियम, Live session lifecycle, status events |
| `packages/capability-engine/screen-act.mjs` | `screen_act(goal)` capability: screenshot → Gemini CU → action → नया screenshot … (step limit, confirm, verify) |
| `packages/capability-engine/keyboard-rule.mjs` | Keyboard-destination नियम chat loop से निकालकर engine में (सब callers पर लागू) |
| `test/gemini-live-client.test.mjs` | Local fake WebSocket server से protocol test |
| `test/gemini-computer-use.test.mjs` | Local fake HTTP server से CU loop, scaling, safety test |
| `test/screen-share-mode.test.mjs` | mode चुनना, fallback, pause नियम |
| `test/human-input.test.mjs` | नए mouse/window actions (अपनी बनाई test window पर) |

### बदलने वाली files
| File | बदलाव |
|---|---|
| `services/host/model-settings.mjs` (`mergeProvider`) | provider में `screenShare` object स्वीकार करना और validate करना |
| `app/zero-control-ui/src/pages/models.js` | Provider modal में "Screen Share (Online)" section |
| `app/zero-control-ui/src/native-surfaces.js` | Pill: "Screen Share: Offline · Local" / "Online · Gemini" / "Online paused (वजह)"; preview window में mode badge; pill से mode बदलना |
| `services/host/native-gateway.mjs` | RPC `zero.screenShare.status/start/stop/setMode/confirm`, events `screenShare.state`; Live transcripts को chat session में डालना; chat loop से keyboard नियम हटाकर engine वाला इस्तेमाल |
| `packages/capability-engine/index.mjs` | `screen_act` capability + arguments; `zero_computer_action` में नए actions; keyboard नियम engine में |
| `packages/capability-engine/win-actions.ps1` + `windows-driver.mjs` | DPI awareness, smooth mouse, hold actions, window bounds (Section 7) |
| `docs/ROADMAP.md` | Phase status |

---

## 6. Provider में option (owner को क्या दिखेगा)

Provider modal (Settings → Models → Add/Edit Provider) में, जब Base URL `generativelanguage.googleapis.com` हो:

```
Screen Share (Online)                                 [ ] चालू करें
  Live model           [ list आपकी key से ]            (default: सबसे नया Live model)
  Computer Use model   [ list आपकी key से ]            (default: सबसे नया CU model)
  देखने की रफ़्तार     [ सिर्फ बदलाव पर, max 1/सेकंड ▾ ]
  आवाज़ में जवाब       [ ] (बंद = सिर्फ chat में text)
  इन apps पर रोकें      [ KeePass, 1Password, banking … ]   (यहाँ screen Google को नहीं जाएगा)
  घंटे की सीमा         [ 60 मिनट/घंटा ]  (usage meter)
  [ Connection जाँचें ]  → "Live: OK (model …), Computer Use: OK"
```

Save होने वाला config (key हमेशा की तरह अलग, private):
```json
{
  "id": "google", "baseUrl": "https://generativelanguage.googleapis.com/v1beta/openai/",
  "apiKey": "env:GEMINI_API_KEY",
  "screenShare": {
    "enabled": true,
    "liveModel": "<Phase A से>", "computerUseModel": "<Phase A से>",
    "frameMode": "on-change", "maxFps": 1, "heartbeatSeconds": 10,
    "voiceReplies": false,
    "excludedApps": ["KeePass", "1Password"],
    "maxMinutesPerHour": 60
  }
}
```
- Checkbox सिर्फ तब enable होगा जब key मौजूद हो और "Connection जाँचें" सफल हो।
- Key हटाई/provider बंद किया → online अपने-आप बंद, offline चालू।

---

## 7. हाथ (mouse/keyboard) सुधार — दोनों mode में काम आएँगे

| काम | तरीका |
|---|---|
| DPI सही | Action script शुरू में `SetProcessDpiAwarenessContext(PER_MONITOR_AWARE_V2)`; capture और input एक ही physical pixel space में; हर monitor की bounds `get_monitors` से |
| इंसान जैसा mouse move | `SendInput` absolute (virtual desktop) से 8–20 छोटे कदम, ease-in-out, कुल 120–300 ms (दूरी के हिसाब से) |
| भरोसेमंद drag | `mouse_down` → धीरे move (OS drag threshold पार) → थोड़ा रुकना → target पर `mouse_up`; desktop icon और window title-bar drag पर test |
| दबाकर रखना | नए actions `mouse_down`, `mouse_up`, `key_down`, `key_up` (Gemini CU भी यही माँगता है) |
| Window move/resize | `set_window_bounds {target, x, y, width, height}` (`SetWindowPos`), `move_window`, `resize_window`, `snap_window {left/right/top/bottom}`, `get_window_bounds` |
| Scroll | vertical + horizontal, magnitude pixels में |
| Shortcuts | मौजूदा `hotkey` (ctrl/alt/shift/win + key) — दूसरे agent के SendInput वाले बदलाव से मिलाकर |
| रफ़्तार | मौजूदा: हर action नया PowerShell। **विकल्प (Phase G, आपकी मंज़ूरी पर):** छोटा C# helper (`zero-hands.exe`) जो local `csc.exe` से इसी repo के source से बनेगा, हमेशा चालू रहेगा (stdin/stdout JSON) — लक्ष्य < 50 ms/action। Defender ने उसे भी रोका तो PowerShell वाला ही चलेगा; antivirus से कुछ छुपाया नहीं जाएगा |

---

## 8. Safety और privacy (बदलेगा नहीं, बल्कि मज़बूत होगा)

1. **Online screen share सिर्फ owner के चालू करने पर।** Pill पर साफ़ लिखा रहेगा "Gemini आपकी screen देख रहा है"।
2. **रुकने के नियम (frames नहीं जाएँगे):** lock screen / UAC; `excludedApps` की window सामने हो; password field पर focus (UIA `IsPassword`); owner का "Take Over" (human hold); घंटे की सीमा पूरी।
3. **Keyboard-destination नियम engine में** — chat, RPC, Live, `screen_act` सब पर एक जैसा।
4. **Gemini CU का `require_confirmation`** → chat में confirm card; owner "हाँ" दे तभी action। "ना" → वह task रुकता है।
5. **Zero के अपने पक्के नियम:** पैसे, password, account बनाना, message भेजना, delete — पहले की तरह owner से पूछकर।
6. Screen data हमारी तरफ़ disk पर नहीं लिखा जाएगा (offline वाला encrypted store जैसा है वैसा)।
7. Usage meter (`usageMetadata` से tokens) pill/Settings में; सीमा पार → online रुककर offline।

---

## 9. Phases (हर phase का अपना commit + push, और ROADMAP अपडेट)

### बनने के बाद के फ़ैसले (plan से अलग)
- **Live सिर्फ आँखें है, हाथ नहीं।** Live session को action tools नहीं दिए; chat agent उससे `ask_screen` से पूछता है और actions खुद (या `screen_act` से) करता है। वजह: दो models एक साथ mouse न चलाएँ।
- **Keyboard नियम** engine के अंदर नहीं, साझा `keyboard-rule.mjs` में है और हर request-scope (chat turn, `screen_act`) पर लागू होता है; owner के सीधे tools.call पर नहीं (दूसरे agent का test `keyboard-foreground.test.mjs` यही माँगता है)।
- **आवाज़ में जवाब** (`voiceReplies`) setting save होती है, पर audio अभी चलाया नहीं जाता — बाकी।
- **Password field पर रुकना** (UIA `IsPassword`) अभी नहीं; excluded apps, "Take Over" और घंटे की सीमा पर रुकता है।

### Phase A — आपकी key से पक्की जाँच (read-only, आपकी screen नहीं भेजेंगे)
- `GET /v1beta/models?key=…` से Live और Computer Use वाले असली model IDs।
- Live: एक नकली (बनाई हुई) test image के साथ `setup` → `setupComplete` → 1 frame → model से "इस image में क्या है" का जवाब; `responseModalities` की सही जगह, `INTERRUPT` बनाम `INTERRUPTED`, text/audio व्यवहार दर्ज।
- CU: एक बनाई हुई 1440×900 image जिसमें known जगह पर एक बटन — model से उसे click करवाना → coordinates 0–999 हैं या pixels, पक्का।
- **ज़रूरत:** आप Gemini key वाला provider जोड़ें (अभी सिर्फ `nv` है)।
- **पास:** नतीजे इस file के Section 4 में लिखे जाएँ; कुछ अलग निकला तो plan वहीं ठीक होगा।

### Phase B — Keyboard नियम engine में + provider option (बिना streaming)
- `keyboard-rule.mjs`; chat loop वाला हटाना; मौजूदा `test/keyboard-destination-rule.test.mjs` + RPC पर नया test।
- `mergeProvider` में `screenShare`; models.js में section; "Connection जाँचें" (Phase A वाले calls)।
- **पास:** tests; Settings में option दिखे, save/reload पर बना रहे; key न हो तो checkbox बंद।

### Phase C — हाथ सुधार (Section 7, helper exe छोड़कर)
- पहले `win-actions.ps1` के बिना-commit बदलाव सुलझाना।
- DPI, smooth move, drag, hold actions, window bounds/snap, monitors, horizontal scroll; `CAPABILITY_PARAMETERS` में नए arguments।
- **पास (अपनी बनाई test window और scratch चीज़ों पर, आपकी चीज़ें नहीं छूएँगे):** window move/resize के बाद bounds मेल खाएँ; drag से test window में item खिसके; एक **test shortcut** को desktop पर एक जगह से दूसरी जगह drag करके वापस रखना (आपकी मौजूदा icons नहीं); 125% scaling का unit test (coordinate math)।

### Phase D — Gemini Computer Use (`screen_act`)
- `gemini-computer-use.mjs` + `screen-act.mjs`: goal → screenshot (1440 चौड़ा) → action → हमारे हाथ से execute → नया screenshot → … ; max 15 steps; हर step का intent chat में; `require_confirmation` पर रुककर पूछना; `excludedApps` पर मना।
- Chat agent और Live दोनों के tool list में `screen_act` (online होने पर ही)।
- **पास:** fake server tests; फिर आपके सामने एक live test: "Notepad की अपनी scratch file में X लिखो और window को screen के बाएँ आधे में रखो"।

### Phase E — Gemini Live session (online screen share)
- `gemini-live-client.mjs` + `screen-share.mjs`: frames बदलाव पर (≤1 fps) + heartbeat; pause नियम; tools = curated Zero capabilities + `screen_act`; toolCall → engine → toolResponse; `toolCallCancellation` पर रोकना; transcripts chat में "Zero (live)" के नाम से; goAway/resumption/backoff; usage meter।
- आवाज़: default बंद (सिर्फ text); चालू करने पर 24 kHz PCM मौजूदा voice output से।
- **पास:** fake WS tests (setup, frames, toolCall round-trip, goAway पर reconnect, pause पर frame न जाना); live: आप कोई page खोलें, पूछें "मैं क्या देख रहा हूँ?" → सही जवाब।

### Phase F — Mode switching UI
- Pill के तीन रूप; pill से Offline/Auto चुनना; preview window में mode badge; online टूटे तो वजह के साथ offline।
- **पास:** internet बंद करके (या गलत key से) fallback दिखे; ठीक होने पर वापस।

### Phase G — तेज़ हाथ (helper exe) — **सिर्फ आपकी अलग मंज़ूरी पर**
- `tools/zero-hands/*.cs` → local `csc.exe` से build → persistent process; Defender रोके तो साफ़ बताना और PowerShell पर रहना।
- **पास:** औसत action latency नापी जाए (पहले/बाद)।

### Phase H — आपके साथ पूरी live जाँच
- YouTube (आपका signed-in Zero browser): video खोलना, volume/speed, full screen; Spotify; एक window resize/move; test shortcut drag; "screen देखकर बताओ मैं क्या कर रहा हूँ"।
- नतीजे ROADMAP में; जो फेल हो वह साफ़ लिखा जाए।

---

## 10. क्या नहीं बदलेगा
- Offline screen share, उसका observer, OCR, encrypted store, `/desktop/screenshot`, preview window।
- मौजूदा tools और उनके नाम; chat agent का model (nv) — Gemini सिर्फ screen share/CU के लिए, जब तक आप उसे primary न चुनें।
- Safety नियम (सिर्फ मज़बूत होंगे)।

## 11. जोखिम
- **Docs preview में हैं** और model नाम बदलते रहते हैं → Phase A, और model choice settings में (hard-coded नहीं)।
- **Live models सिर्फ audio में जवाब** दे सकते हैं → text के लिए transcription; अगर image input किसी model पर न चले तो दूसरा Live model।
- **खर्च:** video frames tokens खाते हैं → बदलाव-पर-ही भेजना, घंटे की सीमा, meter। Google की कीमत मैं plan में नहीं मान रहा; meter असली usage दिखाएगा।
- **Defender** helper को भी रोक सकता है → Phase G optional।
- **दूसरा agent** उन्हीं files पर काम कर रहा है → हर phase से पहले `git status` और टकराव पर आपसे पूछना।

## 12. आपके फैसले (मेरे default के साथ)
1. Live का जवाब आवाज़ में भी? — **Default: बंद**, सिर्फ chat में text।
2. Online में लगातार देखना या सिर्फ ज़रूरत पर? — **Default: लगातार, पर सिर्फ screen बदलने पर (max 1/सेकंड) और हर 10 सेकंड एक heartbeat**; pill से "सिर्फ ज़रूरत पर" चुन सकते हैं।
3. Phase G (helper exe) करें? — **Default: बाद में, अलग से पूछकर।**
4. किन apps पर screen कभी न भेजें? — **Default list:** password managers, banking/UPI apps, Windows Security।

## Sources
- Gemini Live API reference: https://ai.google.dev/api/live
- Live API get started (WebSocket): https://ai.google.dev/gemini-api/docs/live-api/get-started-websocket
- Gemini Computer Use: https://ai.google.dev/gemini-api/docs/interactions/computer-use
- Gemini models: https://ai.google.dev/gemini-api/docs/models
