import { describe, expect, test } from 'bun:test';
import { extractFromSource } from './extract';

describe('extractFromSource', () => {
  test('extracts top-level function with JSDoc', () => {
    const src = `
/** One-line doc */
export function foo(a: number): number {
  return a + 1;
}
`;
    const cards = extractFromSource('f.ts', src);
    expect(cards.length).toBe(1);
    expect(cards[0].symbolName).toBe('foo');
    expect(cards[0].contextSummary).toContain('One-line');
    expect(cards[0].snippetText).toContain('return a + 1');
  });

  test('skips huge functions', () => {
    const body = Array(250).fill('  x++;').join('\n');
    const src = `export function big() {\n${body}\n}`;
    const cards = extractFromSource('big.ts', src);
    expect(cards.length).toBe(0);
  });

  test('extracts class method', () => {
    const src = `
export class Q {
  /** dequeue head */
  pop(): number | undefined { return undefined; }
}
`;
    const cards = extractFromSource('q.ts', src);
    expect(cards.some((c) => c.symbolName.includes('pop'))).toBe(true);
  });
});
