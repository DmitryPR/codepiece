import { eq, sql, notInArray } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { cards, swipes, users } from '../db/schema';

/** Drizzle Bun + better-sqlite3 share the same call shape at runtime; union `Db` breaks `.select({...})` inference. */
type SqliteQueryDb = BetterSQLite3Database<typeof schema>;

const q = (db: Db): SqliteQueryDb => db as SqliteQueryDb;

export function ensureUser(db: Db, id: string, displayName?: string | null) {
  q(db).insert(users)
    .values({ id, displayName: displayName ?? null, createdAt: Date.now() })
    .onConflictDoNothing()
    .run();
}

export function pickNextCard(db: Db, userId: string) {
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
