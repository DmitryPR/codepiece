import './happy-dom-globals';
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { cleanup, render, fireEvent, waitFor } from '@testing-library/react';
import type { DashboardStatsPayload } from '../../src/lib/dashboard-stats';
import { DashboardStatsProvider, useDashboardStats } from '../../app/dashboard-context';

const sampleStats: DashboardStatsPayload = {
  cardsTotal: 7,
  likesTotal: 12,
  skipsTotal: 3,
  cardsWithMemoCount: 2,
  topByLikes: [
    {
      cardId: 'c1',
      symbolName: 'alpha',
      repoLabel: 'lab',
      sourcePath: 'a.ts',
      likeCount: 5,
    },
  ],
};

function StatsProbe() {
  const ctx = useDashboardStats();
  return (
    <div>
      <span data-testid="cards">{ctx?.stats?.cardsTotal ?? 'null'}</span>
      <span data-testid="likes">{ctx?.stats?.likesTotal ?? 'null'}</span>
      <span data-testid="highlight">{ctx?.lastLikedCardId ?? 'none'}</span>
      <button type="button" onClick={() => ctx?.refreshDashboard()}>
        refresh
      </button>
      <button type="button" onClick={() => ctx?.refreshDashboard('card-xyz')}>
        refresh-after-like
      </button>
    </div>
  );
}

let fetchCalls: string[] = [];
let originalFetch: typeof fetch;

beforeEach(() => {
  fetchCalls = [];
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetchCalls.push(String(input));
    return new Response(JSON.stringify(sampleStats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe('DashboardStatsProvider (UI)', () => {
  test('refreshDashboard fetches /api/dashboard/stats and exposes payload', async () => {
    const view = render(
      <DashboardStatsProvider>
        <StatsProbe />
      </DashboardStatsProvider>,
    );

    fireEvent.click(view.getByRole('button', { name: 'refresh' }));

    await waitFor(() => {
      expect(view.getByTestId('cards').textContent).toBe('7');
    });
    expect(view.getByTestId('likes').textContent).toBe('12');
    expect(fetchCalls.some((u) => u.includes('/api/dashboard/stats'))).toBe(true);
  });

  test('refreshDashboard(likedId) sets lastLikedCardId briefly', async () => {
    const view = render(
      <DashboardStatsProvider>
        <StatsProbe />
      </DashboardStatsProvider>,
    );

    fireEvent.click(view.getByRole('button', { name: 'refresh-after-like' }));

    await waitFor(() => {
      expect(view.getByTestId('highlight').textContent).toBe('card-xyz');
    });

    await waitFor(
      () => {
        expect(view.getByTestId('highlight').textContent).toBe('none');
      },
      { timeout: 3000 },
    );
  });
});
