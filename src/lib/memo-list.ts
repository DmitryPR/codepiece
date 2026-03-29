import { desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { cards, snippetMemos } from '../db/schema';

type SqliteQueryDb = BetterSQLite3Database<typeof schema>;
const q = (db: Db): SqliteQueryDb => db as SqliteQueryDb;

/** Max characters of `snippet_text` returned in memo history (full card can be huge). */
export const MEMO_HISTORY_SNIPPET_MAX = 2400;

export function truncateForMemoHistory(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

export type MemoHistoryItem = {
  cardId: string;
  body: string;
  updatedAt: number;
  symbolName: string;
  sourcePath: string;
  repoLabel: string;
  contextSummary: string;
  snippetPreview: string;
};

/** Memos for this user, newest first, joined to card metadata and truncated snippet. */
export function listMemoHistory(db: Db, userId: string, limit: number, offset: number): MemoHistoryItem[] {
  const rows = q(db)
    .select({
      cardId: snippetMemos.cardId,
      body: snippetMemos.body,
      updatedAt: snippetMemos.updatedAt,
      symbolName: cards.symbolName,
      sourcePath: cards.sourcePath,
      repoLabel: cards.repoLabel,
      contextSummary: cards.contextSummary,
      snippetText: cards.snippetText,
    })
    .from(snippetMemos)
    .innerJoin(cards, eq(snippetMemos.cardId, cards.id))
    .where(eq(snippetMemos.userId, userId))
    .orderBy(desc(snippetMemos.updatedAt))
    .limit(limit)
    .offset(offset)
    .all();

  return rows.map((r) => ({
    cardId: r.cardId,
    body: r.body,
    updatedAt: r.updatedAt,
    symbolName: r.symbolName,
    sourcePath: r.sourcePath,
    repoLabel: r.repoLabel,
    contextSummary: r.contextSummary,
    snippetPreview: truncateForMemoHistory(r.snippetText, MEMO_HISTORY_SNIPPET_MAX),
  }));
}
