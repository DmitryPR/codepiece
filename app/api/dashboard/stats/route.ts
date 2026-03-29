import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { getDashboardStats } from '@/src/lib/dashboard-stats';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const qp = url.searchParams.get('userId');
    const cookieId = req.headers.get('cookie')?.match(/cp_uid=([^;]+)/)?.[1];
    const userId = qp || cookieId;
    if (!userId) {
      return NextResponse.json({ error: 'missing user; POST /api/users first' }, { status: 401 });
    }

    const db = getDb();
    const stats = getDashboardStats(db, userId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[GET /api/dashboard/stats]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}
