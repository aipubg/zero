import fs from 'fs';
import path from 'path';

const base = 'E:/zero/backend/node_modules/.pnpm/openclaw@2026.10.6/node_modules/openclaw/dist';
for (const f of fs.readdirSync(base)) {
  if (f.endsWith('.js') || f.endsWith('.mjs')) {
    const c = fs.readFileSync(path.join(base, f), 'utf8');
    if (c.includes('mode === "replace"') || c.includes('models?.mode') || c.includes('models.mode') || c.includes('455') || c.includes('openrouter')) {
      if (c.includes('catalog') || c.includes('models') || c.includes('providers')) {
        console.log('Matches:', f);
      }
    }
  }
}
