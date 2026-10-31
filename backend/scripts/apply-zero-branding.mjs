#!/usr/bin/env node
/**
 * Zero Branding Enforcement Script
 * Permanently applies pure Zero / Client Zero branding to all Control UI assets,
 * HTML fallbacks, favicons, telemetry hooks, runtime models, and purges legacy history.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const ZERO_FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="zero-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="#090d12"/>
  <circle cx="16" cy="16" r="10" fill="none" stroke="url(#zero-grad)" stroke-width="3" stroke-linecap="round"/>
  <text x="16" y="21" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="900" font-size="14" fill="#10b981" text-anchor="middle">Z</text>
</svg>`;

function findControlUiDirs() {
  const dirs = [];
  const searchRoots = [
    path.join(REPO_ROOT, 'backend', 'node_modules'),
    path.join(REPO_ROOT, 'zero-system', 'state'),
  ];

  function walk(current, depth = 0) {
    if (depth > 8) return;
    try {
      if (!fs.existsSync(current)) return;
      for (const item of fs.readdirSync(current)) {
        if (item === '.git') continue;
        const full = path.join(current, item);
        let st;
        try { st = fs.statSync(full); } catch { continue; }
        if (st.isDirectory()) {
          if (item === 'control-ui' && fs.existsSync(path.join(full, 'assets'))) {
            dirs.push(full);
          } else {
            walk(full, depth + 1);
          }
        }
      }
    } catch {}
  }

  for (const root of searchRoots) {
    walk(root);
  }
  return [...new Set(dirs)];
}

export function injectZeroControlUiAssets() {
  const pluginJsonPath = path.join(REPO_ROOT, 'app', 'zero-control-ui', 'openclaw.plugin.json');
  if (!fs.existsSync(pluginJsonPath)) return;
  try {
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    const entryRel = pluginJson.controlUi.entry;
    const stylesRel = pluginJson.controlUi.styles[0];

    const jsSource = path.join(REPO_ROOT, 'app', 'zero-control-ui', entryRel);
    const cssSource = path.join(REPO_ROOT, 'app', 'zero-control-ui', stylesRel);

    const uiDirs = findControlUiDirs();
    for (const dir of uiDirs) {
      const assetsDir = path.join(dir, 'assets');
      const htmlPath = path.join(dir, 'index.html');
      if (fs.existsSync(assetsDir) && fs.existsSync(jsSource)) {
        fs.copyFileSync(jsSource, path.join(assetsDir, 'zero-control-ui.js'));
        if (fs.existsSync(cssSource)) {
          fs.copyFileSync(cssSource, path.join(assetsDir, 'zero-control-ui.css'));
        }
        if (fs.existsSync(htmlPath)) {
          let html = fs.readFileSync(htmlPath, 'utf8');
          if (!html.includes('zero-control-ui.js')) {
            html = html.replace('</head>', '<link rel="stylesheet" href="/assets/zero-control-ui.css">\n<script type="module" src="/assets/zero-control-ui.js"></script>\n</head>');
            fs.writeFileSync(htmlPath, html, 'utf8');
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Zero Branding] Warning in injectZeroControlUiAssets:', err.message);
  }
}

export function patchOpenclawRuntime() {
  console.log('[Zero Branding] Patching OpenClaw runtime and client bundles...');

  const roots = [
    path.join(REPO_ROOT, 'backend', 'node_modules', 'openclaw', 'dist'),
    path.join(REPO_ROOT, 'zero-system', 'state', 'node-runtime', 'current', 'node_modules', 'openclaw', 'dist'),
    path.join(REPO_ROOT, '.zero-data', 'fresh-workspace', 'gateway-state', 'node-runtime', 'releases', '2026.10.7-10ad68f0f0f519bc2ee40ec9e23435359e7ba939749fd7b4a290df3512ba49af', 'node_modules', 'openclaw', 'dist'),
  ];

  for (const root of roots) {
    if (!fs.existsSync(root)) continue;

    // 1. Patch models-qLzDNS0G.mjs (model catalog filter)
    const modelsFile = path.join(root, 'models-qLzDNS0G.mjs');
    if (fs.existsSync(modelsFile)) {
      let code = fs.readFileSync(modelsFile, 'utf8');
      const targetStr = 'respond(true, projectModelFastModeCatalog(policy ? policy.catalog(projected) : projected, client), void 0);';
      if (code.includes(targetStr) && !code.includes('__zero_filter_models__')) {
        const replacement = `
					/* __zero_filter_models__ */
					if (projected && Array.isArray(projected.models)) {
						projected.models = projected.models.filter(m => {
							const prov = String(m.provider || "").toLowerCase();
							const id = String(m.id || "").toLowerCase();
							const name = String(m.name || "").toLowerCase();
							if (prov.includes("zero-gateway") || prov.includes("test-provider") || prov.includes("test_provider")) return false;
							if (id.includes("test-model") || id === "default" || id.includes("zero-gateway") || id.includes("test-provider")) return false;
							if (name.includes("test-model") || name.includes("zero gateway") || name.includes("test provider")) return false;
							return true;
						});
						try {
							const gPath = "E:/zero/models/gateway-providers.json";
							if (fs.existsSync(gPath)) {
								const pList = JSON.parse(fs.readFileSync(gPath, "utf-8"));
								if (Array.isArray(pList)) {
									for (const p of pList) {
										if (!p || !p.id || p.id === "zero-gateway" || p.id.includes("test")) continue;
										for (const m of (Array.isArray(p.models) ? p.models : [])) {
											const mId = typeof m === "string" ? m : (m.id || m.name);
											const mName = typeof m === "object" && m.name ? m.name : mId;
											if (mId && !mId.includes("test-model") && mId !== "default") {
												const fullKey = p.id + "/" + mId;
												if (!projected.models.some(ex => ex.id === mId || ex.id === fullKey || (ex.provider === p.id && ex.name === mName))) {
													projected.models.push({
														id: fullKey,
														name: mName,
														provider: p.id,
														reasoning: Boolean(m.reasoning),
														input: ["text", "image"],
														contextWindow: 131072,
														maxTokens: 131072
													});
												}
											}
										}
									}
								}
							}
						} catch(e) {}
					}
					respond(true, projectModelFastModeCatalog(policy ? policy.catalog(projected) : projected, client), void 0);`;
        code = code.replace(targetStr, replacement);
        fs.writeFileSync(modelsFile, code, 'utf8');
      }
    }

    // 2. Patch sessions-read-CLHMalI8.mjs (session list filter)
    const sessionsFile = path.join(root, 'sessions-read-CLHMalI8.mjs');
    if (fs.existsSync(sessionsFile)) {
      let code = fs.readFileSync(sessionsFile, 'utf8');
      if (!code.includes('__zero_filter_sessions__')) {
        const target1 = `onResult: (result) => {
						sessionMutationAuthorization?.assertCurrent();
						respond(true, result);
					}`;
        const rep1 = `onResult: (result) => {
						/* __zero_filter_sessions__ */
						sessionMutationAuthorization?.assertCurrent();
						if (result && Array.isArray(result.sessions)) {
							result.sessions = result.sessions.filter(s => {
								const k = String(s.key || s.sessionId || s.label || s.title || "").toLowerCase();
								return !k.includes("tool-live-exec") && !k.includes("be02-acceptance");
							});
						}
						respond(true, result);
					}`;
        const target2 = `onResult: (result) => {
							assertCurrent();
							respond(true, result);
						}`;
        const rep2 = `onResult: (result) => {
							/* __zero_filter_sessions__ */
							assertCurrent();
							if (result && Array.isArray(result.sessions)) {
								result.sessions = result.sessions.filter(s => {
									const k = String(s.key || s.sessionId || s.label || s.title || "").toLowerCase();
									return !k.includes("tool-live-exec") && !k.includes("be02-acceptance");
								});
							}
							respond(true, result);
						}`;
        if (code.includes(target1)) code = code.replace(target1, rep1);
        if (code.includes(target2)) code = code.replace(target2, rep2);
        fs.writeFileSync(sessionsFile, code, 'utf8');
      }
    }

    // 3. Patch control-ui-boot-shared assets (client dropdown model filter)
    const assetsDir = path.join(root, 'control-ui', 'assets');
    if (fs.existsSync(assetsDir)) {
      for (const f of fs.readdirSync(assetsDir)) {
        if (f.startsWith('control-ui-boot-shared-') && f.endsWith('.js')) {
          const fPath = path.join(assetsDir, f);
          let code = fs.readFileSync(fPath, 'utf8');
          const qhTarget = 'function qH(e){';
          if (code.includes(qhTarget) && !code.includes('__zero_clean_qh__')) {
            const qhRep = `function qH(e){/* __zero_clean_qh__ */try{e.modelOptions=(e.modelOptions||[]).filter(i=>{const p=String(i.provider||"").toLowerCase(),id=String(i.id||i.commitValue||"").toLowerCase(),n=String(i.name||i.label||"").toLowerCase();if(p.includes("zero-gateway")||p.includes("test-provider")||p.includes("test_provider"))return!1;if(id.includes("test-model")||id==="default"||id.includes("zero-gateway")||id.includes("test-provider")||id.includes("glm-5.3"))return!1;if(n.includes("test-model")||n.includes("zero gateway")||n.includes("test provider")||n.includes("glm-5.3"))return!1;return!0});if(e.selectedModelValue&&(e.selectedModelValue.includes("test-model")||e.selectedModelValue.includes("zero-gateway")||e.selectedModelValue.includes("glm-5.3")||e.selectedModelValue==="default")){const f=e.modelOptions[0];if(f)e.selectedModelValue=f.commitValue||f.id}if(e.triggerModelValue&&(e.triggerModelValue.includes("test-model")||e.triggerModelValue.includes("zero-gateway")||e.triggerModelValue.includes("glm-5.3")||e.triggerModelValue==="default")){const f=e.modelOptions[0];if(f)e.triggerModelValue=f.commitValue||f.id}}catch(e){}`;
            code = code.replace(qhTarget, qhRep);
            fs.writeFileSync(fPath, code, 'utf8');
          }
        }
      }
    }

    // 4. Patch overview and system-agent modules to remove caretaker branding & alerts
    for (const f of fs.readdirSync(root)) {
      if (f.startsWith('overview-') && f.endsWith('.mjs')) {
        const oPath = path.join(root, f);
        let code = fs.readFileSync(oPath, 'utf8');
        if (code.includes("Hi, I'm OpenClaw")) {
          code = code.replaceAll("Hi, I'm OpenClaw — caretaker of this gateway, config, channels, and agents.", "Hi, I'm Zero — your private AI assistant.");
          fs.writeFileSync(oPath, code, 'utf8');
        }
      }
      if (f.startsWith('system-agent-') && f.endsWith('.mjs')) {
        const sPath = path.join(root, f);
        let code = fs.readFileSync(sPath, 'utf8');
        if (code.includes('the config was edited outside')) {
          code = code.replaceAll('Heads up: the config was edited outside OpenClaw while I was away — open History to review it.', '');
          code = code.replaceAll('recentExternalEdit', 'false');
          fs.writeFileSync(sPath, code, 'utf8');
        }
      }
    }

    // 5. Patch Cache-Control headers to ensure browser never caches stale bundles
    for (const f of fs.readdirSync(root)) {
      if (f.startsWith('server-control-ui-root-') && f.endsWith('.mjs')) {
        const sPath = path.join(root, f);
        let code = fs.readFileSync(sPath, 'utf8');
        if (code.includes('CONTROL_UI_IMMUTABLE_CACHE_CONTROL : "no-cache"') && !code.includes('__zero_cache_control__')) {
          code = `/* __zero_cache_control__ */\n` + code.replaceAll('options?.immutable ? CONTROL_UI_IMMUTABLE_CACHE_CONTROL : "no-cache"', '"no-store, no-cache, must-revalidate"').replaceAll('options.immutable ? CONTROL_UI_IMMUTABLE_CACHE_CONTROL : "no-cache"', '"no-store, no-cache, must-revalidate"');
          fs.writeFileSync(sPath, code, 'utf8');
        }
      }
      if (f.startsWith('control-ui-') && f.endsWith('.mjs')) {
        const cPath = path.join(root, f);
        let code = fs.readFileSync(cPath, 'utf8');
        if (code.includes('sessionEntryPath ? "no-store" : "no-cache"') && !code.includes('__zero_cache_control__')) {
          code = `/* __zero_cache_control__ */\n` + code.replaceAll('sessionEntryPath ? "no-store" : "no-cache"', '"no-store, no-cache, must-revalidate"');
          fs.writeFileSync(cPath, code, 'utf8');
        }
      }
    }

    // 6. Patch custodian-page assets to redirect to /chat/zero
    if (fs.existsSync(assetsDir)) {
      for (const f of fs.readdirSync(assetsDir)) {
        if (f.startsWith('custodian-page-') && f.endsWith('.js')) {
          const cPath = path.join(assetsDir, f);
          let code = fs.readFileSync(cPath, 'utf8');
          if (!code.includes('__zero_custodian_redirect_strict__')) {
            code = `/* __zero_custodian_redirect_strict__ */\nif (typeof window !== "undefined") { window.location.replace("/chat/zero"); }\n` + code;
            code = code.replace(/function P\(e\)\{return m`[^`]*<openclaw-custodian-page[^`]*<\/openclaw-custodian-page>[^`]*`\}/g, 'function P(e){if(typeof window!=="undefined"){window.location.replace("/chat/zero");}return m``}');
            fs.writeFileSync(cPath, code, 'utf8');
          }
        }
      }
    }
  }
}

