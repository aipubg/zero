import test from 'node:test';
import assert from 'node:assert/strict';
import { PersistentMemoryStore } from '../index.mjs';

test('Zero Persistent Memory Store & Semantic Retrieval Engine', async (t) => {
  const store = new PersistentMemoryStore({ dbPath: ':memory:' });

  t.after(() => {
    store.close();
  });

  await t.test('requires non-empty content to remember', () => {
    assert.throws(() => {
      store.remember({ content: '' });
    }, /requires non-empty text content/);

    assert.throws(() => {
      store.remember({ content: null });
    }, /requires non-empty text content/);
  });

  await t.test('stores, retrieves, and updates memory records', () => {
    const mem = store.remember({
      id: 'user-pref-theme',
      category: 'preferences',
      content: 'User prefers obsidian dark theme and high contrast buttons',
      tags: ['ui', 'theme', 'dark-mode'],
      source: 'user',
    });

    assert.equal(mem.id, 'user-pref-theme');
    assert.equal(mem.category, 'preferences');
    assert.equal(mem.content, 'User prefers obsidian dark theme and high contrast buttons');
    assert.deepEqual(mem.tags, ['ui', 'theme', 'dark-mode']);
    assert.equal(mem.accessCount, 0);

    const fetched = store.getMemory('user-pref-theme');
    assert.equal(fetched.id, 'user-pref-theme');
    assert.equal(fetched.content, mem.content);

    // Update existing memory
    const updated = store.remember({
      id: 'user-pref-theme',
      category: 'preferences',
      content: 'User prefers obsidian dark theme with emerald accents',
      tags: ['ui', 'theme', 'emerald'],
    });
    assert.equal(updated.content, 'User prefers obsidian dark theme with emerald accents');
    assert.deepEqual(updated.tags, ['ui', 'theme', 'emerald']);
  });

  await t.test('recalls memories by semantic relevance, tags, and category filter', () => {
    store.remember({
      id: 'doc-1',
      category: 'work',
      content: 'Quarterly review report presentation is scheduled for next Monday',
      tags: ['planning', 'report'],
    });

    store.remember({
      id: 'doc-2',
      category: 'personal',
      content: 'Buy groceries including apples, milk, and coffee beans',
      tags: ['shopping', 'food'],
    });

    // Substring & keyword recall
    const results1 = store.recall('review report');
    assert.ok(results1.length >= 1);
    assert.equal(results1[0].id, 'doc-1');
    assert.equal(results1[0].accessCount, 1);

    // Tag recall
    const results2 = store.recall('shopping');
    assert.ok(results2.length >= 1);
    assert.equal(results2[0].id, 'doc-2');

    // Category filtering
    const workOnly = store.recall('', { category: 'work' });
    assert.ok(workOnly.every((m) => m.category === 'work'));
  });

  await t.test('lists memories with pagination and category filtering', () => {
    const list = store.listMemories({ limit: 10 });
    assert.ok(list.length >= 3);

    const filtered = store.listMemories({ category: 'preferences' });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, 'user-pref-theme');
  });

  await t.test('forgets memories by id', () => {
    const deleted = store.forget('user-pref-theme');
    assert.equal(deleted, true);

    const fetched = store.getMemory('user-pref-theme');
    assert.equal(fetched, null);
  });

  await t.test('prunes expired and infrequently accessed memories', () => {
    // Insert an old memory directly into db
    const oldTimestamp = Date.now() - 100 * 86400 * 1000;
    store.db.prepare(`
      INSERT INTO zero_memories (id, category, content, tags, source, confidence, created_at, accessed_at, access_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('old-mem', 'temp', 'Temporary note from 100 days ago', '[]', 'user', 1.0, oldTimestamp, oldTimestamp, 1);

    assert.ok(store.getMemory('old-mem') !== null);

    // Prune items older than 90 days with access_count < 2
    store.prune(90);

    assert.equal(store.getMemory('old-mem'), null);
  });
});
