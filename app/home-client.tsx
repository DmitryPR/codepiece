'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useDashboardStats } from './dashboard-context';

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
        <button type="button" style={btn} onClick={() => refreshDashboard?.()}>
          Refresh stats
        </button>
      </div>
    </div>
  );
}
