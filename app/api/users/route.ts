import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getDb } from '@/src/db/client';
import { ensureUser } from '@/src/lib/feed';

const COOKIE = 'cp_uid';

export async function POST(req: Request) {
  let displayName: string | null = null;
  try {
    const j = (await req.json()) as { displayName?: string };
    displayName = j.displayName?.trim() || null;
  } catch {
    /* optional body */
  }

  const id = randomUUID();
  const db = getDb();
  ensureUser(db, id, displayName);

  const res = NextResponse.json({ id, displayName });
  res.cookies.set(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
