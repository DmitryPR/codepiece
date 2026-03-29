'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const HEURISTIC_PREFIX = '[heuristic] ';

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

function splitContextSummary(raw: string): { isHeuristic: boolean; text: string } {
  if (raw.startsWith(HEURISTIC_PREFIX)) {
    return { isHeuristic: true, text: raw.slice(HEURISTIC_PREFIX.length).trim() };
  }
  return { isHeuristic: false, text: raw };
}

const SWIPE_THRESHOLD_PX = 72;

export function SwipeClient() {
  const [userReady, setUserReady] = useState(false);
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const dragActiveRef = useRef(false);

  const loadNext = useCallback(async () => {
    setErr(null);
    let r = await fetch('/api/cards/next', { credentials: 'include' });
    if (r.status === 401) {
      // One retry: cookie can lag right after POST /api/users; avoid false "session" errors.
      await new Promise((res) => setTimeout(res, 30));
      r = await fetch('/api/cards/next', { credentials: 'include' });
    }
    if (r.status === 401) {
      // Never set userReady false here — that left the UI stuck on "Loading…".
      setUserReady(true);
      setCard(null);
      setErr('Session missing. Refresh the page.');
      return;
    }
    if (!r.ok) {
      setUserReady(true);
      setCard(null);
      setErr(await r.text());
      return;
    }
    try {
      const j = (await r.json()) as { card?: Card | null };
      setCard(j.card ?? null);
    } catch {
      setUserReady(true);
      setCard(null);
      setErr('Invalid response from server');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/cards/next', { credentials: 'include' });
        if (!alive) return;

        if (r.status === 401) {
          const c = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
            credentials: 'include',
          });
          if (!alive) return;
          if (!c.ok) {
            setErr('Could not create session');
            setUserReady(true);
            setCard(null);
            return;
          }
          setUserReady(true);
          // Let Set-Cookie be applied before the next request (avoids 401 → stuck loading).
          await new Promise((resolve) => setTimeout(resolve, 0));
          if (!alive) return;
          await loadNext();
          return;
        }

        if (!r.ok) {
          const t = await r.text();
          if (!alive) return;
          setUserReady(true);
          setCard(null);
          setErr(t || `Request failed (${r.status})`);
          return;
        }

        const j = (await r.json()) as { card?: Card | null };
        if (!alive) return;
        setUserReady(true);
        setCard(j.card ?? null);
      } catch (e) {
        if (!alive) return;
        setUserReady(true);
        setCard(null);
        setErr(e instanceof Error ? e.message : 'Network error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadNext]);

  const swipe = async (action: 'like' | 'skip') => {
    if (!card) return;
    setDragX(0);
    setDragging(false);
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
        No more cards. Load snippets with{' '}
        <code style={{ background: '#2f3336', padding: '2px 6px', borderRadius: 4 }}>bun run seed:samples</code> or{' '}
        <code style={{ background: '#2f3336', padding: '2px 6px', borderRadius: 4 }}>TARGET_REPO=… bun run scan</code> (see README).
      </p>
    );
  }

  const ctx = splitContextSummary(card.contextSummary);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    // Do not capture when the gesture starts on controls: capture retargets pointerup to the
    // article and the button never receives a full click — Skip/Like would not fire.
    const t = e.target as HTMLElement | null;
    if (t?.closest('button, a, input, textarea, select, [role="button"]')) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    startXRef.current = e.clientX;
    dragActiveRef.current = true;
    setDragging(true);
    setDragX(0);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragActiveRef.current) return;
    setDragX(e.clientX - startXRef.current);
  };

  const endPointer = async (e: ReactPointerEvent<HTMLElement>) => {
    if (!dragActiveRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    dragActiveRef.current = false;
    const dx = e.clientX - startXRef.current;
    setDragging(false);
    setDragX(0);
    if (dx >= SWIPE_THRESHOLD_PX) await swipe('like');
    else if (dx <= -SWIPE_THRESHOLD_PX) await swipe('skip');
  };

  const hintOpacity = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD_PX);

  return (
    <div>
      <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 12, textAlign: 'center' }}>
        Drag the card right to like, left to skip — or use the buttons.
      </p>
      <article
        aria-label="Code snippet card. Drag horizontally or use Skip and Like buttons."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        style={{
          background: '#16181c',
          borderRadius: 12,
          border: '1px solid #2f3336',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: dragging ? 'none' : 'auto',
          cursor: dragging ? 'grabbing' : 'grab',
          transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
          boxShadow:
            dragX > 20
              ? `inset 0 0 0 2px rgba(29, 155, 240, ${hintOpacity * 0.6})`
              : dragX < -20
                ? `inset 0 0 0 2px rgba(248, 113, 113, ${hintOpacity * 0.5})`
                : undefined,
        }}
      >
      <header style={{ padding: '12px 16px', borderBottom: '1px solid #2f3336' }}>
        <strong>{card.symbolName}</strong>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
          {ctx.text}
          {ctx.isHeuristic ? (
            <span style={{ display: 'block', fontSize: 11, opacity: 0.55, marginTop: 4, fontStyle: 'italic' }}>
              Auto summary (not author docs)
            </span>
          ) : null}
        </div>
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
        {card.commitSha ? ` · ${card.commitSha.slice(0, 7)}` : ''}
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
    </div>
  );
}
