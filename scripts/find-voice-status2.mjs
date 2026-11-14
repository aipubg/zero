import fs from 'node:fs';

const c = fs.readFileSync('E:\\zero\\services\\host\\native-gateway.mjs', 'utf8');
const i = c.indexOf("case 'voice.status':");
if (i >= 0) {
  console.log(JSON.stringify(c.slice(i, i + 250)));
}