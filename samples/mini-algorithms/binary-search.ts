/**
 * Classic binary search on a sorted array of numbers.
 * Returns the index of `needle`, or -1 if not found.
 */
export function binarySearch(sorted: number[], needle: number): number {
  let low = 0;
  let high = sorted.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const v = sorted[mid];
    if (v === needle) return mid;
    if (v < needle) low = mid + 1;
    else high = mid - 1;
  }

  return -1;
}

/**
 * Returns true if `sorted` contains `needle` (wrapper around binarySearch).
 */
export function includesSorted(sorted: number[], needle: number): boolean {
  return binarySearch(sorted, needle) >= 0;
}
