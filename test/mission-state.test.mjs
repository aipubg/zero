import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { executeMissionPlan, MissionStateStore } from '../packages/capability-engine/mission-state.mjs';

test('mission state persists ordered outcomes and continues after one app fails', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zero-missions-'));
  const dbPath = path.join(directory, 'missions.sqlite');
  let store = new MissionStateStore({ dbPath });
  try {
    const mission = store.createMission({
      sessionId: 'session_test',
      runId: 'run_test',
      goal: 'Open YouTube, then Spotify, then WhatsApp',
      subMissions: [
        { app: 'YouTube', goal: 'Play a video', order: 1 },
        { app: 'Spotify', goal: 'Play a song', order: 2 },
        { app: 'WhatsApp', goal: 'Send a message', order: 3 },
      ],
    });
    const attempted = [];
    const execution = await executeMissionPlan({
      store,
      missionId: mission.id,
      executeSubMission: async subMission => {
        attempted.push(subMission.app);
        if (subMission.app === 'YouTube') throw new Error('No notifications available');
        return {
          ok: true,
          content: `${subMission.app} attempted`,
          execution: {
            outcome: subMission.app === 'Spotify' ? 'COMPLETED' : 'PARTIAL',
            completedActions: 1,
          },
        };
      },
    });

    assert.deepEqual(attempted, ['YouTube', 'Spotify', 'WhatsApp']);
    assert.deepEqual(execution.mission.subMissions.map(item => item.status), ['FAILED', 'COMPLETED', 'PARTIAL_FALLBACK']);
    assert.equal(execution.mission.status, 'PARTIAL');
    store.close();
    store = new MissionStateStore({ dbPath });
    assert.equal(store.getMission(mission.id).status, 'PARTIAL');
    assert.deepEqual(store.getMission(mission.id).subMissions.map(item => item.app), ['YouTube', 'Spotify', 'WhatsApp']);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
