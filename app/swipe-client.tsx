'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  MEMO_MAX_CODE_POINTS,
  clampToMaxCodePoints,
  countCodePoints,
  normalizeMemoInput,
} from '@/src/lib/memo';
import { useDashboardStats } from './dashboard-context';

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

/** Classic “two sheets” copy icon (same metaphor as OS / Material / Feather). */
function CopyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Lined note — minimal stroke icon aligned with CopyIcon (editor-adjacent, not emoji). */
function MemoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="3" width="14" height="18" rx="2" ry="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

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
      title={copied ? 'Copied' : 'Copy snippet'}
      aria-label={copied ? 'Copied to clipboard' : 'Copy code snippet to clipboard'}
      style={{
        flexShrink: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid var(--cp-border)',
        background: copied ? 'var(--cp-success-bg)' : 'transparent',
        color: copied ? 'var(--cp-success)' : 'var(--cp-icon-muted)',
        cursor: 'pointer',
        lineHeight: 0,
      }}
    >
      {copied ? <CheckIcon size={17} /> : <CopyIcon size={17} />}
    </button>
  );
}

export function SwipeClient() {
  const dashboard = useDashboardStats();
  const [userReady, setUserReady] = useState(false);
  const [card, setCard] = useState<Card | null | undefined>(undefined);
  const [err, setErr] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoPopoverOpen, setMemoPopoverOpen] = useState(false);
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
    } else {
      setMemoDraft('');
    }
    setMemoPopoverOpen(false);
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
      setMemoSaved(true);
      window.setTimeout(() => setMemoSaved(false), 2000);
    } finally {
      setMemoSaving(false);
    }
  };

  const swipe = async (action: 'like' | 'skip') => {
    if (!card) return;
    const cardId = card.id;
    setDragX(0);
    setDragging(false);
    setErr(null);
    const r = await fetch('/api/swipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ cardId, action }),
    });
    if (!r.ok) {
      setErr(await r.text());
      return;
    }
    await loadNext();
    if (dashboard) {
      if (action === 'like') dashboard.refreshDashboard(cardId);
      else dashboard.refreshDashboard();
    }
  };

  if (err) {
    return <p style={{ color: 'var(--cp-error)' }}>{err}</p>;
  }

  if (!userReady || card === undefined) {
    return <p>Loading…</p>;
  }

  if (card === null) {
    return (
      <p style={{ opacity: 0.85 }}>
        No more cards. Load snippets with{' '}
        <code style={{ background: 'var(--cp-border)', padding: '2px 6px', borderRadius: 4 }}>bun run seed:samples</code> or{' '}
        <code style={{ background: 'var(--cp-border)', padding: '2px 6px', borderRadius: 4 }}>TARGET_REPO=… bun run scan</code> (see README).
      </p>
    );
  }

  const ctx = splitContextSummary(card.contextSummary);
  const memoHasContent =
    memoDraft.trim().length > 0 || Boolean(card.memo && card.memo.trim().length > 0);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    // Do not capture when the gesture starts on controls: capture retargets pointerup to the
    // article and the button never receives a full click — Skip/Like would not fire.
    const t = e.target as HTMLElement | null;
    if (t?.closest('button, a, input, textarea, select, summary, [role="button"], [role="dialog"]')) return;

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
          background: 'var(--cp-surface)',
          borderRadius: 12,
          border: '1px solid var(--cp-border)',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
          transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
          boxShadow:
            dragX > 20
              ? `inset 0 0 0 2px color-mix(in srgb, var(--cp-accent) ${hintOpacity * 55}%, transparent)`
              : dragX < -20
                ? `inset 0 0 0 2px color-mix(in srgb, var(--cp-swipe-skip) ${hintOpacity * 45}%, transparent)`
                : undefined,
        }}
      >
      <header
        style={{
          position: 'relative',
          padding: '12px 16px',
          borderBottom: '1px solid var(--cp-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <strong style={{ flex: 1, minWidth: 0, fontSize: '1.05rem' }}>{card.symbolName}</strong>
          <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 8 }}>
            <CopySnippetButton snippetText={card.snippetText} />
            <button
              type="button"
              aria-label={memoPopoverOpen ? 'Close personal memo' : 'Personal memo (private note)'}
              aria-expanded={memoPopoverOpen}
              onClick={() => setMemoPopoverOpen((o) => !o)}
              title="Memo"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 8px',
                borderRadius: 6,
                border: '1px solid var(--cp-border)',
                background:
                  memoPopoverOpen || memoHasContent ? 'var(--cp-accent-subtle)' : 'transparent',
                color: memoHasContent ? 'var(--cp-accent)' : 'var(--cp-icon-muted)',
                cursor: 'pointer',
                lineHeight: 0,
              }}
            >
              <MemoIcon size={17} />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
          <div style={{ opacity: 0.88 }}>
            {ctx.text}
            {ctx.isHeuristic ? (
              <span style={{ display: 'block', fontSize: 11, opacity: 0.55, marginTop: 4, fontStyle: 'italic' }}>
                Auto summary (not author docs)
              </span>
            ) : null}
          </div>
        </div>
        {memoPopoverOpen ? (
          <div
            role="dialog"
            aria-label="Personal memo"
            style={{
              position: 'absolute',
              right: 12,
              top: 'calc(100% - 2px)',
              zIndex: 20,
              width: 'min(calc(100vw - 48px), 300px)',
              maxWidth: 'calc(100% - 24px)',
              marginTop: 6,
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--cp-border-input)',
              background: 'var(--cp-bg-deep)',
              boxShadow: '0 12px 40px var(--cp-shadow)',
              userSelect: 'text',
              WebkitUserSelect: 'text',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <p style={{ margin: '0 0 8px', fontSize: 12, opacity: 0.7 }}>Private note (only you)</p>
            <textarea
              value={memoDraft}
              onChange={(e) => setMemoDraft(clampToMaxCodePoints(e.target.value))}
              rows={4}
              placeholder="Short note on this snippet…"
              aria-label="Personal memo for this snippet"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical',
                minHeight: 88,
                maxHeight: 200,
                padding: 10,
                fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1.4,
                borderRadius: 8,
                border: '1px solid var(--cp-border-input)',
                background: 'var(--cp-surface)',
                color: 'var(--cp-text)',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginTop: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, opacity: 0.55 }}>
                {countCodePoints(memoDraft)} / {MEMO_MAX_CODE_POINTS}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {memoSaved ? (
                  <span style={{ fontSize: 12, color: 'var(--cp-success)' }} aria-live="polite">
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
                    border: '1px solid var(--cp-border)',
                    background: 'transparent',
                    color: 'var(--cp-text)',
                    cursor: memoSaving ? 'wait' : 'pointer',
                    opacity: memoSaving ? 0.6 : 1,
                  }}
                >
                  {memoSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>
      <pre
        style={{
          margin: 0,
          padding: 16,
          overflow: 'auto',
          fontSize: 13,
          lineHeight: 1.45,
          maxHeight: 360,
          background: 'var(--cp-bg-deep)',
        }}
      >
        {card.snippetText}
      </pre>
      <footer
        style={{
          padding: 12,
          fontSize: 12,
          opacity: 0.7,
          borderTop: '1px solid var(--cp-border)',
        }}
      >
        {card.repoLabel} · {card.license} · {card.sourcePath} (lines {card.lineStart}–{card.lineEnd})
        {card.commitSha ? ` · ${card.commitSha.slice(0, 7)}` : ''}
      </footer>
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: 16,
          justifyContent: 'center',
          borderTop: '1px solid var(--cp-border)',
        }}
      >
        <button
          type="button"
          onClick={() => swipe('skip')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: '1px solid var(--cp-border)',
            background: 'transparent',
            color: 'var(--cp-text)',
            cursor: 'pointer',
          }}
        >
          Skip
        </button>
        <button
          type="button"
          onClick={() => swipe('like')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--cp-accent)',
            color: 'var(--cp-on-accent)',
            cursor: 'pointer',
          }}
        >
          Like
        </button>
      </div>
    </article>
    </div>
  );
}
