import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { runScan, resetDbCache } from './run-scan';
import { getDb } from '../db/client';
import { cards } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('runScan integration', () => {
  let root: string;
  let mem: string;
  let prevDb: string | undefined;

  beforeEach(() => {
    prevDb = process.env.CODEPIECE_DB;
    process.env.CODEPIECE_DB = ':memory:';
    resetDbCache();
    root = join(process.cwd(), 'tmp-scan-' + Date.now());
    mem = join(root, 'memory.json');
    mkdirSync(join(root, 'src'), { recursive: true });
    writeFileSync(
      join(root, 'src', 'demo.ts'),
      `/** Demo fn */
export function demo(x: number): number {
  return x * 2;
}
`,
    );
  });

  afterEach(() => {
    process.env.CODEPIECE_DB = prevDb;
    resetDbCache();
    if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
  });

  test('upserts cards from local tree', () => {
    const r = runScan({
      targetRepo: root,
      memoryPath: mem,
      repoLabel: 'test-repo',
      licenseHint: 'MIT',
    });
    expect(r.filesProcessed).toBeGreaterThanOrEqual(1);
    expect(r.cardsUpserted).toBeGreaterThanOrEqual(1);

    const db = getDb();
    const row = db.select().from(cards).where(eq(cards.symbolName, 'demo')).get();
    expect(row).toBeDefined();
    expect(row?.snippetText).toContain('return x * 2');
  });
});
