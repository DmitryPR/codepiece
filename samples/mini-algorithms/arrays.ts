/**
 * Pair elements from two arrays until the shorter one ends.
 */
export function zip<A, B>(as: A[], bs: B[]): [A, B][] {
  const n = Math.min(as.length, bs.length);
  const out: [A, B][] = [];
  for (let i = 0; i < n; i++) out.push([as[i], bs[i]]);
  return out;
}

/**
 * Sum of numeric array (empty array → 0).
 */
export function sum(nums: number[]): number {
  let s = 0;
  for (const n of nums) s += n;
  return s;
}
