/** Max length after trim; counted as Unicode code points (`for…of`). */
export const MEMO_MAX_CODE_POINTS = 600;

export function countCodePoints(s: string): number {
  let n = 0;
  for (const _ of s) n += 1;
  return n;
}

export function normalizeMemoInput(raw: string): { ok: true; body: string } | { ok: false; error: string } {
  const body = raw.trim();
  if (countCodePoints(body) > MEMO_MAX_CODE_POINTS) {
    return { ok: false, error: `memo must be at most ${MEMO_MAX_CODE_POINTS} characters` };
  }
  return { ok: true, body };
}

/** Truncate so drafts never exceed the cap (Unicode code points). */
export function clampToMaxCodePoints(s: string, max: number = MEMO_MAX_CODE_POINTS): string {
  if (countCodePoints(s) <= max) return s;
  let out = '';
  let n = 0;
  for (const ch of s) {
    if (n >= max) break;
    out += ch;
    n += 1;
  }
  return out;
}
