import fs from 'fs';
import path from 'path';

const base = 'E:/zero/backend/node_modules/.pnpm/openclaw@2026.10.6/node_modules/openclaw/dist';
for (const f of fs.readdirSync(base)) {
  if (f.endsWith('.js') || f.endsWith('.mjs')) {
    const c = fs.readFileSync(path.join(base, f), 'utf8');
    if (c.includes('models.mode') || c.includes('"merge"') && c.includes('"replace"')) {
      const idx = c.indexOf('"merge"');
      if (idx !== -1) {
        console.log('Found in:', f);
        console.log(c.substring(idx - 100, idx + 400));
        console.log('---');
        break;
      }
    }
  }
}
