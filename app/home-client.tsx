'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useDashboardStats } from './dashboard-context';

type MemoHistoryRow = {
  cardId: string;
  body: string;
  updatedAt: number;
  symbolName: string;
  sourcePath: string;
  repoLabel: string;
  contextSummary: string;
  snippetPreview: string;
};

function MemosHistoryPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [items, setItems] = useState<MemoHistoryRow[]>([]);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    setLoadErr(null);
    void (async () => {
      try {
        const r = await fetch('/api/cards/memos?limit=50', { credentials: 'include' });
        if (!alive) return;
        if (!r.ok) {
          setLoadErr((await r.text()) || `HTTP ${r.status}`);
          setItems([]);
          return;
        }
        const j = (await r.json()) as { memos?: MemoHistoryRow[] };
        setItems(Array.isArray(j.memos) ? j.memos : []);
      } catch (e) {
        if (!alive) return;
        setLoadErr(e instanceof Error ? e.message : String(e));
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close memos panel"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          border: 'none',
          margin: 0,
          padding: 0,
          background: 'var(--cp-overlay)',
          cursor: 'pointer',
        }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-memos-title"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(520px, 100vw)',
          zIndex: 101,
          background: 'var(--cp-surface)',
          borderLeft: '1px solid var(--cp-border)',
          boxShadow: '-8px 0 32px var(--cp-shadow)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--cp-border)',
            flexShrink: 0,
          }}
        >
          <h2 id="home-memos-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            Your memos
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--cp-border)',
              background: 'transparent',
              color: 'var(--cp-text)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, opacity: 0.75, lineHeight: 1.45 }}>
            Private notes you saved on swipe cards, newest first. Snippet text is truncated for a quick recap.
          </p>
          {loadErr ? (
            <p role="alert" style={{ margin: 0, color: 'var(--cp-error)', fontSize: 14 }}>
              {loadErr}
            </p>
          ) : loading ? (
            <p style={{ margin: 0, opacity: 0.7 }}>Loading…</p>
          ) : items.length === 0 ? (
            <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>
              No memos yet — open <Link href="/swipe">Swipe</Link>, then use the memo control on a card.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((m) => (
                <MemoHistoryCard key={`${m.cardId}-${m.updatedAt}`} m={m} />
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

function MemoHistoryCard({ m }: { m: MemoHistoryRow }) {
  const when = new Date(m.updatedAt);
  const whenStr = Number.isFinite(when.getTime()) ? when.toLocaleString() : '';
  return (
    <li
      style={{
        border: '1px solid var(--cp-border)',
        borderRadius: 'var(--cp-radius-md)',
        overflow: 'hidden',
        background: 'var(--cp-bg-deep)',
      }}
    >
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--cp-border)' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{m.symbolName}</div>
        <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4, wordBreak: 'break-all' }}>
          {m.repoLabel} · {m.sourcePath}
        </div>
        {whenStr ? (
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>Updated {whenStr}</div>
        ) : null}
      </div>
      <div
        style={{
          padding: '10px 12px',
          fontSize: 13,
          lineHeight: 1.45,
          borderBottom: '1px solid var(--cp-border)',
          background: 'var(--cp-accent-subtle)',
        }}
      >
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Your note</div>
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.body}</div>
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Code</div>
        <pre
          style={{
            margin: 0,
            padding: '10px 12px',
            borderRadius: 'var(--cp-radius-sm)',
            fontSize: 12,
            lineHeight: 1.45,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            background: 'var(--cp-surface)',
            border: '1px solid var(--cp-border)',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            maxHeight: 280,
            overflowY: 'auto',
          }}
        >
          {m.snippetPreview}
        </pre>
      </div>
    </li>
  );
}

type Progress = { total: number; reviewed: number; pending: number };

type PendingPreview = {
  cardId: string;
  symbolName: string;
  sourcePath: string;
  repoLabel: string;
};

const btn: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid var(--cp-border)',
  background: 'var(--cp-bg-deep)',
  color: 'var(--cp-text)',
  cursor: 'pointer',
  fontSize: 13,
};

const primaryBtn: CSSProperties = {
  ...btn,
  background: 'var(--cp-accent)',
  color: 'var(--cp-on-accent, #fff)',
  borderColor: 'transparent',
  fontWeight: 600,
};

async function ensureSession(): Promise<boolean> {
  const r = await fetch('/api/queue', { credentials: 'include' });
  if (r.status !== 401) return r.ok;
  const c = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    credentials: 'include',
  });
  if (!c.ok) return false;
  await new Promise((res) => setTimeout(res, 0));
  return true;
}

