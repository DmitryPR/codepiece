import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { ensureUser } from '@/src/lib/feed';
import {
  getFocusRepoProgress,
  getPendingPreviewsInRepo,
  getUserFocusRepoLabel,
  listRepoLabels,
  repoHasCards,
  setUserFocusRepo,
} from '@/src/lib/queue';

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
    const db = getDb();
    ensureUser(db, userId, null);
    const repos = listRepoLabels(db);
    const repoLabel = getUserFocusRepoLabel(db, userId);
    const progress = repoLabel ? getFocusRepoProgress(db, userId, repoLabel) : { total: 0, reviewed: 0, pending: 0 };
    const pendingPreviews = repoLabel ? getPendingPreviewsInRepo(db, userId, repoLabel, 15) : [];
    return NextResponse.json({ repos, repoLabel, progress, pendingPreviews });
  } catch (err) {
    console.error('[GET /api/queue]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const userId = userIdFrom(req);
    if (!userId) {
      return NextResponse.json({ error: 'missing user; POST /api/users first' }, { status: 401 });
    }
    let body: { repoLabel?: unknown };
    try {
      body = (await req.json()) as { repoLabel?: unknown };
    } catch {
      return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }
    if (!('repoLabel' in body)) {
      return NextResponse.json({ error: 'body must include repoLabel (string or null)' }, { status: 400 });
    }
    const raw = body.repoLabel;
    if (raw !== null && typeof raw !== 'string') {
      return NextResponse.json({ error: 'repoLabel must be string or null' }, { status: 400 });
    }
    const normalized = raw === null || raw.trim() === '' ? null : raw.trim();
    const db = getDb();
    ensureUser(db, userId, null);
    if (normalized !== null && !repoHasCards(db, normalized)) {
      return NextResponse.json({ error: `unknown or empty repo: ${normalized}` }, { status: 400 });
    }
    setUserFocusRepo(db, userId, normalized);
    const repos = listRepoLabels(db);
    const repoLabel = getUserFocusRepoLabel(db, userId);
    const progress = repoLabel ? getFocusRepoProgress(db, userId, repoLabel) : { total: 0, reviewed: 0, pending: 0 };
    const pendingPreviews = repoLabel ? getPendingPreviewsInRepo(db, userId, repoLabel, 15) : [];
    return NextResponse.json({ repos, repoLabel, progress, pendingPreviews });
  } catch (err) {
    console.error('[PUT /api/queue]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'internal server error' },
      { status: 500 },
    );
  }
}
