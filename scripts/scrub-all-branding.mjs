import fs from 'node:fs';
import path from 'node:path';

const REPLACEMENTS = [
  // CLI Commands
  ['zero node run --pair', 'zero node run --pair'],
  ['zero node install --force', 'zero node install --force'],
  ['zero config set nodeHost.workerRuns.enabled true', 'zero config set workerRuns.enabled true'],
  ['zero config set nodeHost', 'zero config set nodeHost'],
  ['zero node restart', 'zero node restart'],
  ['zero node identity', 'zero node identity'],
  ['zero node run', 'zero node run'],
  ['zero node', 'zero node'],
  ['zero connect', 'zero connect'],
  ['zero update status and run zero doctor before recovery', 'zero update status and run zero doctor before recovery'],
  ['zero update status', 'zero update status'],
  ['zero update repair', 'zero update repair'],
  ['zero update', 'zero update'],
  ['zero devices approve', 'zero devices approve'],
  ['zero devices', 'zero devices'],
  ['zero gateway auth-token --show', 'zero gateway auth-token --show'],
  ['zero gateway status --deep', 'zero gateway status --deep'],
  ['zero gateway run', 'zero gateway run'],
  ['zero dashboard --no-open', 'zero dashboard --no-open'],
  ['zero dashboard --json', 'zero dashboard --json'],
  ['zero dashboard', 'zero dashboard'],
  ['zero users list --json', 'zero users list --json'],
  ['zero users list', 'zero users list'],
  ['zero plugins reload', 'zero plugins reload'],
  ['zero agents set-identity --agent', 'zero agents set-identity --agent'],
  ['zero agents set-identity', 'zero agents set-identity'],
  ['zero browser extension setup', 'zero browser extension setup'],
  ['zero security audit', 'zero security audit'],
  ['zero storage init', 'zero storage init'],
  ['zero status', 'zero status'],
  ['zero triage', 'zero triage'],
  ['zero doctor', 'zero doctor'],
  ['zero zero', 'zero zero'],
  ['zero configure', 'zero configure'],

  // Protocols & URLs
  ['zero://gateway/add', 'zero://gateway/add'],
  ['zero://', 'zero://'],
  ['oc-pair://', 'zero-pair://'],
  ['https://chromewebstore.google.com/detail/zero/kcdjddhmeafeomebliikmbpblkmkfoig', 'http://127.0.0.1:18789/tools/chrome-extension'],
  ['https://apps.apple.com/app/zero-ai-that-does-things/id6780396132', 'http://127.0.0.1:18789'],
  ['https://github.com/zero/zero-windows-node/releases/latest', 'http://127.0.0.1:18789'],
  ['https://github.com/zero/zero/releases', 'http://127.0.0.1:18789'],
  ['https://github.com/zero', 'http://127.0.0.1:18789'],
  ['https://docs.zero.ai', 'http://127.0.0.1:18789'],
  ['https://zero.ai', 'http://127.0.0.1:18789'],
  ['http://zero.ai', 'http://127.0.0.1:18789'],
  ['docs.zero.ai', '127.0.0.1:18789'],
  ['zero.ai', '127.0.0.1:18789'],

  // Product descriptions
  ['Official zero mobile apps connect automatically after scanning.', 'Official Zero mobile apps connect automatically after scanning.'],
  ['Official zero mobile apps', 'Official Zero mobile apps'],
  ['zero mobile apps', 'Zero mobile apps'],
  ['zero mobile pairing', 'Zero mobile pairing'],
  ['zero companion', 'Zero companion'],
  ['zero device', 'Zero device'],
  ['zero Device', 'Zero Device'],
  ['zero Root', 'Zero Root'],
  ['zero Chat', 'Zero Chat'],
  ['Take zero everywhere', 'Take Zero everywhere'],
  ['full zero device', 'full Zero device'],
  ['an zero device', 'a Zero device'],
  ['Let zero drive', 'Let Zero drive'],
  ['Extend zero with channels', 'Extend Zero with channels'],
  ['zero documentation', 'Zero documentation'],
  ['Saved in zero', 'Saved in Zero'],
  ['into zero', 'into Zero'],
  ['from zero', 'from Zero'],
  ['Installing zero', 'Installing Zero'],
  ['Building zero', 'Building Zero'],
  ['zero Mac app', 'Zero Mac app'],
  ['zero creates a verified', 'Zero creates a verified'],
  ['zero will use', 'Zero will use'],
  ['zero waits for provider', 'Zero waits for provider'],
  ['zero is installed', 'Zero is installed'],
  ['zero is replaced', 'Zero is replaced'],
  ['zero web search', 'Zero web search'],
  ['zero', 'zero_pairing_qr'],
  ['brandName:`zero`', 'brandName:`Zero`'],
  ['brandName:e?.brandName??`zero`', 'brandName:e?.brandName??`Zero`'],
  ['e.brandName??`zero`', 'e.brandName??`Zero`'],
];

const targetDirs = [
  path.resolve('backend/node_modules/zero/dist/control-ui/assets'),
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
