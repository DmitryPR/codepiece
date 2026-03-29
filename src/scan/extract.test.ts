import { describe, expect, test } from 'bun:test';
import { extractFromSource, humanizeSymbolName } from './extract';

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

  test('uses @description when main JSDoc body empty', () => {
    const src = `
/**
 * @description Computes the checksum for a buffer
 */
export function checksum(buf: Uint8Array): number {
  return 0;
}
`;
    const cards = extractFromSource('c.ts', src);
    expect(cards.length).toBe(1);
    expect(cards[0].contextSummary).toContain('checksum');
    expect(cards[0].contextSummary.startsWith('[heuristic]')).toBe(false);
  });

  test('uses // comment before function when no JSDoc', () => {
    const src = `
// Validates input before save
export function validate(x: string): boolean {
  return x.length > 0;
}
`;
    const cards = extractFromSource('v.ts', src);
    expect(cards.length).toBe(1);
    expect(cards[0].contextSummary).toContain('Validates');
    expect(cards[0].contextSummary.startsWith('[heuristic]')).toBe(false);
  });

  test('heuristic summarizes without echoing raw signature', () => {
    const src = `
export function getUserById(userId: string, flags?: boolean): Promise<{ id: string } | null> {
  return Promise.resolve(null);
}
`;
    const cards = extractFromSource('u.ts', src);
    expect(cards.length).toBe(1);
    expect(cards[0].contextSummary.startsWith('[heuristic]')).toBe(true);
    expect(cards[0].contextSummary).toContain('Get user by id');
    expect(cards[0].contextSummary).toContain('Takes 2 arguments');
    expect(cards[0].contextSummary).toContain('userId');
    expect(cards[0].contextSummary).not.toContain('getUserById(');
  });
});

describe('humanizeSymbolName', () => {
  test('splits camelCase and capitalizes', () => {
    expect(humanizeSymbolName('getUserById')).toBe('Get user by id');
    expect(humanizeSymbolName('XMLParser')).toBe('Xml parser');
  });
});
