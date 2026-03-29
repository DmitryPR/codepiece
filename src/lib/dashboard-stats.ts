import { desc, eq, inArray, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { cards, snippetMemos, swipes } from '../db/schema';

type SqliteQueryDb = BetterSQLite3Database<typeof schema>;

const q = (db: Db): SqliteQueryDb => db as SqliteQueryDb;

export type TopSnippetByLikes = {
  cardId: string;
  symbolName: string;
  repoLabel: string;
  sourcePath: string;
  likeCount: number;
};

export type DashboardStatsPayload = {
  cardsTotal: number;
  likesTotal: number;
  skipsTotal: number;
  cardsWithMemoCount: number;
  topByLikes: TopSnippetByLikes[];
};

const TOP_LIMIT = 15;

export function getDashboardStats(db: Db): DashboardStatsPayload {
  const cardsRow = q(db)
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(cards)
    .get();
  const likesRow = q(db)
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(swipes)
    .where(eq(swipes.action, 'like'))
    .get();
  const skipsRow = q(db)
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(swipes)
    .where(eq(swipes.action, 'skip'))
    .get();
  const memoRow = q(db)
    .select({ n: sql<number>`count(distinct ${snippetMemos.cardId})`.mapWith(Number) })
    .from(snippetMemos)
    .get();

  const rankRows = q(db)
    .select({
      cardId: swipes.cardId,
      likeCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(swipes)
    .where(eq(swipes.action, 'like'))
    .groupBy(swipes.cardId)
    .orderBy(desc(sql`count(*)`))
    .limit(TOP_LIMIT)
    .all();

  const ids = rankRows.map((r) => r.cardId);
  let topByLikes: TopSnippetByLikes[] = [];
  if (ids.length > 0) {
    const cardRows = q(db).select().from(cards).where(inArray(cards.id, ids)).all();
    const byId = new Map(cardRows.map((c) => [c.id, c]));
    topByLikes = rankRows
      .map((r) => {
        const c = byId.get(r.cardId);
        if (!c) return null;
        return {
          cardId: c.id,
          symbolName: c.symbolName,
          repoLabel: c.repoLabel,
          sourcePath: c.sourcePath,
          likeCount: r.likeCount,
        };
      })
      .filter((row): row is TopSnippetByLikes => row !== null);
  }

  return {
    cardsTotal: cardsRow?.n ?? 0,
    likesTotal: likesRow?.n ?? 0,
    skipsTotal: skipsRow?.n ?? 0,
    cardsWithMemoCount: memoRow?.n ?? 0,
    topByLikes,
  };
}
