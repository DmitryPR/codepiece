'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  MEMO_MAX_CODE_POINTS,
  clampToMaxCodePoints,
  countCodePoints,
  normalizeMemoInput,
} from '@/src/lib/memo';
import type { DashboardStatsPayload } from '@/src/lib/dashboard-stats';
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

function truncatePathEmpty(s: string, max = 42): string {
  if (s.length <= max) return s;
  return `…${s.slice(-(max - 1))}`;
}

/** Decorative hero for empty deck — stroke icons only (STYLE.md). */
function EmptyDeckHero({ caughtUp }: { caughtUp: boolean }) {
  if (caughtUp) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} aria-hidden>
        <svg width={56} height={56} viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="22" stroke="var(--cp-accent)" strokeWidth={1.75} opacity={0.42} />
          <path
            d="M18 28.5 24.5 35 38 21"
            stroke="var(--cp-accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }} aria-hidden>
      <svg width={56} height={56} viewBox="0 0 56 56" fill="none">
        <rect x="12" y="8" width="30" height="38" rx={5} stroke="var(--cp-muted)" strokeWidth={1.5} opacity={0.4} />
        <rect x="16" y="12" width="30" height="38" rx={5} stroke="var(--cp-accent)" strokeWidth={1.75} opacity={0.5} />
      </svg>
    </div>
  );
}

