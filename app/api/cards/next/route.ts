import { NextResponse } from 'next/server';
import { getDb } from '@/src/db/client';
import { pickNextCard } from '@/src/lib/feed';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qp = url.searchParams.get('userId');
  const cookieId = req.headers.get('cookie')?.match(/cp_uid=([^;]+)/)?.[1];
  const userId = qp || cookieId;
  if (!userId) {
    return NextResponse.json({ error: 'missing user; POST /api/users first' }, { status: 401 });
  }

  const db = getDb();
  const card = pickNextCard(db, userId);
  if (!card) return NextResponse.json({ card: null });
  return NextResponse.json({
    card: {
      id: card.id,
      sourcePath: card.sourcePath,
      symbolName: card.symbolName,
      snippetText: card.snippetText,
      lineStart: card.lineStart,
      lineEnd: card.lineEnd,
      contextSummary: card.contextSummary,
      repoLabel: card.repoLabel,
      license: card.license,
      commitSha: card.commitSha,
    },
  });
}
