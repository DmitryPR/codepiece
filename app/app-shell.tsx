'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { dailyCodingTagline } from './coding-swipe-jokes';
import { DashboardStatsProvider, useDashboardStats } from './dashboard-context';
import { ThemePicker } from './theme-picker';

function truncatePath(s: string, max = 36): string {
  if (s.length <= max) return s;
  return `…${s.slice(-(max - 1))}`;
}

function DashboardPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ctx = useDashboardStats();
  const refreshDashboard = ctx?.refreshDashboard;

  useEffect(() => {
    if (!open || !refreshDashboard) return;
    refreshDashboard();
  }, [open, refreshDashboard]);

  if (!ctx || !open) return null;

  const { stats, lastLikedCardId } = ctx;

  const maxLikes = stats?.topByLikes.length
    ? Math.max(...stats.topByLikes.map((t) => t.likeCount), 1)
    : 1;

  return (
    <>
      <button
        type="button"
        aria-label="Close stats panel"
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
        id="dashboard-stats-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-stats-title"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(420px, 100vw)',
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
          }}
        >
          <h2 id="dashboard-stats-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
            Stats
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
          {!stats ? (
            <p style={{ opacity: 0.7, margin: 0 }}>Loading…</p>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginBottom: 20,
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
                    <div style={{ fontSize: '1.35rem', fontWeight: 600 }}>{k.value}</div>
                  </div>
                ))}
              </div>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, opacity: 0.75, fontWeight: 600 }}>
                Your snippets by like count
              </h3>
              {stats.topByLikes.length === 0 ? (
                <p style={{ opacity: 0.65, fontSize: 13, margin: 0 }}>You have not liked anything yet.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {stats.topByLikes.map((row, i) => {
                    const pct = (row.likeCount / maxLikes) * 100;
                    const highlighted = lastLikedCardId === row.cardId;
                    return (
                      <li
                        key={`${row.cardId}-${row.likeCount}-${i}`}
                        style={{
                          marginBottom: 12,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid var(--cp-border)',
                          background: highlighted ? 'var(--cp-accent-subtle)' : 'var(--cp-bg-deep)',
                        }}
                      >
                        <div style={{ padding: '8px 10px 6px', fontSize: 12 }}>
                          <strong>{row.symbolName}</strong>
                          <span style={{ opacity: 0.55, marginLeft: 6 }}>· {row.repoLabel}</span>
                          <div style={{ opacity: 0.65, fontSize: 11, marginTop: 2, wordBreak: 'break-all' }}>
                            {truncatePath(row.sourcePath)}
                          </div>
                        </div>
                        <div
                          style={{
                            height: 6,
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
                        <div style={{ padding: '4px 10px 8px', fontSize: 11, opacity: 0.7 }}>
                          {row.likeCount} like{row.likeCount === 1 ? '' : 's'}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

const navLinkStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--cp-accent)',
  textDecoration: 'none',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--cp-border)',
};

function AppChrome({ children }: { children: ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const pathname = usePathname();
  const isSwipe = pathname === '/swipe';

  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 20px',
          borderBottom: '1px solid var(--cp-border)',
          background: 'var(--cp-bg-deep)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <Link
          href="/"
          aria-labelledby="cp-brand-title"
          style={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <span style={{ flexShrink: 0, lineHeight: 0, alignSelf: 'flex-start' }}>
            <img
              src="/brand/codepiece-logo.png"
              alt=""
              width={320}
              height={90}
              style={{
                height: 64,
                width: 'auto',
                maxWidth: 'min(42vw, 280px)',
                display: 'block',
              }}
            />
          </span>
          <div style={{ minWidth: 0, paddingTop: 2 }}>
            <span
              id="cp-brand-title"
              role="heading"
              aria-level={1}
              style={{ display: 'block', fontSize: '1.45rem', fontWeight: 700, lineHeight: 1.2 }}
            >
              CodePiece
            </span>
            <span
              style={{
                display: 'block',
                margin: '6px 0 0',
                fontSize: 13,
                opacity: 0.75,
                lineHeight: 1.35,
              }}
            >
              {dailyCodingTagline(isSwipe)}
            </span>
          </div>
        </Link>
        <div
          style={{
            display: 'flex',
            flexShrink: 0,
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {!isSwipe ? (
            <Link href="/swipe" style={navLinkStyle}>
              Swipe
            </Link>
          ) : null}
          <ThemePicker />
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-expanded={panelOpen}
            aria-controls="dashboard-stats-panel"
            style={{
              flexShrink: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--cp-border)',
              background: 'transparent',
              color: 'var(--cp-text)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            <span aria-hidden>📊</span>
            Stats
          </button>
        </div>
      </header>
      <DashboardPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
      {children}
    </>
  );
}

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardStatsProvider>
      <AppChrome>{children}</AppChrome>
    </DashboardStatsProvider>
  );
}