function CodeCommand({ children }: { children: string }) {
  return (
    <code
      style={{
        display: 'block',
        marginTop: 10,
        padding: '12px 14px',
        borderRadius: 8,
        fontSize: 13,
        lineHeight: 1.45,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        background: 'var(--cp-bg-deep)',
        border: '1px solid var(--cp-border)',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {children}
    </code>
  );
}

function EmptyDeckWelcome({
  stats,
  onReloadFeed,
}: {
  stats: DashboardStatsPayload | null;
  onReloadFeed: () => void;
}) {
  const [statsSlow, setStatsSlow] = useState(false);
  useEffect(() => {
    if (stats !== null) {
      setStatsSlow(false);
      return;
    }
    const t = window.setTimeout(() => setStatsSlow(true), 3500);
    return () => window.clearTimeout(t);
  }, [stats]);

  const hasLibrary = stats !== null && stats.cardsTotal > 0;
  const title = hasLibrary ? "You're all caught up" : 'Welcome to CodePiece';
  const subtitle = hasLibrary
    ? "You've seen every card in the deck. Add more snippets from your machine, then refresh the feed below."
    : 'Load code snippets from a local repo into this app, then swipe through them here.';

  const top = stats?.topByLikes.slice(0, 5) ?? [];
  const maxLikes = top.length ? Math.max(...top.map((t) => t.likeCount), 1) : 1;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <EmptyDeckHero caughtUp={hasLibrary} />
        <h2 style={{ margin: '0 0 10px', fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 15, opacity: 0.8, lineHeight: 1.55 }}>{subtitle}</p>
      </div>

      <section
        aria-label="Recent activity"
        style={{
          background: 'var(--cp-surface)',
          borderRadius: 12,
          border: '1px solid var(--cp-border)',
          padding: '18px 20px',
          marginBottom: 20,
          boxShadow: '0 4px 24px var(--cp-shadow)',
        }}
      >
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, opacity: 0.85 }}>
          Recent activity
        </h3>
        {stats === null ? (
          <div>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.65 }}>Loading stats…</p>
            {statsSlow ? (
              <p style={{ margin: '10px 0 0', fontSize: 13, opacity: 0.6, lineHeight: 1.45 }}>
                Still waiting — try the <strong>Stats</strong> button in the header or reload the page.
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: top.length > 0 ? 18 : 0,
              }}
            >
              {(
                [
                  { label: 'Snippets in deck', value: stats.cardsTotal },
                  { label: 'Your likes', value: stats.likesTotal },
                  { label: 'Your skips', value: stats.skipsTotal },
                  { label: 'Your memos', value: stats.cardsWithMemoCount },
                ] as const
              ).map((k) => (
                <div
                  key={k.label}
                  style={{
                    background: 'var(--cp-bg-deep)',
                    border: '1px solid var(--cp-border)',
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ fontSize: 11, opacity: 0.58, marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 600 }}>{k.value}</div>
                </div>
              ))}
            </div>
            {top.length > 0 ? (
              <>
                <h4
                  style={{
                    margin: '0 0 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.72,
                  }}
                >
                  Your snippets by like count
                </h4>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {top.map((row) => {
                    const pct = (row.likeCount / maxLikes) * 100;
                    return (
                      <li
                        key={row.cardId}
                        style={{
                          marginBottom: 10,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid var(--cp-border)',
                          background: 'var(--cp-bg-deep)',
                        }}
                      >
                        <div style={{ padding: '8px 10px 6px', fontSize: 12 }}>
                          <strong>{row.symbolName}</strong>
                          <span style={{ opacity: 0.55, marginLeft: 6 }}>· {row.repoLabel}</span>
                          <div
                            style={{
                              opacity: 0.62,
                              fontSize: 11,
                              marginTop: 2,
                              wordBreak: 'break-all',
                            }}
                          >
                            {truncatePathEmpty(row.sourcePath)}
                          </div>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: 'var(--cp-surface)',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: 'var(--cp-accent)',
                            }}
                          />
                        </div>
                        <div style={{ padding: '4px 10px 7px', fontSize: 11, opacity: 0.68 }}>
                          {row.likeCount} like{row.likeCount === 1 ? '' : 's'}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : stats.likesTotal === 0 && stats.cardsTotal > 0 ? (
              <p style={{ margin: 0, fontSize: 13, opacity: 0.65 }}>
                You have not liked anything yet — keep swiping!
              </p>
            ) : null}
          </>
        )}
      </section>

      <section
        aria-label="How to load snippets"
        style={{
          background: 'var(--cp-surface)',
          borderRadius: 12,
          border: '1px solid var(--cp-border)',
          padding: '18px 20px',
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, opacity: 0.85 }}>
          Add snippets on your machine
        </h3>
        <p style={{ margin: '0 0 6px', fontSize: 14, opacity: 0.78, lineHeight: 1.5 }}>
          From the project folder in a terminal, load sample cards or scan any local TypeScript repo:
        </p>
        <CodeCommand>bun run seed:samples</CodeCommand>
        <p style={{ margin: '14px 0 0', fontSize: 13, opacity: 0.72 }}>
          Or point at your own clone (path to the repo root):
        </p>
        <CodeCommand>{'TARGET_REPO=./path/to/your-repo bun run scan'}</CodeCommand>
        <p style={{ margin: '14px 0 0', fontSize: 13, opacity: 0.72, lineHeight: 1.5 }}>
          Full options and env vars (e.g. <code style={{ fontSize: 12 }}>CODEPIECE_DB</code>) are in
          the README.
        </p>
        <p style={{ margin: '14px 0 0', fontSize: 13, opacity: 0.78, lineHeight: 1.55 }}>
          <strong style={{ fontWeight: 600 }}>Memos:</strong> personal notes you attach to a card in
          this app are saved in the same local database. They stay private to your session. After you
          add new snippets with the commands above, use <strong>Refresh feed</strong> to keep playing.
        </p>
      </section>

      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={onReloadFeed}
          style={{
            padding: '12px 22px',
            borderRadius: 10,
            border: 'none',
            background: 'var(--cp-accent)',
            color: 'var(--cp-on-accent)',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Refresh feed
        </button>
      </div>
    </div>
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
      setMemoPopoverOpen(false);
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

  useEffect(() => {
    if (!userReady || card !== null) return;
    dashboard?.refreshDashboard();
  }, [userReady, card, dashboard]);

  if (err) {
    return <p style={{ color: 'var(--cp-error)' }}>{err}</p>;
  }

  if (!userReady || card === undefined) {
    return <p>Loading…</p>;
  }

  if (card === null) {
    return (
      <EmptyDeckWelcome
        stats={dashboard?.stats ?? null}
        onReloadFeed={() => {
          void loadNext();
          dashboard?.refreshDashboard();
        }}
      />
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
  const dragInset =
    dragX > 20
      ? `inset 0 0 0 2px color-mix(in srgb, var(--cp-accent) ${hintOpacity * 55}%, transparent)`
      : dragX < -20
        ? `inset 0 0 0 2px color-mix(in srgb, var(--cp-swipe-skip) ${hintOpacity * 45}%, transparent)`
        : '';
  const cardBoxShadow = dragInset ? `var(--cp-card-elev), ${dragInset}` : 'var(--cp-card-elev)';

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
          borderRadius: 'var(--cp-radius-lg)',
          border: '1px solid var(--cp-border)',
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
          transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
          boxShadow: cardBoxShadow,
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
