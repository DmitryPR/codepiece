import * as schema from './schema';
import { INIT_SQL } from './init-sql';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';

export type Db = BetterSQLite3Database<typeof schema> | BunSQLiteDatabase<typeof schema>;

function resolveSqlitePath(): string {
  const raw = process.env.CODEPIECE_DB ?? 'data/codepiece.db';
  if (raw === ':memory:') return ':memory:';
  if (raw.startsWith('file:')) return raw.slice('file:'.length);
  return raw;
}

type Cached = {
  path: string;
  close: () => void;
  db: Db;
};

let cached: Cached | null = null;

export function getSqlitePath(): string {
  return resolveSqlitePath();
}

type BunSqliteCtor = new (path: string) => { exec: (sql: string) => void; close: () => void };

function openBun(path: string): Cached {
  // Runtime-only under Bun; Next.js (Node) never enters this branch.
  const { Database } = require('bun:sqlite') as { Database: BunSqliteCtor };
  const { drizzle } = require('drizzle-orm/bun-sqlite') as {
    drizzle: (client: InstanceType<BunSqliteCtor>, config: { schema: typeof schema }) => Db;
  };
  const sqlite = new Database(path);
  sqlite.exec('PRAGMA journal_mode = WAL;');
  sqlite.exec(INIT_SQL);
  const db = drizzle(sqlite, { schema }) as Db;
  return {
    path,
    db,
    close: () => sqlite.close(),
  };
}

function openBetter(path: string): Cached {
  const req = require('better-sqlite3') as { default?: unknown };
  const Database = (req.default ?? req) as new (path: string) => {
    pragma: (name: string) => unknown;
    exec: (sql: string) => void;
    close: () => void;
  };
  const { drizzle } = require('drizzle-orm/better-sqlite3') as {
    drizzle: (client: InstanceType<typeof Database>, config: { schema: typeof schema }) => Db;
  };
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  sqlite.exec(INIT_SQL);
  const db = drizzle(sqlite, { schema }) as Db;
  return {
    path,
    db,
    close: () => sqlite.close(),
  };
}

export function getDb(): Db {
  const path = resolveSqlitePath();
  if (cached?.path === path) return cached.db;

  if (path !== ':memory:') {
    const dir = dirname(path);
    if (dir && dir !== '.' && !existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  const isBunRuntime = typeof process !== 'undefined' && Boolean(process.versions?.bun);
  const next = isBunRuntime ? openBun(path) : openBetter(path);
  cached = next;
  return next.db;
}

export function resetDbCache(): void {
  if (cached) {
    cached.close();
    cached = null;
  }
}
