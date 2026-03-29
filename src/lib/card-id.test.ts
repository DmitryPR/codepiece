import { describe, expect, test } from 'bun:test';
import { stableCardId } from './card-id';

describe('stableCardId', () => {
  test('stable', () => {
    expect(stableCardId('r', 'a.ts', 'foo')).toBe(stableCardId('r', 'a.ts', 'foo'));
  });
  test('differs by symbol', () => {
    expect(stableCardId('r', 'a.ts', 'foo')).not.toBe(stableCardId('r', 'a.ts', 'bar'));
  });
});
