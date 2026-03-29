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
  /** Re-run idempotent DDL so new tables (e.g. after a pull) exist without restarting the dev server. */
  runMigrations: () => void;
};

let cached: Cached | null = null;

export function getSqlitePath(): string {
  return resolveSqlitePath();
}

type BunSqliteCtor = new (path: string) => { exec: (sql: string) => void; close: () => void };

function sqliteOpenError(path: string, phase: string, cause: unknown, hint?: string): Error {
  const detail = cause instanceof Error ? cause.message : String(cause);
  const tail =
    hint ??
    'Next.js uses better-sqlite3 on Node; after a Node or OS upgrade, run `bun install` from the repo root.';
  return new Error(`SQLite ${phase} failed (${path}): ${detail} — ${tail}`, {
    cause: cause instanceof Error ? cause : undefined,
  });
}

function openBun(path: string): Cached {
  try {
    // Runtime-only under Bun; Next.js (Node) never enters this branch.
    const { Database } = require('bun:sqlite') as { Database: BunSqliteCtor };
    const { drizzle } = require('drizzle-orm/bun-sqlite') as {
      drizzle: (client: InstanceType<BunSqliteCtor>, config: { schema: typeof schema }) => Db;
    };
    const sqlite = new Database(path);
    sqlite.exec('PRAGMA journal_mode = WAL;');
    const runMigrations = () => {
      sqlite.exec(INIT_SQL);
    };
    runMigrations();
    const db = drizzle(sqlite, { schema }) as Db;
    return {
      path,
      db,
      close: () => sqlite.close(),
      runMigrations,
    };
  } catch (e) {
    throw sqliteOpenError(path, 'open (Bun)', e, 'Check CODEPIECE_DB path and permissions.');
  }
}

function openBetter(path: string): Cached {
  try {
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
    const runMigrations = () => {
      sqlite.exec(INIT_SQL);
    };
    runMigrations();
    const db = drizzle(sqlite, { schema }) as Db;
    return {
      path,
      db,
      close: () => sqlite.close(),
      runMigrations,
    };
  } catch (e) {
    throw sqliteOpenError(path, 'open (Node / better-sqlite3)', e);
  }
}

export function getDb(): Db {
  const path = resolveSqlitePath();
  if (cached?.path === path) {
    cached.runMigrations();
    return cached.db;
  }

  if (path !== ':memory:') {
    const dir = dirname(path);
    if (dir && dir !== '.' && !existsSync(dir)) {
      try {
        mkdirSync(dir, { recursive: true });
      } catch (e) {
        throw sqliteOpenError(
          path,
          `create parent directory (${dir})`,
          e,
          'Fix filesystem permissions or set CODEPIECE_DB to a writable path.',
        );
      }
    }
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
