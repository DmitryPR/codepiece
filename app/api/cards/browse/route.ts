import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { browseCards } from '@/src/lib/queue';

function userIdFrom(req: Request): string | null {
  const url = new URL(req.url);
  const qp = url.searchParams.get('userId');
  const cookieId = req.headers.get('cookie')?.match(/cp_uid=([^;]+)/)?.[1];
  return qp || cookieId || null;
}

export async function GET(req: Request) {
  try {
    const userId = userIdFrom(req);
    if (!userId) {
      return NextResponse.json({ error: 'missing user; POST /api/users first' }, { status: 401 });
    }
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') ?? '30');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const q = url.searchParams.get('q');

    const db = getDb();
    const rows = browseCards(db, {
      limit: Number.isFinite(limit) ? limit : 30,
      offset: Number.isFinite(offset) ? offset : 0,
      q,
    });
    return NextResponse.json({ cards: rows });
  } catch (err) {
    console.error('[GET /api/cards/browse]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}
