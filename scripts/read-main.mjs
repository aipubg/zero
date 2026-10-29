import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('E:/zero/.zero-data/fresh-workspace/gateway-state/agents/zero/agent/openclaw-agent.sqlite', { readOnly: true });
const row = db.prepare("SELECT entry_json FROM session_nodes WHERE session_key = 'agent:zero:main'").get();
console.log('agent:zero:main entry_json:', row?.entry_json);
db.close();