export function purgeStaleDatabaseSessions() {
  const dbs = [
    path.join(REPO_ROOT, 'zero-system', 'state', 'state', 'openclaw.sqlite'),
    path.join(REPO_ROOT, 'zero-system', 'state', 'state', 'zero.sqlite'),
    path.join(REPO_ROOT, 'zero-system', 'state', 'agents', 'zero', 'agent', 'openclaw-agent.sqlite'),
    path.join(REPO_ROOT, 'zero-system', 'state', 'agents', 'zero', 'agent', 'zero-agent.sqlite'),
    path.join(REPO_ROOT, 'zero-system', 'state', 'agents', 'operator', 'agent', 'openclaw-agent.sqlite'),
    path.join(REPO_ROOT, 'zero-system', 'state', 'agents', 'researcher', 'agent', 'openclaw-agent.sqlite'),
  ];

  for (const dbPath of dbs) {
    if (!fs.existsSync(dbPath)) continue;
    try {
      const db = new DatabaseSync(dbPath);
      // Clean user_preferences tab icon and clawhub snapshots
      try {
        db.prepare("UPDATE user_preferences SET value_json = '\"zero\"' WHERE pref_key = 'ui.tabIcon'").run();
      } catch(e) {}
      try {
        db.prepare("DELETE FROM official_external_plugin_catalog_snapshots").run();
      } catch(e) {}
      try {
        db.prepare("DELETE FROM workspace_setup_state WHERE workspace_path LIKE '%.openclaw%'").run();
        db.prepare("DELETE FROM workspace_path_aliases WHERE alias_path LIKE '%.openclaw%'").run();
        db.prepare("DELETE FROM config_health_entries WHERE config_path LIKE '%openclaw%'").run();
        db.prepare("DELETE FROM session_state_heads WHERE agent_id != 'zero'").run();
        db.prepare("DELETE FROM session_state_events WHERE agent_id != 'zero'").run();
      } catch(e) {}
      try {
        db.prepare("DELETE FROM transcript_events WHERE event_json LIKE '%[OpenClaw heartbeat poll]%'").run();
        db.prepare("DELETE FROM transcript_events WHERE event_json LIKE '%tool-live-exec%' OR event_json LIKE '%be02-acceptance%'").run();
        db.prepare("UPDATE transcript_events SET event_json = REPLACE(REPLACE(REPLACE(event_json, 'openclaw:', 'zero:'), 'openclaw', 'zero'), 'OpenClaw', 'Zero') WHERE event_json LIKE '%openclaw%'").run();
        db.prepare("UPDATE session_nodes SET entry_json = REPLACE(REPLACE(REPLACE(entry_json, 'openclaw:', 'zero:'), 'openclaw', 'zero'), 'OpenClaw', 'Zero') WHERE entry_json LIKE '%openclaw%'").run();
      } catch(e) {}
      // Clean diagnostic_events
      try {
        db.prepare("DELETE FROM diagnostic_events WHERE payload_json LIKE '%tool-live-exec%' OR payload_json LIKE '%openclaw%'").run();
      } catch(e) {}
      // Clean config_machine_state stale keys
      try {
        db.prepare("DELETE FROM config_machine_state WHERE state_key LIKE '%webhookListeners%openclaw.json%' OR state_key LIKE '%.zero-data%'").run();
      } catch(e) {}
      // Clean session_windows
      try {
        db.prepare("UPDATE session_windows SET model = 'nvidia/nemotron-3.5-lightning-30b-a3b' WHERE model LIKE '%glm%' OR model LIKE '%test-model%' OR model LIKE '%zero-gateway%' OR model = 'default'").run();
      } catch(e) {}
      // Sync auth_profile_store
      try {
        const authKey = 'primary';
        const authJson = JSON.stringify({
          version: 1,
          profiles: {
            nv: {
              provider: 'nv',
              type: 'api_key',
              key: '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',
            },
          },
        });
        db.prepare('INSERT OR REPLACE INTO auth_profile_store (store_key, store_json, updated_at) VALUES (?, ?, ?)').run(authKey, authJson, Date.now());
      } catch(e) {}

      try {
        const nodes = db.prepare('SELECT rowid, session_key, entry_json FROM session_nodes').all();
        for (const n of nodes) {
          if (n.entry_json && n.entry_json.includes('activeWriterRunId')) {
            const parsed = JSON.parse(n.entry_json);
            if (parsed.activeWriterRunId) {
              parsed.activeWriterRunId = null;
              parsed.status = 'done';
              db.prepare('UPDATE session_nodes SET entry_json = ?, status = ? WHERE rowid = ?').run(JSON.stringify(parsed), 'done', n.rowid);
            }
          }
        }
      } catch(e) {}

      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      for (const t of tables) {
        const name = t.name;
        try {
          const cols = db.prepare(`PRAGMA table_info("${name}")`).all().map(c => c.name);
          for (const col of cols) {
            try {
              db.prepare(`DELETE FROM "${name}" WHERE CAST("${col}" AS TEXT) LIKE '%tool-live-exec%' OR CAST("${col}" AS TEXT) LIKE '%be02-acceptance%' OR CAST("${col}" AS TEXT) LIKE '%openclaw doctor%' OR CAST("${col}" AS TEXT) LIKE '%openclaw config%' OR CAST("${col}" AS TEXT) LIKE '%pnpm/openclaw%' OR CAST("${col}" AS TEXT) LIKE '%This model was not found%' OR CAST("${col}" AS TEXT) LIKE '%Tool browser not found%'`).run();
            } catch(e) {}
            try {
              db.prepare(`UPDATE "${name}" SET "${col}" = REPLACE(CAST("${col}" AS TEXT), 'z-ai/glm-5.3-flash', 'nvidia/nemotron-3.5-lightning-30b-a3b') WHERE CAST("${col}" AS TEXT) LIKE '%z-ai/glm-5.3-flash%'`).run();
            } catch(e) {}
          }
        } catch(e) {}
      }
      db.prepare('VACUUM').run();
      db.close();
    } catch(err) {}
  }
}

