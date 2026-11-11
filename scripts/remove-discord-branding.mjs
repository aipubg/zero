import fs from 'node:fs';
import path from 'node:path';

const dirs = [
  'backend/node_modules/openclaw/dist/control-ui/assets',
  'dist/web/assets',
];

let totalModifications = 0;

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js') && !file.endsWith('.html') && !file.endsWith('.css')) continue;
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // 1. Remove Discord from Help agentChip menu
    content = content.replace(/,\{href:`https:\/\/discord\.gg\/clawd`,icon:`users`,label:\(\)=>N\(`agentChip\.discord`\)\}/g, '');
    content = content.replace(/\{href:`https:\/\/discord\.gg\/clawd`,icon:`users`,label:\(\)=>N\(`agentChip\.discord`\)\},?/g, '');

    // 2. Remove Discord from apps page
    content = content.replace(/\{href:[A-Za-z0-9_$]+,icon:[A-Za-z0-9_$]+\.discord,labelKey:`appsPage\.linkDiscord`\},?/g, '');

    // 3. Nullify Discord invite links
    content = content.replace(/https:\/\/discord\.gg\/[a-zA-Z0-9_-]+/g, 'http://127.0.0.1:18789/help');
    content = content.replace(/https:\/\/discord\.com\/[a-zA-Z0-9_\/-]+/g, 'http://127.0.0.1:18789/help');

    // 4. Remove Discord platform invite entry
    content = content.replace(/\{label:\(\)=>N\(`communityInvite\.joinPlatform`,\{platform:`Discord`\}\),href:[A-Za-z0-9_$]+,icon:[A-Za-z0-9_$]+\.discord\},?/g, '');

    if (content !== original) {
      fs.writeFileSync(fullPath, content, 'utf8');
      totalModifications++;
      console.log(`Scrubbed Discord from: ${fullPath}`);
    }
  }
}

console.log(`Done! Modified ${totalModifications} files to permanently remove Discord.`);
