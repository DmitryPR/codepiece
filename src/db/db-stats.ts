#!/usr/bin/env bun
/**
 * Print row counts and swipe breakdown for CODEPIECE_DB (default data/codepiece.db).
 * Read-only; safe to run while dev server is running (may see slightly stale counts mid-transaction).
 */
import { Database } from 'bun:sqlite';
import { existsSync, statSync } from 'fs';

import { getSqlitePath } from './client';

function fmtKiB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function fileSizeLabel(path: string, label: string): void {
  try {
    const b = statSync(path).size;
    console.log(`  ${label}: ${fmtKiB(b)}`);
  } catch {
    console.log(`  ${label}: (missing)`);
  }
}

const path = getSqlitePath();
if (path === ':memory:') {
  console.error('db:stats: set CODEPIECE_DB to a file path (not :memory:).');
  process.exit(1);
}
if (!existsSync(path)) {
  console.error(`db:stats: file not found: ${path}`);
  process.exit(1);
}

const db = new Database(path, { readonly: true });

const users = db.query('SELECT COUNT(*) AS n FROM users').get() as { n: number };
const cards = db.query('SELECT COUNT(*) AS n FROM cards').get() as { n: number };
const swipes = db.query('SELECT COUNT(*) AS n FROM swipes').get() as { n: number };
let snippetMemos = 0;
try {
  snippetMemos = (db.query('SELECT COUNT(*) AS n FROM snippet_memos').get() as { n: number }).n;
} catch {
  /* legacy DB before snippet_memos table */
}

const page = db.query('PRAGMA page_count').get() as { page_count: number };
const psize = db.query('PRAGMA page_size').get() as { page_size: number };
const logicalBytes = page.page_count * psize.page_size;

const byAction = db
  .query('SELECT action, COUNT(*) AS n FROM swipes GROUP BY action ORDER BY n DESC')
  .all() as { action: string; n: number }[];

const byRepo = db
  .query(
    'SELECT repo_label, COUNT(*) AS n FROM cards GROUP BY repo_label ORDER BY n DESC LIMIT 20',
  )
  .all() as { repo_label: string; n: number }[];

const distinctSwiped = db
  .query('SELECT COUNT(DISTINCT card_id) AS n FROM swipes')
  .get() as { n: number };

const byUser = db
  .query('SELECT user_id, COUNT(*) AS n FROM swipes GROUP BY user_id ORDER BY n DESC')
  .all() as { user_id: string; n: number }[];

console.log(`Database: ${path}`);
console.log(`Logical size (page_count × page_size): ${fmtKiB(logicalBytes)}`);
console.log('');
console.log('Rows');
console.log(`  users:          ${users.n}`);
console.log(`  cards:          ${cards.n}`);
console.log(`  swipes:         ${swipes.n}`);
console.log(`  snippet_memos:  ${snippetMemos}`);
console.log('');
console.log('On disk');
fileSizeLabel(path, 'main (.db)');
fileSizeLabel(`${path}-wal`, 'WAL (-wal)');
fileSizeLabel(`${path}-shm`, 'shm (-shm)');
console.log('');
console.log('Swipes by action');
for (const r of byAction) {
  console.log(`  ${r.action}: ${r.n}`);
}
if (byAction.length === 0) {
  console.log('  (none)');
}
console.log('');
console.log(`Distinct cards with ≥1 swipe: ${distinctSwiped.n}`);
console.log('');
console.log('Swipes per user (id prefix)');
for (const r of byUser) {
  const prefix = r.user_id.slice(0, 8);
  console.log(`  ${prefix}…: ${r.n}`);
}
if (byUser.length === 0) {
  console.log('  (none)');
}
console.log('');
console.log('Cards by repo_label (top 20)');
for (const r of byRepo) {
  console.log(`  ${r.repo_label}: ${r.n}`);
}
if (byRepo.length === 0) {
  console.log('  (none)');
}

db.close();
