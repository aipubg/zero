import fs from 'node:fs';

const f = 'E:\\zero\\services\\host\\native-gateway.mjs';
let c = fs.readFileSync(f, 'utf8');

const i = c.indexOf("case 'doctor.memory.status':");
if (i >= 0) {
  // Find the end of this case statement (next 'case ' or '}')
  const j = c.indexOf("case '", i + 1);
  const end = j >= 0 ? j : i + 500;
  const oldBlock = c.slice(i, j >= 0 ? j : i + 200);
  console.log('Found block:');
  console.log(JSON.stringify(oldBlock));
  
  const newBlock = `case 'doctor.memory.status':
        return { ok: true, agentId: params.agentId || 'zero', provider: 'zero-sqlite', searchRuntimeRegistered: true, embedding: { ok: true, provider: 'zero-sqlite', count: 0, engine: 'sqlite', embeddingProvider: 'none', available: true } };`;
  
  c = c.replace(oldBlock, newBlock);
  fs.writeFileSync(f, c);
  console.log('Replaced successfully');
  
  // Verify
  const c2 = fs.readFileSync(f, 'utf8');
  const i2 = c2.indexOf("case 'doctor.memory.status':");
  if (i2 >= 0) {
    console.log('After replacement:');
    console.log(JSON.stringify(c2.slice(i2, i2 + 200)));
  }
} else {
  console.log('Could not find doctor.memory.status case');
  const i = c.indexOf("doctor.memory.status");
  if (i >= 0) {
    console.log('Found text at', i);
    console.log(JSON.stringify(c.slice(i - 100, i + 200)));
  }
}
