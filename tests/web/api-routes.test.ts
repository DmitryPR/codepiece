import { describe, expect, test, beforeEach, afterEach } from 'bun:test';
import { resetDbCache, getDb } from '../../src/db/client';
import { cards, snippetMemos } from '../../src/db/schema';
import { ensureUser, recordSwipe } from '../../src/lib/feed';
import { stableCardId } from '../../src/lib/card-id';
import { GET as GET_NEXT } from '../../app/api/cards/next/route';
import { GET as GET_DASHBOARD_STATS } from '../../app/api/dashboard/stats/route';
import { PUT as PUT_MEMO } from '../../app/api/cards/memo/route';
import { POST as POST_SWIPE } from '../../app/api/swipes/route';

describe('Next.js API routes (integration)', () => {
  let prevDb: string | undefined;

  beforeEach(() => {
    prevDb = process.env.CODEPIECE_DB;
    process.env.CODEPIECE_DB = ':memory:';
    resetDbCache();
    const db = getDb();
    ensureUser(db, 'user-1', null);
    const id = stableCardId('lab', 'x.ts', 'fn');
    db.insert(cards)
      .values({
        id,
        sourcePath: 'x.ts',
        symbolName: 'fn',
        snippetText: 'export function fn() {}',
        lineStart: 1,
        lineEnd: 1,
        contextSummary: 'test',
        repoLabel: 'lab',
        license: 'MIT',
        commitSha: null,
      })
      .run();
  });

  afterEach(() => {
    process.env.CODEPIECE_DB = prevDb;
    resetDbCache();
  });

  test('GET /api/cards/next returns card for user', async () => {
    const res = await GET_NEXT(
      new Request('http://localhost/api/cards/next', {
        headers: { cookie: 'cp_uid=user-1' },
      }),
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as { card: { id: string; symbolName: string; memo: string | null } | null };
    expect(j.card).not.toBeNull();
    expect(j.card?.symbolName).toBe('fn');
    expect(j.card?.memo).toBeNull();
  });

  test('PUT /api/cards/memo then GET next includes memo', async () => {
    const id = stableCardId('lab', 'x.ts', 'fn');
    const put = await PUT_MEMO(
      new Request('http://localhost/api/cards/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', cookie: 'cp_uid=user-1' },
        body: JSON.stringify({ cardId: id, body: '  my note  ' }),
      }),
    );
    expect(put.status).toBe(200);

    const res = await GET_NEXT(
      new Request('http://localhost/api/cards/next', {
        headers: { cookie: 'cp_uid=user-1' },
      }),
    );
    const j = (await res.json()) as { card: { memo: string | null } | null };
    expect(j.card?.memo).toBe('my note');
  });

  test('PUT /api/cards/memo empty clears memo', async () => {
    const id = stableCardId('lab', 'x.ts', 'fn');
    await PUT_MEMO(
      new Request('http://localhost/api/cards/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', cookie: 'cp_uid=user-1' },
        body: JSON.stringify({ cardId: id, body: '   ' }),
      }),
    );
    const res = await GET_NEXT(
      new Request('http://localhost/api/cards/next', {
        headers: { cookie: 'cp_uid=user-1' },
      }),
    );
    const j = (await res.json()) as { card: { memo: string | null } | null };
    expect(j.card?.memo).toBeNull();
  });

  test('PUT /api/cards/memo rejects over 600 code points', async () => {
    const id = stableCardId('lab', 'x.ts', 'fn');
    const body = 'a'.repeat(601);
    const put = await PUT_MEMO(
      new Request('http://localhost/api/cards/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', cookie: 'cp_uid=user-1' },
        body: JSON.stringify({ cardId: id, body }),
      }),
    );
    expect(put.status).toBe(400);
  });

  test('PUT /api/cards/memo 401 without user', async () => {
    const id = stableCardId('lab', 'x.ts', 'fn');
    const put = await PUT_MEMO(
      new Request('http://localhost/api/cards/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: id, body: 'x' }),
      }),
    );
    expect(put.status).toBe(401);
  });

  test('PUT /api/cards/memo 404 unknown card', async () => {
    const put = await PUT_MEMO(
      new Request('http://localhost/api/cards/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', cookie: 'cp_uid=user-1' },
        body: JSON.stringify({ cardId: 'no-such-card', body: 'x' }),
      }),
    );
    expect(put.status).toBe(404);
  });

  test('POST /api/swipes then next card empty', async () => {
    const id = stableCardId('lab', 'x.ts', 'fn');
    const swipe = await POST_SWIPE(
      new Request('http://localhost/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          cookie: 'cp_uid=user-1',
        },
        body: JSON.stringify({ cardId: id, action: 'like' }),
      }),
    );
    expect(swipe.status).toBe(200);

    const res = await GET_NEXT(
      new Request('http://localhost/api/cards/next', {
        headers: { cookie: 'cp_uid=user-1' },
      }),
    );
    const j = (await res.json()) as { card: unknown };
    expect(j.card).toBeNull();
  });

  test('POST /api/swipes rejects bad action', async () => {
    const id = stableCardId('lab', 'x.ts', 'fn');
    const swipe = await POST_SWIPE(
      new Request('http://localhost/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie: 'cp_uid=user-1' },
        body: JSON.stringify({ cardId: id, action: 'nope' }),
      }),
    );
    expect(swipe.status).toBe(400);
  });

  test('GET /api/dashboard/stats 401 without user', async () => {
    const res = await GET_DASHBOARD_STATS(new Request('http://localhost/api/dashboard/stats'));
    expect(res.status).toBe(401);
  });

  test('GET /api/dashboard/stats scopes swipes, memos, and rank list to session user', async () => {
    const db = getDb();
    const idA = stableCardId('lab', 'x.ts', 'fn');
    const idB = stableCardId('lab', 'b.ts', 'bar');
    db.insert(cards)
      .values({
        id: idB,
        sourcePath: 'b.ts',
        symbolName: 'bar',
        snippetText: 'export const bar = 1',
        lineStart: 1,
        lineEnd: 1,
        contextSummary: 'test',
        repoLabel: 'lab',
        license: 'MIT',
        commitSha: null,
      })
      .run();

    recordSwipe(db, 'sw-a1', 'user-1', idA, 'like');
    recordSwipe(db, 'sw-b1', 'user-1', idB, 'like');
    recordSwipe(db, 'sw-b2', 'user-1', idB, 'like');
    recordSwipe(db, 'sw-b3', 'user-1', idB, 'like');
    recordSwipe(db, 'sw-sk', 'user-1', idA, 'skip');

    db.insert(snippetMemos)
      .values({ userId: 'user-1', cardId: idA, body: 'note', updatedAt: Date.now() })
      .run();

    /* Other users must not affect this session's dashboard. */
    recordSwipe(db, 'sw-u2-a', 'user-2', idA, 'like');
    recordSwipe(db, 'sw-u2-b', 'user-2', idB, 'skip');
    recordSwipe(db, 'sw-u2-c', 'user-2', idB, 'like');
    db.insert(snippetMemos)
      .values({ userId: 'user-2', cardId: idB, body: 'other', updatedAt: Date.now() })
      .run();

    const res = await GET_DASHBOARD_STATS(
      new Request('http://localhost/api/dashboard/stats', {
        headers: { cookie: 'cp_uid=user-1' },
      }),
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      cardsTotal: number;
      likesTotal: number;
      skipsTotal: number;
      cardsWithMemoCount: number;
      topByLikes: { cardId: string; likeCount: number; symbolName: string }[];
    };
    expect(j.cardsTotal).toBe(2);
    expect(j.likesTotal).toBe(4);
    expect(j.skipsTotal).toBe(1);
    expect(j.cardsWithMemoCount).toBe(1);
    expect(j.topByLikes.length).toBeGreaterThanOrEqual(2);
    expect(j.topByLikes[0].cardId).toBe(idB);
    expect(j.topByLikes[0].likeCount).toBe(3);
    expect(j.topByLikes[0].symbolName).toBe('bar');
    expect(j.topByLikes[1].cardId).toBe(idA);
    expect(j.topByLikes[1].likeCount).toBe(1);

    const res2 = await GET_DASHBOARD_STATS(
      new Request('http://localhost/api/dashboard/stats', {
        headers: { cookie: 'cp_uid=user-2' },
      }),
    );
    expect(res2.status).toBe(200);
    const j2 = (await res2.json()) as {
      cardsTotal: number;
      likesTotal: number;
      skipsTotal: number;
      cardsWithMemoCount: number;
    };
    expect(j2.cardsTotal).toBe(2);
    expect(j2.likesTotal).toBe(2);
    expect(j2.skipsTotal).toBe(1);
    expect(j2.cardsWithMemoCount).toBe(1);
  });
});
