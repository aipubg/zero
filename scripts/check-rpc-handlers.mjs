import fs from 'node:fs';

const c = fs.readFileSync('E:\\zero\\services\\host\\native-gateway.mjs', 'utf8');
const lines = c.split('\n');

const handlers = [
  { name: 'usage.summary', start: 3100 },
  { name: 'profile.get', start: 3121 },
  { name: 'device.pair.setupCode', start: 3141 },
  { name: 'approvals.list', start: 3147 },
  { name: 'secrets.list', start: 3166 },
  { name: 'dashboards.list', start: 3195 },
  { name: 'plugins.catalog', start: 3221 },
];

for (const { name, start } of handlers) {
  console.log(`=== ${name} @${start} ===`);
  for (let i = start - 1; i < Math.min(start + 15, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
  console.log();
}
