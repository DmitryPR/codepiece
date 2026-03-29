'use client';

import { useCallback, useEffect, useState } from 'react';

type Card = {
  id: string;
  sourcePath: string;
  symbolName: string;
  snippetText: string;
  lineStart: number;
  lineEnd: number;
  contextSummary: string;
  repoLabel: string;
  license: string;
  commitSha: string | null;
};

export function SwipeClient() {
  const [userReady, setUserReady] = useState(false);
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);

  const loadNext = useCallback(async () => {
    setErr(null);
    const r = await fetch('/api/cards/next', { credentials: 'include' });
    if (r.status === 401) {
      setUserReady(false);
      setCard(null);
      return;
    }
    if (!r.ok) {
      setErr(await r.text());
      return;
    }
    const j = (await r.json()) as { card: Card | null };
    setCard(j.card);
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch('/api/cards/next', { credentials: 'include' });
      if (r.status !== 401) {
        setUserReady(true);
        const j = (await r.json()) as { card: Card | null };
        setCard(j.card);
        return;
      }
      const c = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include',
      });
      if (!c.ok) {
        setErr('Could not create session');
        return;
      }
      setUserReady(true);
      await loadNext();
    })();
  }, [loadNext]);

  const swipe = async (action: 'like' | 'skip') => {
    if (!card) return;
    setErr(null);
    const r = await fetch('/api/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cardId: card.id, action }),
    });
    if (!r.ok) {
      setErr(await r.text());
      return;
    }
    await loadNext();
  };

  if (err) {
    return <p style={{ color: '#f87171' }}>{err}</p>;
  }

  if (!userReady || card === undefined) {
    return <p>Loading…</p>;
  }

  if (card === null) {
    return (
      <p style={{ opacity: 0.85 }}>
        No more cards. Run <code style={{ background: '#2f3336', padding: '2px 6px', borderRadius: 4 }}>bun run scan</code> with{' '}
        <code style={{ background: '#2f3336', padding: '2px 6px', borderRadius: 4 }}>TARGET_REPO</code> (see README).
      </p>
    );
  }

  return (
    <article
      style={{
        background: '#16181c',
        borderRadius: 12,
        border: '1px solid #2f3336',
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: '12px 16px', borderBottom: '1px solid #2f3336' }}>
        <strong>{card.symbolName}</strong>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{card.contextSummary}</div>
      </header>
      <pre
        style={{
          margin: 0,
          padding: 16,
          overflow: 'auto',
          fontSize: 13,
          lineHeight: 1.45,
          maxHeight: 360,
          background: '#0b0d0f',
        }}
      >
        {card.snippetText}
      </pre>
      <footer style={{ padding: 12, fontSize: 12, opacity: 0.7, borderTop: '1px solid #2f3336' }}>
        {card.repoLabel} · {card.license} · {card.sourcePath} (lines {card.lineStart}–{card.lineEnd})
      </footer>
      <div style={{ display: 'flex', gap: 12, padding: 16, justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => swipe('skip')}
          style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid #536471', background: 'transparent', color: '#e7e9ea', cursor: 'pointer' }}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => swipe('like')}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1d9bf0', color: '#fff', cursor: 'pointer' }}
        >
          Like
        </button>
      </div>
    </article>
  );
}