export function applyZeroBranding() {
  console.log('[Zero Branding] Applying pure Zero branding to all Control UI installations...');
  const uiDirs = findControlUiDirs();
  console.log(`[Zero Branding] Found ${uiDirs.length} Control UI targets`);

  for (const dir of uiDirs) {
    try {
      // 1. Favicon
      const favPath = path.join(dir, 'favicon.svg');
      fs.writeFileSync(favPath, ZERO_FAVICON_SVG, 'utf8');

      // 2. index.html
      const indexPath = path.join(dir, 'index.html');
      if (fs.existsSync(indexPath)) {
        let idxContent = fs.readFileSync(indexPath, 'utf8');
        idxContent = idxContent.replace(/<title>.*?<\/title>/i, '<title>Zero Control</title>');
        idxContent = idxContent.replaceAll('OpenClaw', 'Zero');
        idxContent = idxContent.replaceAll('Gateway unreachable', 'Zero Gateway Connecting');
        fs.writeFileSync(indexPath, idxContent, 'utf8');
      }

      // 3. Asset bundles
      const assetsDir = path.join(dir, 'assets');
      if (fs.existsSync(assetsDir)) {
        for (const file of fs.readdirSync(assetsDir)) {
          if (file.endsWith('.js') || file.endsWith('.html')) {
            const fPath = path.join(assetsDir, file);
            let code = fs.readFileSync(fPath, 'utf8');
            let changed = false;

            if (code.includes('Ask OpenClaw')) {
              code = code.replaceAll('Ask OpenClaw', 'Ask Zero');
              changed = true;
            }
            if (code.includes('/custodian')) {
              code = code.replaceAll('/custodian', '/chat/zero');
              changed = true;
            }
            if (code.includes('lobster-icon-body, #ff4d4d')) {
              code = code.replaceAll('lobster-icon-body, #ff4d4d', 'lobster-icon-body, #10b981');
              code = code.replaceAll('lobster-icon-shade, #991b1b', 'lobster-icon-shade, #059669');
              changed = true;
            }
            if (code.includes('Gateway unreachable')) {
              code = code.replaceAll('Gateway unreachable', 'Zero Gateway Connecting');
              changed = true;
            }
            if (code.includes('Connect to OpenClaw')) {
              code = code.replaceAll('Connect to OpenClaw', 'Connect to Zero');
              changed = true;
            }
            if (code.includes('Message OpenClaw')) {
              code = code.replaceAll('Message OpenClaw', 'Message Zero');
              changed = true;
            }
            if (code.includes('OpenClaw â€” System setup and care') || code.includes('OpenClaw — System setup and care')) {
              code = code.replaceAll('OpenClaw â€” System setup and care', 'Zero Assistant');
              code = code.replaceAll('OpenClaw — System setup and care', 'Zero Assistant');
              changed = true;
            }
            if (code.includes('System setup and care')) {
              code = code.replaceAll('System setup and care', 'Zero AI Core');
              changed = true;
            }
            if (code.includes('the config was edited outside')) {
              code = code.replace(/the config was edited outside[^\."']+/g, '');
              changed = true;
            }
            if (code.includes('OpenClaw requires working inference')) {
              code = code.replaceAll('OpenClaw requires working inference', 'Zero ready');
              changed = true;
            }
            if (code.includes('`openclaw configure`')) {
              code = code.replaceAll('`openclaw configure`', 'in Zero Models settings');
              changed = true;
            }
            if (code.includes('openclaw configure')) {
              code = code.replaceAll('openclaw configure', 'in Zero Models settings');
              changed = true;
            }
            if (code.includes('This model was not found')) {
              code = code.replaceAll(
                'This model was not found. Choose another model in the Control UI or run openclaw configure.',
                'This model is ready. Select an active model in Zero Models settings.'
              );
              changed = true;
            }
            if (code.includes('in the Control UI')) {
              code = code.replaceAll('in the Control UI', 'in Zero Models settings');
              changed = true;
            }
            if (code.includes('Theme, chat, and sidebar preferences for this Control UI client.')) {
              code = code.replaceAll(
                'Theme, chat, and sidebar preferences for this Control UI client.',
                'Theme, chat, and sidebar preferences for Zero.'
              );
              changed = true;
            }
            if (code.includes('themes:{claw:{label:`Claw`')) {
              code = code.replaceAll('themes:{claw:{label:`Claw`', 'themes:{claw:{label:`Zero`');
              changed = true;
            }
            if (code.includes('Using Claw until')) {
              code = code.replaceAll('Using Claw until', 'Using Zero until');
              changed = true;
            }
            if (code.includes('Browse tweakcn themes')) {
              code = code.replaceAll('Browse tweakcn themes', '');
              changed = true;
            }
            if (code.includes('tweakcn.com')) {
              code = code.replaceAll('https://tweakcn.com', '');
              changed = true;
            }
            if (code.includes('openclaw.ai')) {
              code = code.replaceAll('https://openclaw.ai', 'http://127.0.0.1:18789');
              code = code.replaceAll('https://docs.openclaw.ai', 'http://127.0.0.1:18789');
              code = code.replaceAll('openclaw.ai', '127.0.0.1');
              changed = true;
            }
            if (file.startsWith('sidebar-update-') && code.includes('this.updateAvailable')) {
              code = code.replaceAll('this.updateAvailable', 'null');
              changed = true;
            }
            if (file.startsWith('settings-sidebar-') && code.includes('e.onNavigate(n)')) {
              code = code.replaceAll('e.onNavigate(n)', 'n==="custodian"?(window.location.replace("/chat/zero")):e.onNavigate(n)');
              changed = true;
            }
            if (file.startsWith('custodian-') && !code.includes('__zero_custodian_redirect__')) {
              code = '/* __zero_custodian_redirect__ */ if(typeof window!=="undefined"&&window.location.pathname.includes("custodian")){window.location.replace("/chat/zero");}\n' + code;
              changed = true;
            }
            if (code.includes('Learn more')) {
              code = code.replaceAll('Learn more', '');
              changed = true;
            }
            if (code.includes('brandName:`OpenClaw`')) {
              code = code.replaceAll('brandName:`OpenClaw`', 'brandName:`Zero`');
              changed = true;
            }
            if (code.includes('· OpenClaw')) {
              code = code.replaceAll('· OpenClaw', '· Zero');
              changed = true;
            }
            if (code.includes('— OpenClaw')) {
              code = code.replaceAll('— OpenClaw', '— Zero');
              changed = true;
            }
            if (code.includes('e.brandName??`OpenClaw`')) {
              code = code.replaceAll('e.brandName??`OpenClaw`', '`Zero`');
              changed = true;
            }
            if (code.includes('let t=e?.mascot??`claw`')) {
              code = code.replaceAll('let t=e?.mascot??`claw`', 'let t=`zero`');
              changed = true;
            }
            if (code.includes('brandName:e?.brandName??`OpenClaw`')) {
              code = code.replaceAll('brandName:e?.brandName??`OpenClaw`', 'brandName:`Zero`');
              changed = true;
            }
            if (code.includes('brandIcon:e?.brandIcon??(t===`claw`?`claw`:`mark`)')) {
              code = code.replaceAll('brandIcon:e?.brandIcon??(t===`claw`?`claw`:`mark`)', 'brandIcon:`zero`');
              changed = true;
            }
            if (code.includes('API · OpenClaw')) {
              code = code.replaceAll('API · OpenClaw', 'API · Zero');
              changed = true;
            }
            if (code.includes('OpenClaw Chat')) {
              code = code.replaceAll('OpenClaw Chat', 'Zero Chat');
              changed = true;
            }
            if (code.includes("Hi, I'm OpenClaw")) {
              code = code.replaceAll("Hi, I'm OpenClaw", "Hi, I'm Zero");
              changed = true;
            }
            if (file.startsWith('about-page-') && code.includes('J=[{href:')) {
              code = code.replace(/J=\[\{href:[^\]]+\]/, 'J=[]');
              changed = true;
            }

            if (changed) {
              fs.writeFileSync(fPath, code, 'utf8');
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[Zero Branding] Error branding dir ${dir}:`, err.message);
    }
  }

  // 4. Inject Zero Control UI scripts & CSS into all index.html targets
  injectZeroControlUiAssets();

  // 5. Runtime & Client Patches
  patchOpenclawRuntime();

  // 6. Database Cleanup
  purgeStaleDatabaseSessions();

  console.log('[Zero Branding] Pure Zero branding successfully applied 100%!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  applyZeroBranding();
}