export function HomeClient() {
  const dashboard = useDashboardStats();
  const refreshDashboard = dashboard?.refreshDashboard;
  const [memosOpen, setMemosOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [repos, setRepos] = useState<string[]>([]);
  const [repoLabel, setRepoLabel] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>({ total: 0, reviewed: 0, pending: 0 });
  const [pendingPreviews, setPendingPreviews] = useState<PendingPreview[]>([]);

  const applyPayload = useCallback(
    (j: { repos: string[]; repoLabel: string | null; progress: Progress; pendingPreviews: PendingPreview[] }) => {
      setRepos(j.repos);
      setRepoLabel(j.repoLabel);
      setProgress(j.progress);
      setPendingPreviews(j.pendingPreviews ?? []);
    },
    [],
  );

  const loadQueue = useCallback(async () => {
    const r = await fetch('/api/queue', { credentials: 'include' });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(t || `queue ${r.status}`);
    }
    const j = (await r.json()) as {
      repos: string[];
      repoLabel: string | null;
      progress: Progress;
      pendingPreviews: PendingPreview[];
    };
    applyPayload(j);
  }, [applyPayload]);

  const saveFocusRepo = useCallback(
    async (next: string | null) => {
      const r = await fetch('/api/queue', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ repoLabel: next }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || (await r.text()) || `save ${r.status}`);
      }
      const j = (await r.json()) as {
        repos: string[];
        repoLabel: string | null;
        progress: Progress;
        pendingPreviews: PendingPreview[];
      };
      applyPayload(j);
    },
    [applyPayload],
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ok = await ensureSession();
        if (!alive) return;
        if (!ok) {
          setErr('Could not create session');
          setReady(true);
          return;
        }
        await loadQueue();
        if (!alive) return;
        setReady(true);
      } catch (e) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
        setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadQueue]);

  useEffect(() => {
    if (!ready || !refreshDashboard) return;
    refreshDashboard();
  }, [ready, refreshDashboard]);

  const onRepoChange = async (value: string) => {
    setErr(null);
    const next = value === '' ? null : value;
    try {
      await saveFocusRepo(next);
      refreshDashboard?.();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const stats = dashboard?.stats;

  if (!ready) {
    return <p style={{ opacity: 0.75 }}>Loading…</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <MemosHistoryPanel open={memosOpen} onClose={() => setMemosOpen(false)} />
      <header>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem', fontWeight: 700 }}>Home</h2>
        <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
          Choose a <strong>repository</strong> (deck) to review. Swipe serves <strong>unswiped</strong> snippets from that
          repo first; progress counts how many snippets in the repo you have already liked or skipped. When nothing is
          left in the repo, the feed continues with the rest of the deck at random.
        </p>
      </header>

      {err ? (
        <p role="alert" style={{ margin: 0, color: 'var(--cp-error)', fontSize: 14 }}>
          {err}
        </p>
      ) : null}

      <section aria-labelledby="home-repo">
        <h3 id="home-repo" style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
          Focus repository
        </h3>
        {repos.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>No repos in the database yet — run a scan or seed.</p>
        ) : (
          <select
            id="home-repo-select"
            value={repoLabel ?? ''}
            onChange={(e) => void onRepoChange(e.target.value)}
            style={{
              maxWidth: '100%',
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--cp-border)',
              background: 'var(--cp-surface)',
              color: 'var(--cp-text)',
              fontSize: 14,
            }}
          >
            <option value="">All snippets (no focus)</option>
            {repos.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </section>

      <section aria-labelledby="home-progress">
        <h3 id="home-progress" style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
          Progress in focus repo
        </h3>
        {repoLabel ? (
          <>
            <p style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600 }}>
              {progress.reviewed} / {progress.total} reviewed
              <span style={{ fontWeight: 400, fontSize: 14, opacity: 0.75, marginLeft: 8 }}>
                ({progress.pending} left)
              </span>
            </p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
              “Reviewed” means you already swiped (like or skip) that snippet. Up to 15 upcoming unswiped cards:
            </p>
            {pendingPreviews.length === 0 ? (
              <p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.75 }}>None left in this repo — swipe will use the global deck.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0 }}>
                {pendingPreviews.map((p) => (
                  <li
                    key={p.cardId}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid var(--cp-border)',
                      borderRadius: 8,
                      marginBottom: 6,
                      background: 'var(--cp-bg-deep)',
                      fontSize: 13,
                    }}
                  >
                    <strong>{p.symbolName}</strong>
                    <span style={{ opacity: 0.55, marginLeft: 6 }}>· {p.repoLabel}</span>
                    <div style={{ fontSize: 12, opacity: 0.65, wordBreak: 'break-all' }}>{p.sourcePath}</div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 14, opacity: 0.75 }}>
            Select a repository to track progress here, or leave “All snippets” for a random feed across the whole deck.
          </p>
        )}
      </section>

      {stats ? (
        <section aria-labelledby="home-kpis">
          <h3 id="home-kpis" style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>
            Snapshot
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            {[
              { label: 'Snippets in deck', value: stats.cardsTotal },
              { label: 'Your likes', value: stats.likesTotal },
              { label: 'Your skips', value: stats.skipsTotal },
              { label: 'Your memos', value: stats.cardsWithMemoCount },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: 'var(--cp-bg-deep)',
                  border: '1px solid var(--cp-border)',
                  borderRadius: 10,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{k.value}</div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p style={{ opacity: 0.65, fontSize: 14 }}>Loading stats…</p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Link href="/swipe" style={primaryBtn}>
          Start swiping
        </Link>
        <button type="button" style={btn} onClick={() => setMemosOpen(true)} aria-expanded={memosOpen}>
          Memos
        </button>
        <button type="button" style={btn} onClick={() => refreshDashboard?.()}>
          Refresh stats
        </button>
      </div>
    </div>
  );
}
