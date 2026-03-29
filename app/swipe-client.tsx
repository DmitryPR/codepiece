'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  MEMO_MAX_CODE_POINTS,
  clampToMaxCodePoints,
  countCodePoints,
  normalizeMemoInput,
} from '@/src/lib/memo';

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
  memo: string | null;
};

function splitContextSummary(raw: string): { isHeuristic: boolean; text: string } {
  if (raw.startsWith(HEURISTIC_PREFIX)) {
    return { isHeuristic: true, text: raw.slice(HEURISTIC_PREFIX.length).trim() };
  }
  return { isHeuristic: false, text: raw };
}

const SWIPE_THRESHOLD_PX = 72;

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function CopySnippetButton({ snippetText }: { snippetText: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    const ok = await copyToClipboard(snippetText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Copy code snippet to clipboard"
      style={{
        flexShrink: 0,
        fontSize: 11,
        padding: '4px 10px',
        borderRadius: 6,
        border: '1px solid #536471',
        background: copied ? '#1a3d2e' : 'transparent',
        color: copied ? '#6ee7b7' : '#8b98a5',
        cursor: 'pointer',
        alignSelf: 'flex-start',
      }}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function SwipeClient() {
  const [userReady, setUserReady] = useState(false);
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoSaved, setMemoSaved] = useState(false);
  const [memoSaving, setMemoSaving] = useState(false);
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
      const j = (await r.json()) as { card?: (Omit<Card, 'memo'> & { memo?: string | null }) | null };
      const c = j.card;
      setCard(
        c
          ? {
              ...c,
              memo: c.memo ?? null,
            }
          : null,
      );
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

        const j = (await r.json()) as { card?: (Omit<Card, 'memo'> & { memo?: string | null }) | null };
        if (!alive) return;
        setUserReady(true);
        const c = j.card;
        setCard(
          c
            ? {
                ...c,
                memo: c.memo ?? null,
              }
            : null,
        );
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

  useEffect(() => {
    if (card && card !== null) {
      setMemoDraft(card.memo ?? '');
      setMemoOpen(Boolean(card.memo));
    } else {
      setMemoDraft('');
      setMemoOpen(false);
    }
    setMemoSaved(false);
  }, [card?.id]);

  const saveMemo = async () => {
    if (!card) return;
    const norm = normalizeMemoInput(memoDraft);
    if (!norm.ok) {
      setErr(norm.error);
      return;
    }
    setErr(null);
    setMemoSaving(true);
    try {
      const r = await fetch('/api/cards/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cardId: card.id, body: memoDraft }),
      });
      if (!r.ok) {
        setErr(await r.text());
        return;
      }
      setMemoDraft(norm.body);
      setCard((c) => (c ? { ...c, memo: norm.body === '' ? null : norm.body } : c));
      if (norm.body !== '') setMemoOpen(true);
      setMemoSaved(true);
      window.setTimeout(() => setMemoSaved(false), 2000);
    } finally {
      setMemoSaving(false);
    }
  };

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
    if (t?.closest('button, a, input, textarea, select, summary, [role="button"]')) return;

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
          userSelect: 'none',
          WebkitUserSelect: 'none',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginTop: 8,
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          <div style={{ flex: 1, minWidth: 0, opacity: 0.88 }}>
            {ctx.text}
            {ctx.isHeuristic ? (
              <span style={{ display: 'block', fontSize: 11, opacity: 0.55, marginTop: 4, fontStyle: 'italic' }}>
                Auto summary (not author docs)
              </span>
            ) : null}
          </div>
          <CopySnippetButton snippetText={card.snippetText} />
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
      <div
        style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid #2f3336',
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
      >
        <details
          key={card.id}
          open={memoOpen}
          onToggle={(e) => setMemoOpen(e.currentTarget.open)}
          style={{ fontSize: 13 }}
        >
          <summary
            style={{
              cursor: 'pointer',
              opacity: 0.8,
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            Personal memo (optional, private)
          </summary>
          <div style={{ marginTop: 10 }}>
            <textarea
              value={memoDraft}
              onChange={(e) => setMemoDraft(clampToMaxCodePoints(e.target.value))}
              rows={3}
              placeholder="Short note on this snippet…"
              aria-label="Personal memo for this snippet"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: 72,
                maxHeight: 200,
                padding: 10,
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.4,
                borderRadius: 8,
                border: '1px solid #38444d',
                background: '#0b0d0f',
                color: '#e7e9ea',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.55 }}>
                {countCodePoints(memoDraft)} / {MEMO_MAX_CODE_POINTS}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {memoSaved ? (
                  <span style={{ fontSize: 12, color: '#6ee7b7' }} aria-live="polite">
                    Saved
                  </span>
                ) : null}
                <button
                  type="button"
                  disabled={memoSaving}
                  onClick={() => void saveMemo()}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: '1px solid #536471',
                    background: 'transparent',
                    color: '#e7e9ea',
                    cursor: memoSaving ? 'wait' : 'pointer',
                    opacity: memoSaving ? 0.6 : 1,
                  }}
                >
                  {memoSaving ? 'Saving…' : 'Save memo'}
                </button>
              </div>
            </div>
          </div>
        </details>
      </div>
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
