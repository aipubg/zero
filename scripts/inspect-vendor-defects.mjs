import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'app', 'zero-control-ui', 'vendor', 'assets');

const a = fs.readFileSync(path.join(DIR, 'control-ui-boot-shared-ZuP0LiFD.js'), 'utf8');
const i = a.indexOf('mascot--neutral');
console.log('=== mascot render region ===');
console.log(JSON.stringify(a.slice(Math.max(0, i - 700), i + 400)));

const b = fs.readFileSync(path.join(DIR, 'sidebar-update-runtime-B2P2sMaT.js'), 'utf8');
const j = b.indexOf('null=null');
console.log('\n=== null=null region ===');
console.log(JSON.stringify(b.slice(Math.max(0, j - 300), j + 250)));
