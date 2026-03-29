import { type SQL, and, asc, eq, notInArray, or, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { cards, swipes, userCardQueue, users } from '../db/schema';

type SqliteQueryDb = BetterSQLite3Database<typeof schema>;
const q = (db: Db): SqliteQueryDb => db as SqliteQueryDb;

export type FocusRepoProgress = {
  total: number;
  reviewed: number;
  /** Cards in this repo the user has not swiped yet (like or skip). */
  pending: number;
};

export type PendingPreview = {
  cardId: string;
  symbolName: string;
  sourcePath: string;
  repoLabel: string;
};

/** Distinct repo labels present in `cards`, sorted. */
export function listRepoLabels(db: Db): string[] {
  const rows = q(db).selectDistinct({ label: cards.repoLabel }).from(cards).orderBy(asc(cards.repoLabel)).all();
  return rows.map((r) => r.label);
}

export function getUserFocusRepoLabel(db: Db, userId: string): string | null {
  const row = q(db).select({ label: users.focusRepoLabel }).from(users).where(eq(users.id, userId)).get();
  const v = row?.label;
  return v && v.length > 0 ? v : null;
}

export function repoHasCards(db: Db, repoLabel: string): boolean {
  const row = q(db)
    .select({ one: sql<number>`1` })
    .from(cards)
    .where(eq(cards.repoLabel, repoLabel))
    .limit(1)
    .get();
  return row !== undefined;
}

/** Clears legacy per-card queue rows and sets focus (null = no focus, full-deck random feed). */
export function setUserFocusRepo(db: Db, userId: string, repoLabel: string | null): void {
  const d = q(db);
  d.delete(userCardQueue).where(eq(userCardQueue.userId, userId)).run();
  d.update(users).set({ focusRepoLabel: repoLabel }).where(eq(users.id, userId)).run();
}

export function getFocusRepoProgress(db: Db, userId: string, repoLabel: string): FocusRepoProgress {
  const d = q(db);
  const totalRow = d.select({ n: sql<number>`count(*)` }).from(cards).where(eq(cards.repoLabel, repoLabel)).get();
  const total = Number(totalRow?.n ?? 0);
  const reviewedRow = d
    .select({ n: sql<number>`count(distinct ${swipes.cardId})` })
    .from(swipes)
    .innerJoin(cards, eq(cards.id, swipes.cardId))
    .where(and(eq(swipes.userId, userId), eq(cards.repoLabel, repoLabel)))
    .get();
  const reviewed = Number(reviewedRow?.n ?? 0);
  const pending = Math.max(0, total - reviewed);
  return { total, reviewed, pending };
}

/** Next unswiped cards in the repo (for home preview), stable order. */
export function getPendingPreviewsInRepo(db: Db, userId: string, repoLabel: string, limit: number): PendingPreview[] {
  const d = q(db);
  const lim = Math.min(Math.max(limit, 1), 50);
  const swipedSub = d.select({ id: swipes.cardId }).from(swipes).where(eq(swipes.userId, userId));
  const rows = d
    .select({
      cardId: cards.id,
      symbolName: cards.symbolName,
      sourcePath: cards.sourcePath,
      repoLabel: cards.repoLabel,
    })
    .from(cards)
    .where(and(eq(cards.repoLabel, repoLabel), notInArray(cards.id, swipedSub)))
    .orderBy(asc(cards.sourcePath), asc(cards.symbolName), asc(cards.id))
    .limit(lim)
    .all();
  return rows.map((r) => ({
    cardId: r.cardId,
    symbolName: r.symbolName,
    sourcePath: r.sourcePath,
    repoLabel: r.repoLabel,
  }));
}

export type BrowseRow = {
  id: string;
  symbolName: string;
  sourcePath: string;
  repoLabel: string;
};

export function browseCards(
  db: Db,
  opts: {
    limit: number;
    offset: number;
    q?: string | null;
  },
): BrowseRow[] {
  const d = q(db);
  const lim = Math.min(Math.max(opts.limit, 1), 100);
  const off = Math.max(opts.offset, 0);
  const term = opts.q?.trim();
  const parts: SQL[] = [];
  if (term) {
    const pattern = `%${term.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    parts.push(
      or(
        sql`${cards.symbolName} LIKE ${pattern} ESCAPE '\\'`,
        sql`${cards.sourcePath} LIKE ${pattern} ESCAPE '\\'`,
        sql`${cards.repoLabel} LIKE ${pattern} ESCAPE '\\'`,
      )!,
    );
  }
  const whereClause = parts.length === 0 ? undefined : parts[0];

  const base = d
    .select({
      id: cards.id,
      symbolName: cards.symbolName,
      sourcePath: cards.sourcePath,
      repoLabel: cards.repoLabel,
    })
    .from(cards);
  const query = whereClause ? base.where(whereClause) : base;
  return query.orderBy(cards.repoLabel, cards.sourcePath, cards.symbolName).limit(lim).offset(off).all();
}
