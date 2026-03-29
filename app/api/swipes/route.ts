import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/src/db/client';
import { recordSwipe } from '@/src/lib/feed';

export async function POST(req: Request) {
  const cookieId = req.headers.get('cookie')?.match(/cp_uid=([^;]+)/)?.[1];
  let body: { cardId?: string; action?: string; userId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const userId = body.userId || cookieId;
  if (!userId) return NextResponse.json({ error: 'missing user' }, { status: 401 });
  if (!body.cardId) return NextResponse.json({ error: 'missing cardId' }, { status: 400 });
  const action = body.action === 'like' || body.action === 'skip' ? body.action : null;
  if (!action) return NextResponse.json({ error: 'action must be like or skip' }, { status: 400 });

  try {
    const db = getDb();
    recordSwipe(db, randomUUID(), userId, body.cardId, action);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/swipes]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}
