import { describe, expect, test, afterEach } from 'bun:test';
import { loadMemory, saveMemory, emptyMemory } from './memory';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const p = join(process.cwd(), 'tmp-memory-test.json');

afterEach(() => {
  if (existsSync(p)) rmSync(p, { force: true });
});

describe('scan memory', () => {
  test('load missing returns empty', () => {
    const m = loadMemory(join(process.cwd(), 'nope-does-not-exist.json'));
    expect(m.files).toEqual({});
  });

  test('roundtrip', () => {
    const mem = emptyMemory();
    mem.files['a.ts'] = { contentHash: 'abc', status: 'processed' };
    saveMemory(p, mem);
    const again = loadMemory(p);
    expect(again.files['a.ts']?.contentHash).toBe('abc');
  });
});
