import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { ensureUser } from '@/src/lib/feed';
import { listMemoHistory } from '@/src/lib/memo-list';

function userIdFrom(req: Request): string | null {
  const cookieId = req.headers.get('cookie')?.match(/cp_uid=([^;]+)/)?.[1];
  return cookieId || null;
}

function parseLimitOffset(url: URL): { limit: number; offset: number } {
  const lim = Number(url.searchParams.get('limit') ?? '40');
  const off = Number(url.searchParams.get('offset') ?? '0');
  const limit = Number.isFinite(lim) ? Math.min(100, Math.max(1, Math.floor(lim))) : 40;
  const offset = Number.isFinite(off) && off >= 0 ? Math.floor(off) : 0;
  return { limit, offset };
}

export async function GET(req: Request) {
  const userId = userIdFrom(req);
  if (!userId) {
    return NextResponse.json({ error: 'missing user; POST /api/users first' }, { status: 401 });
  }

  try {
    const db = getDb();
    ensureUser(db, userId, null);
    const { limit, offset } = parseLimitOffset(new URL(req.url));
    const memos = listMemoHistory(db, userId, limit, offset);
    return NextResponse.json({ memos, limit, offset });
  } catch (err) {
    console.error('[GET /api/cards/memos]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}
