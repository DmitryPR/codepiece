import { and, asc, eq, sql, notInArray } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { getUserFocusRepoLabel } from './queue';
import { cards, snippetMemos, swipes, users } from '../db/schema';

/** Drizzle Bun + better-sqlite3 share the same call shape at runtime; union `Db` breaks `.select({...})` inference. */
type SqliteQueryDb = BetterSQLite3Database<typeof schema>;

const q = (db: Db): SqliteQueryDb => db as SqliteQueryDb;

export function ensureUser(db: Db, id: string, displayName?: string | null) {
  q(db).insert(users)
    .values({ id, displayName: displayName ?? null, createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
}

export function cardExists(db: Db, cardId: string): boolean {
  return (
    q(db)
      .select({ id: cards.id })
      .from(cards)
      .where(eq(cards.id, cardId))
      .get() !== undefined
  );
}

/** Next unswiped card in this repo (stable order). */
function pickNextUnswipedInRepo(db: Db, userId: string, repoLabel: string) {
  const d = q(db);
  const swipedIds = d.select({ id: swipes.cardId }).from(swipes).where(eq(swipes.userId, userId));
  return (
    d
      .select()
      .from(cards)
      .where(and(eq(cards.repoLabel, repoLabel), notInArray(cards.id, swipedIds)))
      .orderBy(asc(cards.sourcePath), asc(cards.symbolName), asc(cards.id))
      .limit(1)
      .get() ?? null
  );
}

export function pickNextCard(db: Db, userId: string) {
  const focus = getUserFocusRepoLabel(db, userId);
  if (focus) {
    const inRepo = pickNextUnswipedInRepo(db, userId, focus);
    if (inRepo) return inRepo;
  }
  const d = q(db);
  const swipedIds = d.select({ id: swipes.cardId }).from(swipes).where(eq(swipes.userId, userId));
  return (
    d
      .select()
      .from(cards)
      .where(notInArray(cards.id, swipedIds))
      .orderBy(sql`RANDOM()`)
      .limit(1)
      .get() ?? null
  );
}

export function recordSwipe(db: Db, swipeId: string, userId: string, cardId: string, action: 'like' | 'skip') {
  q(db).insert(swipes)
    .values({
      id: swipeId,
      userId,
      cardId,
      action,
      createdAt: Date.now(),
    })
    .run();
}

export function getMemoBody(db: Db, userId: string, cardId: string): string | null {
  const row = q(db)
    .select({ body: snippetMemos.body })
    .from(snippetMemos)
    .where(and(eq(snippetMemos.userId, userId), eq(snippetMemos.cardId, cardId)))
    .get();
  return row?.body ?? null;
}

/** `body` must already be validated (trimmed, length). Empty string deletes the row. */
export function setMemoBody(db: Db, userId: string, cardId: string, body: string): void {
  const d = q(db);
  if (body === '') {
    d.delete(snippetMemos)
      .where(and(eq(snippetMemos.userId, userId), eq(snippetMemos.cardId, cardId)))
      .run();
    return;
  }
  const now = Date.now();
  d.insert(snippetMemos)
    .values({ userId, cardId, body, updatedAt: now })
    .onConflictDoUpdate({
      target: [snippetMemos.userId, snippetMemos.cardId],
      set: { body, updatedAt: now },
    })
    .run();
}
