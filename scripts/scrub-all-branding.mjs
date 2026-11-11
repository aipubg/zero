import fs from 'node:fs';
import path from 'node:path';

const REPLACEMENTS = [
  // CLI Commands
  ['openclaw node run --pair', 'zero node run --pair'],
  ['openclaw node install --force', 'zero node install --force'],
  ['openclaw config set nodeHost.workerRuns.enabled true', 'zero config set workerRuns.enabled true'],
  ['openclaw config set nodeHost', 'zero config set nodeHost'],
  ['openclaw node restart', 'zero node restart'],
  ['openclaw node identity', 'zero node identity'],
  ['openclaw node run', 'zero node run'],
  ['openclaw node', 'zero node'],
  ['openclaw connect', 'zero connect'],
  ['openclaw update status and run zero doctor before recovery', 'zero update status and run zero doctor before recovery'],
  ['openclaw update status', 'zero update status'],
  ['openclaw update repair', 'zero update repair'],
  ['openclaw update', 'zero update'],
  ['openclaw devices approve', 'zero devices approve'],
  ['openclaw devices', 'zero devices'],
  ['openclaw gateway auth-token --show', 'zero gateway auth-token --show'],
  ['openclaw gateway status --deep', 'zero gateway status --deep'],
  ['openclaw gateway run', 'zero gateway run'],
  ['openclaw dashboard --no-open', 'zero dashboard --no-open'],
  ['openclaw dashboard --json', 'zero dashboard --json'],
  ['openclaw dashboard', 'zero dashboard'],
  ['openclaw users list --json', 'zero users list --json'],
  ['openclaw users list', 'zero users list'],
  ['openclaw plugins reload', 'zero plugins reload'],
  ['openclaw agents set-identity --agent', 'zero agents set-identity --agent'],
  ['openclaw agents set-identity', 'zero agents set-identity'],
  ['openclaw browser extension setup', 'zero browser extension setup'],
  ['openclaw security audit', 'zero security audit'],
  ['openclaw storage init', 'zero storage init'],
  ['openclaw status', 'zero status'],
  ['openclaw triage', 'zero triage'],
  ['openclaw doctor', 'zero doctor'],
  ['openclaw crabbox', 'zero crabbox'],
  ['openclaw configure', 'zero configure'],

  // Protocols & URLs
  ['openclaw://gateway/add', 'zero://gateway/add'],
  ['openclaw://', 'zero://'],
  ['oc-pair://', 'zero-pair://'],
  ['https://chromewebstore.google.com/detail/openclaw/kcdjddhmeafeomebliikmbpblkmkfoig', 'http://127.0.0.1:18789/tools/chrome-extension'],
  ['https://apps.apple.com/app/openclaw-ai-that-does-things/id6780396132', 'http://127.0.0.1:18789'],
  ['https://github.com/openclaw/openclaw-windows-node/releases/latest', 'http://127.0.0.1:18789'],
  ['https://github.com/openclaw/openclaw/releases', 'http://127.0.0.1:18789'],
  ['https://github.com/openclaw', 'http://127.0.0.1:18789'],
  ['https://docs.openclaw.ai', 'http://127.0.0.1:18789'],
  ['https://openclaw.ai', 'http://127.0.0.1:18789'],
  ['http://openclaw.ai', 'http://127.0.0.1:18789'],
  ['docs.openclaw.ai', '127.0.0.1:18789'],
  ['openclaw.ai', '127.0.0.1:18789'],

  // Product descriptions
  ['Official OpenClaw mobile apps connect automatically after scanning.', 'Official Zero mobile apps connect automatically after scanning.'],
  ['Official OpenClaw mobile apps', 'Official Zero mobile apps'],
  ['OpenClaw mobile apps', 'Zero mobile apps'],
  ['OpenClaw mobile pairing', 'Zero mobile pairing'],
  ['OpenClaw companion', 'Zero companion'],
  ['OpenClaw device', 'Zero device'],
  ['OpenClaw Device', 'Zero Device'],
  ['OpenClaw Root', 'Zero Root'],
  ['OpenClaw Chat', 'Zero Chat'],
  ['Take OpenClaw everywhere', 'Take Zero everywhere'],
  ['full OpenClaw device', 'full Zero device'],
  ['an OpenClaw device', 'a Zero device'],
  ['Let OpenClaw drive', 'Let Zero drive'],
  ['Extend OpenClaw with channels', 'Extend Zero with channels'],
  ['OpenClaw documentation', 'Zero documentation'],
  ['Saved in OpenClaw', 'Saved in Zero'],
  ['into OpenClaw', 'into Zero'],
  ['from OpenClaw', 'from Zero'],
  ['Installing OpenClaw', 'Installing Zero'],
  ['Building OpenClaw', 'Building Zero'],
  ['OpenClaw Mac app', 'Zero Mac app'],
  ['OpenClaw creates a verified', 'Zero creates a verified'],
  ['OpenClaw will use', 'Zero will use'],
  ['OpenClaw waits for provider', 'Zero waits for provider'],
  ['OpenClaw is installed', 'Zero is installed'],
  ['OpenClaw is replaced', 'Zero is replaced'],
  ['OpenClaw web search', 'Zero web search'],
  ['openclaw_pairing_qr', 'zero_pairing_qr'],
  ['brandName:`OpenClaw`', 'brandName:`Zero`'],
  ['brandName:e?.brandName??`OpenClaw`', 'brandName:e?.brandName??`Zero`'],
  ['e.brandName??`OpenClaw`', 'e.brandName??`Zero`'],
];

const targetDirs = [
  path.resolve('backend/node_modules/openclaw/dist/control-ui/assets'),
  path.resolve('dist/web/assets'),
];

let totalReplaced = 0;
let filesModified = 0;

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.html') || f.endsWith('.css'));
  for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    for (const [target, replacement] of REPLACEMENTS) {
      if (content.includes(target)) {
        content = content.replaceAll(target, replacement);
        changed = true;
        totalReplaced++;
      }
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, 'utf8');
      filesModified++;
    }
  }
}

console.log(`Successfully completed asset branding scrub: ${totalReplaced} replacements across ${filesModified} files.`);
