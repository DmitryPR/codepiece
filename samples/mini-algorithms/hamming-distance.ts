/**
 * Hamming distance: count of positions where two equal-length strings differ.
 * Throws if lengths mismatch.
 */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) {
    throw new Error('hammingDistance: strings must have equal length');
  }
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++;
  }
  return d;
}
