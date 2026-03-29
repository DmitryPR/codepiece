import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { cardExists, setMemoBody } from '@/src/lib/feed';
import { normalizeMemoInput } from '@/src/lib/memo';

type PutBody = { cardId?: string; body?: unknown; userId?: string };

export async function PUT(req: Request) {
  let parsed: PutBody;
  try {
    parsed = (await req.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const cookieId = req.headers.get('cookie')?.match(/cp_uid=([^;]+)/)?.[1];
  const userId = parsed.userId || cookieId;
  if (!userId) return NextResponse.json({ error: 'missing user' }, { status: 401 });

  const cardId = typeof parsed.cardId === 'string' ? parsed.cardId.trim() : '';
  if (!cardId) return NextResponse.json({ error: 'missing cardId' }, { status: 400 });

  const rawBody = typeof parsed.body === 'string' ? parsed.body : '';
  const norm = normalizeMemoInput(rawBody);
  if (!norm.ok) return NextResponse.json({ error: norm.error }, { status: 400 });

  try {
    const db = getDb();
    if (!cardExists(db, cardId)) return NextResponse.json({ error: 'card not found' }, { status: 404 });

    setMemoBody(db, userId, cardId, norm.body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[PUT /api/cards/memo]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}
